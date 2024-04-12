import { Machine, MachineId, Pipe, PipeId } from "./core-types"
import { SessionId } from "./session";

export type MessageType = (
  "ConfirmationResponse" |
  "SessionCreate" | "SessionJoin" |
  "PipeAdd" | "PipeEdit" | "PipeDel" |
  "MachineAdd" | "MachineEdit" | "MachineDel" |
  "GroupAdd" | "GroupEdit" | "GroupDel"
);

export interface Message {
  type: MessageType,
};

export interface Request extends Message {
  reqId: string,
};

/**
 * A response confirming the success of a request.
 * 
 * - CC should always respond to requests
 * - The server should always relay responses from CC to the editor
 * - The server should only respond to `SessionCreate` requests from CC
 *   and `SessionJoin` requests from the editor
 * - The editor should never respond to requests from CC
 */
export interface ConfirmationResponse extends Message {
  type: "ConfirmationResponse"
  reqId: string,
  ok: boolean,
};

export interface SuccessResponse extends ConfirmationResponse {
  ok: true,
}

export interface FailResponse extends ConfirmationResponse {
  ok: false,
  message: string,
}

/**
 * Request for the creation of an editor session accessible via a session ID
 */
export interface SessionCreateReq extends Request {
  type: "SessionCreate",
  sessionId: SessionId,
};

export interface SessionJoinReq extends Request {
  type: "SessionJoin",
  sessionId: SessionId,
}

/**
 * Request to add a Pipe to the factory.
 * 
 * - Not emitted from CC
 * - Emitted from the editor if a new pipe is added by the user
 */
export interface PipeAddReq extends Request {
  type: "PipeAdd",
  pipe: Pipe,
}

/**
 * Request to edit a Pipe in the factory.
 * 
 * - Not emitted from CC
 * - Emitted from the editor if a pipe is edited by the user
 */
export interface PipeEditReq extends Request {
  type: "PipeEdit",
  pipeId: PipeId,
  edits: Partial<Pipe>,
}

/**
 * Request to delete a Pipe in the factory.
 * 
 * - Not emitted from CC
 * - Emitted from the editor if a pipe is deleted by the user
 */
export interface PipeDelReq extends Request {
  type: "PipeDel",
  pipeId: PipeId,
}

/**
 * Request to add a Machine to the factory.
 * 
 * - Emitted from CC if it detects a new peripheral is connected to the
 * network
 * - Emitted from the editor if a peripheral is split off from a Machine pool
 */
export interface MachineAddReq extends Request {
  type: "MachineAdd",
  machine: Machine,
}

/**
 * Request to edit a Machine in the factory.
 * 
 * - Emitted from the editor if any attribute of the 
 */
export interface MachineEditReq extends Request {
  type: "MachineEdit",
  machineId: MachineId,
  edits: Partial<Machine>,
}

export interface MachineDelReq extends Request {
  type: "MachineDel",
  machineId: MachineId,
}