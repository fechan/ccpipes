/// <reference types="jest" />

import { ConfirmationResponse, SessionCreateReq, SessionJoinReq } from "../src/types/messages"
import { WebSocket as WS } from "ws";
import { randomBytes } from "crypto";

function generateRandomId() {
  return randomBytes(20).toString('hex');
}

const ws = new WS("ws://localhost:3000");
const sessionId = generateRandomId();

const createReqId = generateRandomId();
const joinReqId = generateRandomId();

/**
 * Create session
 */
const createReq: SessionCreateReq = {
  type: "SessionCreate",
  sessionId: sessionId,
  reqId: createReqId,
};

ws.on("open", () => {
  ws.send(JSON.stringify(createReq));
});

ws.on("message", (data) => {
  const res: ConfirmationResponse = JSON.parse(data.toString());
  if (res.reqId == createReqId) {
    console.log(res);

    const joinReq: SessionJoinReq = {
      type: "SessionJoin",
      sessionId: sessionId,
      reqId: joinReqId,
    };

    ws.send(JSON.stringify(joinReq));
  }
});

/**
 * Join session
 */
ws.on("message", (data) => {
  const res: ConfirmationResponse = JSON.parse(data.toString());
  if (res.reqId == joinReqId) {
    console.log(res);

    ws.close();
  }
})
