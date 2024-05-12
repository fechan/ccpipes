import { WebSocket, WebSocketServer } from "ws";
import { FailResponse, IdleTimeout, MessageType, Request, SessionCreateReq, SessionCreateRes, SessionJoinReq, SessionRejoinReq, SuccessResponse } from "./types/messages";
import { Session, SessionId } from "./types/session";
import { v4 as uuidv4 } from "uuid";

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

    const session = sessions[sessionId];
    if (session) resetIdleTimer(session);

    try {
      if ("reqId" in message) {
        const request: Request = message;
        
        switch (request.type) {
          case "SessionCreate":
            sessionId = createSession(request as SessionCreateReq, ws);
            if (sessionId) {
              role = 'CC';
              resetIdleTimer(sessions[sessionId]);
            }
            break;
            
          case "SessionJoin":
            sessionId = joinSession(request as SessionJoinReq, ws);
            if (sessionId) role = 'editor';
            break;

          case "SessionRejoin":
            sessionId = rejoinSession(message as SessionRejoinReq, ws);
            if (sessionId) role = 'CC';
            break;
        
          default:
            const destination = role === 'CC' ? 'editor' : 'CC';
            if ((role === 'CC' && !session.editor) || (role === 'editor' && !session.computerCraft)) {
              const res: FailResponse = {
                type: "ConfirmationResponse",
                respondingTo: message.type,
                ok: false,
                reqId: message.reqId,
                error: 'PeerNotConnected',
                message: `Tried sending a message to ${destination}, but it doesn't exist on this session.`
              };
              ws.send(JSON.stringify(res));
            } else {
              relayMessage(json, sessionId, destination);
            }
            break;
        }
      } else if (message.type === "CcUpdatedFactory") {
        const destination = role === 'CC' ? 'editor' : 'CC';
        if ((role === 'CC' && !session.editor) || (role === 'editor' && !session.computerCraft)) {
          const res: FailResponse = {
            type: "ConfirmationResponse",
            respondingTo: message.type,
            ok: false,
            error: 'PeerNotConnected',
            message: `Tried sending a message to ${destination}, but it doesn't exist on this session.`
          };
          ws.send(JSON.stringify(res));
        } else {
          relayMessage(json, sessionId, destination);
        }
      }
    } catch (error) {
      console.error(`Caught error ${error.name}: ${error.message}`);
      const res: FailResponse = {
        type: "ConfirmationResponse",
        respondingTo: message.type,
        ok: false,
        error: 'UnknownError',
        message: 'Unknown error!'
      };
      ws.send(JSON.stringify(res));
      ws.close()
    }
  });

  ws.on("close", (data) => {
    if (role === "CC" && sessionId && sessions[sessionId]) {
      sessions[sessionId].computerCraft = undefined;
    } else if (role === "editor" && sessionId && sessions[sessionId]) {
      sessions[sessionId].editor = undefined;
    }
  });
});

function resetIdleTimer(session: Session) {
  if (session.idleTimerId) {
    clearTimeout(session.idleTimerId);
  }

  session.idleTimerId = setTimeout(() => {
    console.log('timeout reached')

    const timeoutMsg: IdleTimeout = {
      type: "IdleTimeout",
      message: "10 minutes passed without any edits."
    };

    if (session.computerCraft) {
      session.computerCraft.send(JSON.stringify(timeoutMsg));
      session.computerCraft.close();
    }
    if (session.editor) {
      session.editor.send(JSON.stringify(timeoutMsg));
      session.editor.close();
    }
  }, 10 * 60 * 1000)
}

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
      error: 'SessionIdNotExist',
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
      error: 'SessionHasEditor',
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

function rejoinSession({ reqId, sessionId, ccReconnectToken }: SessionRejoinReq, computerCraft: WebSocket) {
  if (!sessions[sessionId]) {
    const res: FailResponse = {
      type: "ConfirmationResponse",
      respondingTo: "SessionRejoin",
      ok: false,
      error: 'SessionIdNotExist',
      message: "Cannot connect to an expired session ID",
      reqId: reqId,
    };
    computerCraft.send(JSON.stringify(res));
    return;
  }

  if (sessions[sessionId].ccReconnectToken !== ccReconnectToken) {
    const res: FailResponse = {
      type: "ConfirmationResponse",
      respondingTo: "SessionRejoin",
      ok: false,
      error: 'BadReconnectToken',
      message: "Reconnect token incorrect",
      reqId: reqId,
    };
    computerCraft.send(JSON.stringify(res));
    return;
  }

  sessions[sessionId].computerCraft = computerCraft;

  const res: SessionCreateRes = {
    type: "ConfirmationResponse",
    respondingTo: "SessionRejoin",
    ok: true,
    reqId: reqId,
    ccReconnectToken: ccReconnectToken,
  };
  computerCraft.send(JSON.stringify(res));

  return sessionId as SessionId;
}

/**
 * Create a session and add the ComputerCraft computer to it
 * @param param0 Session create request
 * @param computerCraft Websocket of the CC computer
 * @returns Session ID on success, undefined on failure
 */
function createSession({ reqId, sessionId }: SessionCreateReq, computerCraft: WebSocket) {
  if (sessionId in sessions) {
    const res: FailResponse = {
      type: "ConfirmationResponse",
      respondingTo: "SessionCreate",
      ok: false,
      error: 'SessionIdTaken',
      message: "Session ID already exists",
      reqId: reqId,
    };
    computerCraft.send(JSON.stringify(res));
    return;
  }

  const ccReconnectToken = uuidv4();

  sessions[sessionId] = {
    id: sessionId,
    computerCraft: computerCraft,
    ccReconnectToken: ccReconnectToken,
  };

  const res: SessionCreateRes = {
    type: "ConfirmationResponse",
    respondingTo: "SessionCreate",
    ok: true,
    reqId: reqId,
    ccReconnectToken: ccReconnectToken,
  };
  computerCraft.send(JSON.stringify(res));

  return sessionId as SessionId;
}