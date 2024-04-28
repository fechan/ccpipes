import { SendMessage } from "react-use-websocket";
import { Node, useOnSelectionChange } from "reactflow";
import { GraphUpdateCallbacks } from "../GraphUpdateCallbacks";
import { Dispatch, SetStateAction, useState } from "react";
import { Machine } from "@server/types/core-types";
import { useFactoryStore } from "../stores/factory";

interface MachineOptionsProps {
  sendMessage: SendMessage,
};

export function MachineOptions({ sendMessage }: MachineOptionsProps) {
  const [ selectedMachines, setSelectedMachines ] = useState([] as Node[]);

  const machines = useFactoryStore(state => state.factory.machines);

  const [ nickname, setNickname ] = useState("");

  const setters: { [key: string]: Dispatch<SetStateAction<string>> } = {
    "nickname": setNickname,
  };

  useOnSelectionChange({
    onChange: ({ nodes }) => {
      const selectedNodeTypes = new Set(nodes.map(node => node.type));
      if (selectedNodeTypes.size === 1 && selectedNodeTypes.has("machine")) {
        setSelectedMachines(nodes);
        setNickname(nodes.length === 1 ? (machines[nodes[0].id].nickname || "") : "...");
      } else {
        setSelectedMachines([]);
      }
    }
  });

  function onMachineOptionChanged(option: keyof Machine, value: string) {
    for (let machine of selectedMachines) {
      GraphUpdateCallbacks.onMachineUpdate(machine.id, { [option]: value }, sendMessage)
    }
    setters[option](value);
  }

  return (
    <>
      {selectedMachines.length > 0 && <div className="border p-3 border-2 rounded mcui-window">
        <div className="mb-3">
          Editing { selectedMachines?.length || 'no' } machines
        </div>

        <div className="flex flex-col mb-3">
          <label htmlFor="nickName" className="mb-1">Nickname</label>
          <input
            type="text"
            name="nickName"
            id="nickName"
            className="mcui-input p-1 ps-2"
            value={ nickname }
            onInput={ e => onMachineOptionChanged("nickname", (e.target as HTMLInputElement).value) }
          />
        </div>
      </div>}
    </>
  );
}