import { WebSocket, WebSocketServer } from "ws";
import { FailResponse, Request, SessionCreateReq, SessionJoinReq, SuccessResponse } from "./types/messages";
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

        case "SessionJoin":
          joinSession(request as SessionJoinReq, ws);
      
        default:
          break;
      }

    }
  });
});

function sendGenericSuccess(reqId: string, ws: WebSocket) {
  const res: SuccessResponse = {
    type: "ConfirmationResponse",
    ok: true,
    reqId: reqId,
  };
  return ws.send(JSON.stringify(res));
}

function joinSession({ reqId, sessionId }: SessionJoinReq, editor: WebSocket) {
  if (!(sessionId in sessions)) {
    const res: FailResponse = {
      type: "ConfirmationResponse",
      ok: false,
      message: "Session ID does not exist",
      reqId: reqId,
    };
    editor.send(JSON.stringify(res));
  }

  if (sessions[sessionId].editor) {
    const res: FailResponse = {
      type: "ConfirmationResponse",
      ok: false,
      message: "Someone is already editing the factory",
      reqId: reqId,
    };
    editor.send(JSON.stringify(res));
  }

  sessions[sessionId].editor = editor;

  sendGenericSuccess(reqId, editor);
}

function createSession({ reqId, sessionId }: SessionCreateReq, computerCraft: WebSocket) {
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

  sendGenericSuccess(reqId, computerCraft);
}