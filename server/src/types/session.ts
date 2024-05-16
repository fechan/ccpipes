import { WebSocket } from "ws";
import { Message } from "./messages";

export type SessionId = string;

export interface Session {
  id: SessionId,

  computerCraft?: WebSocket,
  editor?: WebSocket,

  idleTimerId?: ReturnType<typeof setTimeout>,
  ccReconnectToken?: string,

  /**
   * Messages from editor pending relay to CC. Used when CC disconnects
   * unexpectedly.
   */
  editorOutbox: Message[],
  /**
   * If the editorOutbox gets populated after being empty, a timer is started
   * which disconnects the editor if CC hasn't reconnected by the time the
   * timer is reached
   */
  staleOutboxTimerId?: ReturnType<typeof setTimeout>,
};