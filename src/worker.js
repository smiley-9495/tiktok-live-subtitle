// Best-effort in-memory cache per Worker isolate. Cache only successful translations.
const TRANSLATION_CACHE_TTL_MS = 30 * 60 * 1000;
const TRANSLATION_CACHE_MAX = 3000;
const translationCache = new Map();
const translationInFlight = new Map();

async function translateWithProviders(text, target, env) {
  // Google Translate public web endpoint only. Unofficial and may be rate-limited or changed.
  const endpoint = new URL('https://translate.googleapis.com/translate_a/single');
  endpoint.searchParams.set('client', 'gtx');
  endpoint.searchParams.set('sl', 'ko');
  endpoint.searchParams.set('tl', target);
  endpoint.searchParams.set('dt', 't');
  endpoint.searchParams.set('q', text);

  const upstream = await fetch(endpoint.toString(), {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(5000)
  });
  if (!upstream.ok) throw new Error('Google public endpoint HTTP ' + upstream.status);
  const data = await upstream.json();
  const translatedText = Array.isArray(data?.[0])
    ? data[0].map(part => Array.isArray(part) ? part[0] || '' : '').join('').trim()
    : '';
  if (!translatedText) throw new Error('Google public endpoint returned an empty translation');
  return { translatedText, target, provider: 'google-public' };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/translate' && request.method === 'GET') {
      const target = url.searchParams.get('target') || '';
      const text = (url.searchParams.get('q') || '').trim();
      const allowedTargets = new Set(['en', 'zh-CN', 'ja']);
      if (!allowedTargets.has(target)) {
        return Response.json({ error: '지원하지 않는 번역 언어입니다.' }, { status: 400 });
      }
      if (!text || text.length > 450) {
        return Response.json({ error: '번역 문장은 1~450자여야 합니다.' }, { status: 400 });
      }

      // Short-lived isolate memory cache: avoids repeat billing/latency for repeated phrases.
      // This cache is best-effort and is not shared across all Cloudflare isolates.
      const cacheKey = target + '\u0000' + text;
      const cached = translationCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return Response.json({ ...cached.payload, cached: true }, {
          headers: { 'Cache-Control': 'no-store', 'X-Translation-Cache': 'HIT' }
        });
      }
      if (cached) translationCache.delete(cacheKey);

      // Coalesce identical requests arriving at the same isolate at the same time.
      if (translationInFlight.has(cacheKey)) {
        try {
          const payload = await translationInFlight.get(cacheKey);
          return Response.json({ ...payload, cached: true }, {
            headers: { 'Cache-Control': 'no-store', 'X-Translation-Cache': 'COALESCED' }
          });
        } catch (_) {
          // The original request will report the detailed error; this request retries below.
        }
      }

      const work = translateWithProviders(text, target, env);
      translationInFlight.set(cacheKey, work);
      try {
        const payload = await work;
        translationCache.set(cacheKey, { payload, expiresAt: Date.now() + TRANSLATION_CACHE_TTL_MS });
        while (translationCache.size > TRANSLATION_CACHE_MAX) {
          translationCache.delete(translationCache.keys().next().value);
        }
        return Response.json(payload, {
          headers: { 'Cache-Control': 'no-store', 'X-Translation-Cache': 'MISS' }
        });
      } catch (error) {
        return Response.json({
          error: '모든 번역 서비스에 연결하지 못했습니다. API 키, 결제/무료 한도, 네트워크를 확인하세요.',
          details: [String(error?.message || error)]
        }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
      } finally {
        if (translationInFlight.get(cacheKey) === work) translationInFlight.delete(cacheKey);
      }
    }

    if (url.pathname.startsWith('/ws/')) {
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
        return new Response('WebSocket upgrade required', { status: 426 });
      }
      const room = decodeURIComponent(url.pathname.slice('/ws/'.length));
      if (!room || room.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(room)) {
        return new Response('Invalid room id', { status: 400 });
      }
      const id = env.SUBTITLE_ROOMS.idFromName(room);
      return env.SUBTITLE_ROOMS.get(id).fetch(request);
    }
    return env.ASSETS.fetch(request);
  }
};

export class SubtitleRoom {
  constructor(state, env) { this.state = state; this.env = env; }

  async fetch(request) {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('WebSocket upgrade required', { status: 426 });
    }
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.state.acceptWebSocket(server);
    const settings = await this.state.storage.get('settings');
    const lines = await this.state.storage.get('lines');
    try {
      if (settings) server.send(JSON.stringify({ channel: 'tiktok-live-subtitle-sync-v1', type: 'settings', payload: settings, at: Date.now() }));
      if (lines) server.send(JSON.stringify({ channel: 'tiktok-live-subtitle-sync-v1', type: 'lines', payload: lines, at: Date.now() }));
    } catch (_) {}
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    let data;
    try {
      if (typeof message !== 'string' || message.length > 12000) return;
      data = JSON.parse(message);
    } catch (_) { return; }
    if (!data || data.channel !== 'tiktok-live-subtitle-sync-v1' || !['settings', 'lines'].includes(data.type) || !data.payload || typeof data.payload !== 'object') return;
    const payload = data.payload;
    if (data.type === 'settings') {
      const clean = {
        transparency: Math.max(0, Math.min(100, Number(payload.transparency) || 0)),
        font: Math.max(12, Math.min(72, Number(payload.font) || 24)),
        langs: Object.fromEntries(['ko','en','zh-CN','ja'].map(k => [k, !(payload.langs && payload.langs[k] === false)]))
      };
      await this.state.storage.put('settings', clean);
      data.payload = clean;
    } else {
      const clean = {};
      for (const key of ['ko','en','zh-CN','ja']) clean[key] = String(payload[key] || '').slice(0, 1200);
      clean.at = Date.now();
      await this.state.storage.put('lines', clean);
      data.payload = clean;
    }
    const encoded = JSON.stringify(data);
    for (const socket of this.state.getWebSockets()) {
      try { socket.send(encoded); } catch (_) {}
    }
  }

  webSocketClose(ws, code, reason, wasClean) {
    try { ws.close(code, 'connection closed'); } catch (_) {}
  }
  webSocketError(ws, error) {
    try { ws.close(1011, 'socket error'); } catch (_) {}
  }
}
