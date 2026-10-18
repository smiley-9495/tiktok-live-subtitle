// 자막 릴레이: 사용자마다 전용 방(room) -> 컨트롤 페이지 -> (WebSocket) -> 오버레이
const ROOM_RE = /^[A-Za-z0-9_-]{12,64}$/;

export class Room {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.win = 0;
    this.count = 0;
    // 연결 유지용 ping은 객체를 깨우지 않고 자동 응답 (무료 사용량 절약)
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  async fetch(req) {
    if (req.headers.get("Upgrade") !== "websocket") {
      return new Response("websocket only", { status: 426 });
    }
    const role = new URL(req.url).searchParams.get("role") === "control" ? "control" : "view";
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [role]);
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws, msg) {
    if (!this.ctx.getTags(ws).includes("control")) return;
    if (typeof msg !== "string" || msg.length > 4000) return;
    // 방당 초당 40건 초과 시 무시 (남용 방지)
    const now = Math.floor(Date.now() / 1000);
    if (now !== this.win) { this.win = now; this.count = 0; }
    if (++this.count > 40) return;
    for (const v of this.ctx.getWebSockets("view")) {
      try { v.send(msg); } catch (e) {}
    }
  }

  webSocketClose(ws, code) {
    try { ws.close(code); } catch (e) {}
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/health") return new Response("ok");
    if (url.pathname === "/ws") {
      const room = url.searchParams.get("room") || "";
      if (!ROOM_RE.test(room)) return new Response("bad room", { status: 400 });
      return env.ROOM.get(env.ROOM.idFromName(room)).fetch(req);
    }
    return env.ASSETS.fetch(req);
  },
};
