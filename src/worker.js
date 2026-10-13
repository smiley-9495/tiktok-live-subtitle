// Best-effort in-memory cache per Worker isolate. Cache only successful translations.
const TRANSLATION_CACHE_TTL_MS = 30 * 60 * 1000;
const TRANSLATION_CACHE_MAX = 3000;
const translationCache = new Map();
const translationInFlight = new Map();

async function translateWithProviders(text, target, env) {
  const errors = [];
  // Primary: public LibreTranslate instances. No API key is needed on some instances;
  // availability and rate limits depend on each instance. Set LIBRETRANSLATE_URL to override.
  const libreTarget = ({ en: 'en', 'zh-CN': 'zh', ja: 'ja' })[target];
  const configuredLibre = String(env.LIBRETRANSLATE_URL || '').trim();
  const libreBases = configuredLibre
    ? [configuredLibre]
    : [
        'https://translate.argosopentech.com',
        'https://libretranslate.de',
        'https://trans.zillyhuhn.com',
        'https://translate.mentality.rip'
      ];
  for (const base of [...new Set(libreBases)]) {
    try {
      const endpoint = new URL(base.replace(/\/+$/, '') + (base.replace(/\/+$/, '').endsWith('/translate') ? '' : '/translate'));
      const body = { q: text, source: 'ko', target: libreTarget, format: 'text' };
      if (env.LIBRETRANSLATE_API_KEY) body.api_key = env.LIBRETRANSLATE_API_KEY;
      const upstream = await fetch(endpoint.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(4500)
      });
      if (!upstream.ok) throw new Error('LibreTranslate ' + new URL(base).host + ' HTTP ' + upstream.status);
      const data = await upstream.json();
      const translatedText = String(data?.translatedText || '').trim();
      if (!translatedText) throw new Error('LibreTranslate returned an empty translation');
      return { translatedText, target, provider: 'libretranslate' };
    } catch (error) { errors.push(String(error?.message || error)); }
  }

  // Fallback 1: official Google Cloud Translation (only if configured).
  if (env.GOOGLE_TRANSLATE_API_KEY) {
    try {
      const endpoint = new URL('https://translation.googleapis.com/language/translate/v2');
      endpoint.searchParams.set('key', env.GOOGLE_TRANSLATE_API_KEY);
      const upstream = await fetch(endpoint.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Accept': 'application/json' },
        body: JSON.stringify({ q: [text], source: 'ko', target, format: 'text' }),
        signal: AbortSignal.timeout(5500)
      });
      if (!upstream.ok) throw new Error('Google Cloud Translation HTTP ' + upstream.status);
      const data = await upstream.json();
      const translatedText = String(data?.data?.translations?.[0]?.translatedText || '').trim();
      if (!translatedText) throw new Error('Google Cloud Translation returned an empty translation');
      return { translatedText, target, provider: 'google-cloud-translation-fallback' };
    } catch (error) { errors.push(String(error?.message || error)); }
  }

  // Fallback 2: official Microsoft Translator API (only if configured).
  if (env.MICROSOFT_TRANSLATOR_KEY) {
    try {
      const microsoftTarget = ({ en: 'en', 'zh-CN': 'zh-Hans', ja: 'ja' })[target];
      const endpoint = new URL('https://api.cognitive.microsofttranslator.com/translate');
      endpoint.searchParams.set('api-version', '3.0'); endpoint.searchParams.set('from', 'ko'); endpoint.searchParams.set('to', microsoftTarget);
      const headers = { 'Ocp-Apim-Subscription-Key': env.MICROSOFT_TRANSLATOR_KEY, 'Content-Type': 'application/json; charset=UTF-8', 'Accept': 'application/json' };
      if (env.MICROSOFT_TRANSLATOR_REGION) headers['Ocp-Apim-Subscription-Region'] = env.MICROSOFT_TRANSLATOR_REGION;
      const upstream = await fetch(endpoint.toString(), { method: 'POST', headers, body: JSON.stringify([{ Text: text }]), signal: AbortSignal.timeout(5500) });
      if (!upstream.ok) throw new Error('Microsoft Translator HTTP ' + upstream.status);
      const data = await upstream.json();
      const translatedText = String(data?.[0]?.translations?.[0]?.text || '').trim();
      if (!translatedText) throw new Error('Microsoft Translator returned an empty translation');
      return { translatedText, target, provider: 'microsoft-translator-fallback' };
    } catch (error) { errors.push(String(error?.message || error)); }
  }

  // Fallback 3: DeepL API Free (only if configured).
  if (env.DEEPL_API_KEY) {
    try {
      const deeplTarget = ({ en: 'EN', 'zh-CN': 'ZH', ja: 'JA' })[target];
      const upstream = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST', headers: { 'Authorization': 'DeepL-Auth-Key ' + env.DEEPL_API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ text: [text], source_lang: 'KO', target_lang: deeplTarget }), signal: AbortSignal.timeout(5500)
      });
      if (!upstream.ok) throw new Error('DeepL HTTP ' + upstream.status);
      const data = await upstream.json();
      const translatedText = String(data?.translations?.[0]?.text || '').trim();
      if (!translatedText) throw new Error('DeepL returned an empty translation');
      return { translatedText, target, provider: 'deepl-fallback' };
    } catch (error) { errors.push(String(error?.message || error)); }
  }

  // Compatibility fallback: unofficial Google endpoint; may be rate-limited.
  try {
    const endpoint = new URL('https://translate.googleapis.com/translate_a/single');
    endpoint.searchParams.set('client', 'gtx'); endpoint.searchParams.set('sl', 'ko'); endpoint.searchParams.set('tl', target); endpoint.searchParams.set('dt', 't'); endpoint.searchParams.set('q', text);
    const upstream = await fetch(endpoint.toString(), { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(5500) });
    if (!upstream.ok) throw new Error('Google public endpoint HTTP ' + upstream.status);
    const data = await upstream.json();
    const translatedText = Array.isArray(data?.[0]) ? data[0].map(part => Array.isArray(part) ? part[0] || '' : '').join('').trim() : '';
    if (!translatedText) throw new Error('Google public endpoint returned an empty translation');
    return { translatedText, target, provider: 'google-public-fallback' };
  } catch (error) { errors.push(String(error?.message || error)); }

  // Last fallback: MyMemory; subject to provider limits.
  try {
    const endpoint = new URL('https://api.mymemory.translated.net/get');
    endpoint.searchParams.set('q', text); endpoint.searchParams.set('langpair', 'ko|' + target);
    const upstream = await fetch(endpoint.toString(), { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(5500) });
    if (!upstream.ok) throw new Error('MyMemory HTTP ' + upstream.status);
    const data = await upstream.json();
    const translatedText = String(data?.responseData?.translatedText || '').trim();
    const responseStatus = Number(data?.responseStatus || 0);
    if (!translatedText || (responseStatus && responseStatus !== 200)) throw new Error(String(data?.responseDetails || 'MyMemory returned an empty translation'));
    return { translatedText, target, provider: 'mymemory-fallback' };
  } catch (error) { errors.push(String(error?.message || error)); }

  throw new Error(errors.join(' / ') || 'No translation provider is available');
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
