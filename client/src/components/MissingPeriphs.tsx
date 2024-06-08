import { PeriphId } from "@server/types/core-types";
import { PeriphDel } from "@server/types/messages";
import { useCallback } from "react";
import { SendMessage } from "react-use-websocket";
import { v4 as uuidv4 } from "uuid";
import { useFactoryStore } from "../stores/factory";

interface MissingPeriphsProps {
  sendMessage: SendMessage,
};

export function MissingPeriphs({ sendMessage }: MissingPeriphsProps) {
  const missingPeriphs = useFactoryStore(state => state.factory.missing);

  const onDeletePeriph = useCallback((periphId: PeriphId) => {
    const periphDelReq: PeriphDel = {
      type: "PeriphDel",
      reqId: uuidv4(),
      periphId: periphId,
    };
    sendMessage(JSON.stringify(periphDelReq));
  }, [sendMessage]);

  return (
    <>
      <ul>
        {
          Object.keys(missingPeriphs).map(periphId => 
            <li
              key={ periphId }
              className="hover:bg-red-500"
              onClick={ () => onDeletePeriph(periphId) }
            >
              { periphId }
            </li>
          )
        }
      </ul>
    </>
  );
}