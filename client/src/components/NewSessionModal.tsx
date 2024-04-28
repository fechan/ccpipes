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
    <div className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full md:inset-0 bg-black/70">
      <div className="relative p-4 max-w-1xl max-h-full rounded mcui-window">
        <iframe name="dummy" id="dummy" className="hidden"></iframe>
        <header className="mb-5">Welcome to the CCPipes editor!</header>
        <form target="dummy" className="flex flex-col items-center">
          <label className="mb-3" htmlFor="sessionCode">Enter the code displayed on the ComputerCraft computer:</label>
          <div>
            <input
              name="sessionCode"
              id="sessionCode"
              type="text"
              className="p-2.5 me-3 h-10 mcui-input"
              onInput={ e => setSessionId((e.target as HTMLInputElement).value.toUpperCase()) }
              value={ sessionId }
            />
            <button
              className="w-40 h-10 mcui-button"
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