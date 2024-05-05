import { WebSocket, WebSocketServer } from "ws";
import { FailResponse, MessageType, Request, SessionCreateReq, SessionJoinReq, SuccessResponse } from "./types/messages";
import { Session, SessionId } from "./types/session";

type Role = ('CC' | 'editor');

const wss = new WebSocketServer({ port: 3000 });

const sessions: { [key: SessionId]: Session } = {};

wss.on("connection", function connection(ws) {
  let sessionId: string;
  let role: Role;

  ws.on("error", console.error);

  ws.on("message", (data) => {
    const json = data.toString();
    const message = JSON.parse(json);
    console.log(message.type)

    try {
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
            // TODO: if either client sends WS messages when the other isn't there, this throw
            // we should probably check beforehand, and respond to the sender with an error
            relayMessage(json, sessionId, destination);
            break;
        }
      } else if (message.type === "CcUpdatedFactory") {
        const destination = role === 'CC' ? 'editor' : 'CC';
        // TODO: if either client sends WS messages when the other isn't there, this throw
        // we should probably check beforehand, and respond to the sender with an error
        relayMessage(json, sessionId, destination);
      }
    } catch (error) {
      console.error(`Caught error ${error.name}: ${error.message}`);
      ws.close()
    }
  });

  ws.on("close", (data) => {
    if (role === "CC" && sessionId && sessions[sessionId]) {
      sessions[sessionId].editor?.close();
      delete sessions[sessionId];
    } else if (role === "editor" && sessionId && sessions[sessionId]) {
      sessions[sessionId].editor = undefined;
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
    sessions[sessionId].computerCraft.send(message);
  } else {
    sessions[sessionId].editor.send(message);
  }
}

/**
 * Send a generic success response for the given request ID
 * @param messageType Type of request that this is a response to
 * @param reqId Request ID
 * @param ws Websocket to send to
 */
function sendGenericSuccess(respondingTo: MessageType, reqId: string, ws: WebSocket) {
  const res: SuccessResponse = {
    type: "ConfirmationResponse",
    respondingTo: respondingTo,
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
      respondingTo: "SessionJoin",
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
      respondingTo: "SessionJoin",
      ok: false,
      message: "Someone is already editing the factory",
      reqId: reqId,
    };
    editor.send(JSON.stringify(res));
    return;
  }

  sessions[sessionId].editor = editor;

  sendGenericSuccess("SessionJoin", reqId, editor);
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
      respondingTo: "SessionCreate",
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

  sendGenericSuccess("SessionCreate", reqId, computerCraft);
  return sessionId;
}