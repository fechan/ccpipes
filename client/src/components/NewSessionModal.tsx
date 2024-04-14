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
    <div className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full md:inset-0 bg-black/50">
      <div className="relative p-4 max-w-2xl max-h-full bg-white border rounded-lg shadow">
        <iframe name="dummy" id="dummy" className="hidden"></iframe>
        <form target="dummy" className="flex flex-col items-center">
          <label className="mb-3" htmlFor="sessionCode">Enter the code displayed on the ComputerCraft computer:</label>
          <div>
            <input
              name="sessionCode"
              id="sessionCode"
              type="text"
              className="bg-gray-50 border border-gray-300 rounded-lg p-2.5 me-3 h-10 shadow-inner"
              onInput={ e => setSessionId((e.target as HTMLInputElement).value.toUpperCase()) }
              value={ sessionId }
            />
            <button
              className="rounded-lg disabled:bg-gray-500 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white w-40 h-10"
              onClick={ joinSession }
              disabled={ sessionId.length < 1 }
            >
              Start editing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}