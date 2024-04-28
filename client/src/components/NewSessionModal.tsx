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
      <div
        className={`
          relative p-4 max-w-1xl max-h-full rounded shadow
          bg-mcgui-bg border-2 border-t-mcgui-border-light border-s-mcgui-border-light border-b-mcgui-border-dark border-e-mcgui-border-dark
        `}
      >
        <iframe name="dummy" id="dummy" className="hidden"></iframe>
        <header className="mb-5">Welcome to the CCPipes editor!</header>
        <form target="dummy" className="flex flex-col items-center">
          <label className="mb-3" htmlFor="sessionCode">Enter the code displayed on the ComputerCraft computer:</label>
          <div>
            <input
              name="sessionCode"
              id="sessionCode"
              type="text"
              className={`
                p-2.5 me-3 h-10 shadow-inner text-white
                bg-black border-2 border-b-mcgui-slot-border-light border-e-mcgui-slot-border-light border-t-mcgui-slot-border-dark border-s-mcgui-slot-border-dark
              `}
              style={{textShadow: "2px 2px 0px #373737"}}
              onInput={ e => setSessionId((e.target as HTMLInputElement).value.toUpperCase()) }
              value={ sessionId }
            />
            <button
              className={`
                disabled:border-black disabled:border-2 disabled:text-stone-500 disabled:bg-stone-800
                hover:border-white hover:border-4
                active:bg-blue-700
                text-white w-40 h-10
                bg-neutral-500 border-2 border-t-mcgui-slot-border-light border-s-mcgui-slot-border-light border-b-mcgui-slot-border-dark border-e-mcgui-slot-border-dark
              `}
              style={{textShadow: "1.5px 1.5px 0px #373737"}}
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