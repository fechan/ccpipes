import { SessionJoinReq } from "@server/types/messages";
import { v4 as uuidv4 } from "uuid";
import { Dispatch, SetStateAction, useState } from "react";
import { SendMessage } from "react-use-websocket";
import logo from "../logo.png";
import shackIndustries from "../shack-industries.png";

export interface NewSessionModalData {
  sendMessage: SendMessage,
  sessionId: string,
  setSessionId: Dispatch<SetStateAction<string>>,
  addReqNeedingLayout: (reqId: string) => void,
};

export function NewSessionModal({ sendMessage, sessionId, setSessionId, addReqNeedingLayout }: NewSessionModalData) {
  const [ sessionId, setSessionId ] = useState("");

  function joinSession() {
    const reqId = uuidv4();
    const sessionJoinReq: SessionJoinReq = {
      type: "SessionJoin",
      reqId: reqId,
      sessionId: sessionId,
    };
    addReqNeedingLayout(reqId);
    sendMessage(JSON.stringify(sessionJoinReq));
  }

  return (
    <div className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full md:inset-0 bg-black/70">
      <div className="relative p-4 max-w-3xl max-h-full rounded mcui-window">
        <div className="flex">
          <img src={ logo } alt="" className="h-40 me-5" />
          <div className="flex flex-col justify-center">
            <header className="mb-5">
              Welcome to the SIGILS editor!
            </header>
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
          </div>
        </div>
        <div className="border-t border-neutral-500 mt-5 pt-3 text-sm flex">
          <img src={ shackIndustries } alt="" className="h-10 me-5" />
          <div className="ms-3">
            <p>
              <span>The Shack Industries Graphical Item Logistics Software (SIGILS) is written by </span>
              <a href="https://fredchan.org/" className="hover:underline text-blue-800">Frederick Chan</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}