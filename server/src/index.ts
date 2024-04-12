import { WebSocket, WebSocketServer } from "ws";
import { FailResponse, Request, SessionCreateReq } from "./types/messages";
import { Session, SessionId } from "./types/session";

const wss = new WebSocketServer({ port: 3000 });

const sessions: { [key: SessionId]: Session } = {};

wss.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("message", function message(data) {
    const json = data.toString();
    const message = JSON.parse(json);

    if ("reqId" in message) {
      const request: Request = message;
      switch (request.type) {
        case "SessionCreate":
          createSession(request as SessionCreateReq, ws);
          break;
      
        default:
          break;
      }

    }
  });
});

function createSession(createRequest: SessionCreateReq, computerCraft: WebSocket) {
  const { reqId, sessionId } = createRequest;

  if (sessionId in sessions) {
    const res: FailResponse = {
      type: "ConfirmationResponse",
      ok: false,
      message: "Session ID already exists",
      reqId: reqId,
    };
    computerCraft.send(JSON.stringify(res));
  }

  sessions[sessionId] = {
    id: sessionId,
    computerCraft: computerCraft
  };
}