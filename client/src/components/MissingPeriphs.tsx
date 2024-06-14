import { PeriphId } from "@server/types/core-types";
import { PeriphDelReq } from "@server/types/messages";
import { useCallback } from "react";
import { SendMessage } from "react-use-websocket";
import { v4 as uuidv4 } from "uuid";
import { useFactoryStore } from "../stores/factory";
import { MissingPeripheralBadge } from "./MissingPeripheralBadge";

interface MissingPeriphsProps {
  sendMessage: SendMessage,
  addReqNeedingLayout: (reqId: string) => void,
};

export function MissingPeriphs({ sendMessage, addReqNeedingLayout }: MissingPeriphsProps) {
  const missingPeriphs = useFactoryStore(state => state.factory.missing);

  const onDeletePeriph = useCallback((periphId: PeriphId) => {
    const reqId = uuidv4();
    const periphDelReq: PeriphDelReq = {
      type: "PeriphDel",
      reqId: reqId,
      periphId: periphId,
    };

    addReqNeedingLayout(reqId);
    sendMessage(JSON.stringify(periphDelReq));
  }, [sendMessage]);

  return (
    <>
      {Object.keys(missingPeriphs).length > 0 && <div className="border p-3 border-2 rounded mcui-window">
        <header>
          <h2>Missing peripherals</h2>
          <span className="text-sm">Click to remove</span>
        </header>

        <ul>
          {
            Object.keys(missingPeriphs).map(periphId => 
              <li
                key={periphId}
                onClick={ () => onDeletePeriph(periphId) }
                className="w-full mt-2"
              >
                <MissingPeripheralBadge periphId={periphId}/>
              </li>
            )
          }
        </ul>
      </div>}
    </>
  );
}