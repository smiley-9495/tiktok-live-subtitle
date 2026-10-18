// 자막 릴레이: 컨트롤 페이지 -> (WebSocket) -> Durable Object -> 오버레이 페이지들
export class Room {
  constructor(ctx, env) {
    this.ctx = ctx;
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
    if (url.pathname === "/health") {
      return new Response("ok" + (env.CONTROL_KEY ? "" : " (CONTROL_KEY 미설정)"));
    }
    if (url.pathname === "/ws") {
      const room = (url.searchParams.get("room") || "main").slice(0, 64);
      if (url.searchParams.get("role") === "control") {
        if (!env.CONTROL_KEY) return new Response("CONTROL_KEY not set", { status: 401 });
        if (url.searchParams.get("key") !== env.CONTROL_KEY) return new Response("unauthorized", { status: 401 });
      }
      return env.ROOM.get(env.ROOM.idFromName(room)).fetch(req);
    }
    return env.ASSETS.fetch(req);
  },
};
