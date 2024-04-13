import { SessionJoinReq } from "@server/types/messages";
import { v4 as uuidv4 } from "uuid";
import { useState } from "react";
import { SendMessage } from "react-use-websocket";

export interface NewSessionModalData {
  sendMessage: SendMessage,
};

export function NewSessionModal({ sendMessage }: NewSessionModalData) {
  const [ sessionId, setSessionId ] = useState("");

  function joinSession() {
    const sessionJoinReq: SessionJoinReq = {
      type: "SessionJoin",
      reqId: uuidv4(),
      sessionId: sessionId,
    };
    sendMessage(JSON.stringify(sessionJoinReq));
  }

  return (
    <div className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full bg-black/50">
      <div className="relative p-4 w-full max-w-2xl max-h-full bg-white border rounded-lg shadow">
        <div className="flex flex-col">
          <input
            type="text"
            className="bg-gray-50 border border-gray-300 rounded-lg p-2.5"
            onInput={ e => setSessionId((e.target as HTMLInputElement).value.toUpperCase()) }
            value={ sessionId }
          />
          <button onClick={ joinSession } >
            Start editing
          </button>
        </div>
      </div>
    </div>
  );
}