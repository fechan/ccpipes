import { WebSocket } from "ws";

export type SessionId = string;

export interface Session {
  id: SessionId,
  computerCraft: WebSocket,
  editor?: WebSocket,
};