import { WebSocket, WebSocketServer } from "ws";
import { FailResponse, Request, SessionCreateReq, SessionJoinReq, SuccessResponse } from "./types/messages";
import { Session, SessionId } from "./types/session";

type Role = ('CC' | 'editor');

const wss = new WebSocketServer({ port: 3000 });

const sessions: { [key: SessionId]: Session } = {};

wss.on("connection", function connection(ws) {
  let sessionId: string;
  let role: Role;

  ws.on("error", console.error);

  ws.on("message", function message(data) {
    const json = data.toString();
    const message = JSON.parse(json);

    if ("reqId" in message) {
      const request: Request = message;
      
      switch (request.type) {
        case "SessionCreate":
          sessionId = createSession(request as SessionCreateReq, ws);
          if (sessionId) role = 'CC';
          break;
          
        case "SessionJoin":
          sessionId = joinSession(request as SessionJoinReq, ws);
          if (sessionId) role = 'editor';
          break;
      
        default:
          const destination = role === 'CC' ? 'editor' : 'CC';
          relayMessage(json, sessionId, destination);
          break;
      }
    }
  });
});

/**
 * Relay a message from the editor to ComputerCraft or vice versa
 * @param message Message to relay
 * @param sessionId Session ID
 * @param to Websocket to relay to
 */
function relayMessage(message: string, sessionId: SessionId, to: Role) {
  if (to === 'CC') {
    sessions[sessionId].editor.send(message);
  } else {
    sessions[sessionId].computerCraft.send(message);
  }
}

/**
 * Send a generic success response for the given request ID
 * @param reqId Request ID
 * @param ws Websocket to send to
 */
function sendGenericSuccess(reqId: string, ws: WebSocket) {
  const res: SuccessResponse = {
    type: "ConfirmationResponse",
    ok: true,
    reqId: reqId,
  };
  ws.send(JSON.stringify(res));
}

/**
 * Join an editor to a session
 * @param param0 Session join request 
 * @param editor Websocket of the editor
 * @returns Session ID on success, undefined on failure
 */
function joinSession({ reqId, sessionId }: SessionJoinReq, editor: WebSocket): SessionId {  
  if (!(sessionId in sessions)) {
    const res: FailResponse = {
      type: "ConfirmationResponse",
      ok: false,
      message: "Session ID does not exist",
      reqId: reqId,
    };
    editor.send(JSON.stringify(res));
    return;
  }

  if (sessions[sessionId].editor) {
    const res: FailResponse = {
      type: "ConfirmationResponse",
      ok: false,
      message: "Someone is already editing the factory",
      reqId: reqId,
    };
    editor.send(JSON.stringify(res));
    return;
  }

  sessions[sessionId].editor = editor;

  sendGenericSuccess(reqId, editor);
  return sessionId;
}

/**
 * Create a session and add the ComputerCraft computer to it
 * @param param0 Session create request
 * @param computerCraft Websocket of the CC computer
 * @returns Session ID on success, undefined on failure
 */
function createSession({ reqId, sessionId }: SessionCreateReq, computerCraft: WebSocket): SessionId {
  if (sessionId in sessions) {
    const res: FailResponse = {
      type: "ConfirmationResponse",
      ok: false,
      message: "Session ID already exists",
      reqId: reqId,
    };
    computerCraft.send(JSON.stringify(res));
    return;
  }

  sessions[sessionId] = {
    id: sessionId,
    computerCraft: computerCraft
  };

  sendGenericSuccess(reqId, computerCraft);
  return sessionId;
}