// Whisper-only multilingual speech transcription and speech-to-English translation.
// Whisper can recognize many source languages, but its built-in translate task outputs English only.
const WHISPER_MODEL = '@cf/openai/whisper-large-v3-turbo';

// whisper-large-v3-turbo expects audio as a Base64 string (not a number array).
function bytesToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/transcribe' && request.method === 'POST') {
      if (!env.AI) return Response.json({ error: 'Workers AI binding이 설정되지 않았습니다. wrangler.toml의 [ai] binding = "AI"를 확인하세요.' }, { status: 503 });
      const contentType = request.headers.get('Content-Type') || '';
      if (!contentType.startsWith('audio/')) {
        return Response.json({ error: '오디오 파일을 보내야 합니다.' }, { status: 415 });
      }
      const audio = await request.arrayBuffer();
      if (!audio.byteLength || audio.byteLength > 5 * 1024 * 1024) {
        return Response.json({ error: '오디오 크기는 1바이트~5MB여야 합니다.' }, { status: 413 });
      }
      const mode = url.searchParams.get('mode') || 'both';
      if (!['transcribe', 'translate', 'both'].includes(mode)) {
        return Response.json({ error: 'mode는 transcribe, translate, both 중 하나여야 합니다.' }, { status: 400 });
      }
      // The large-v3-turbo model requires Base64 audio.
      const audioBase64 = bytesToBase64(audio);
      const runWhisper = (task) => env.AI.run(WHISPER_MODEL, {
        audio: audioBase64,
        task,
        // Intentionally omit language so Whisper can identify the source language automatically.
        vad_filter: true
      });
      try {
        let sourceResult = null;
        let englishResult = null;
        if (mode === 'both') {
          [sourceResult, englishResult] = await Promise.all([
            runWhisper('transcribe'),
            runWhisper('translate')
          ]);
        } else if (mode === 'transcribe') {
          sourceResult = await runWhisper('transcribe');
        } else {
          englishResult = await runWhisper('translate');
        }
        const text = String(sourceResult?.text || sourceResult?.transcription_info?.text || '').trim().slice(0, 1800);
        const englishText = String(englishResult?.text || englishResult?.transcription_info?.text || '').trim().slice(0, 1800);
        const language = String(sourceResult?.transcription_info?.language || englishResult?.transcription_info?.language || 'auto').slice(0, 40);
        return Response.json({ text, englishText, language }, { headers: { 'Cache-Control': 'no-store' } });
      } catch (error) {
        return Response.json({ error: 'Whisper 음성 처리에 실패했습니다.', details: String(error?.message || error).slice(0, 500) }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
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
        langs: Object.fromEntries(['ko','en'].map(k => [k, Boolean(payload.langs && payload.langs[k] === true)]))
      };
      await this.state.storage.put('settings', clean);
      data.payload = clean;
    } else {
      const clean = {};
      for (const key of ['ko','en']) clean[key] = String(payload[key] || '').slice(0, 1200);
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
