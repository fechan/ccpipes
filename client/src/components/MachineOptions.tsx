import { SendMessage } from "react-use-websocket";
import { Node, useOnSelectionChange, useStoreApi } from "reactflow";
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

  function onCommit() {
    const edits: Partial<Machine> = {};
    let changes = false;

    if (!["...", ""].includes(nickname)) {
      edits.nickname = nickname;
      changes = true;
    }

    if (changes) {
      for (let machine of selectedMachines) {
        GraphUpdateCallbacks.onMachineUpdate(machine.id, edits, sendMessage)
      }
    }
  }
  
  const store = useStoreApi();
  const { addSelectedNodes } = store.getState();
  function onCancel() {
    addSelectedNodes([]);
  }

  return (
    <>
      {selectedMachines.length > 0 && <div className="border p-3 border-2 rounded mcui-window">
        <div className="mb-3 flex justify-between items-center">
          Editing { selectedMachines?.length || 'no' } machines
          <button
            className="mcui-button w-8 h-8"
            onClick={ onCancel }
          >
            ×
          </button>
        </div>

        <div className="flex flex-col mb-3">
          <label htmlFor="nickName" className="mb-1">Nickname</label>
          <input
            type="text"
            name="nickName"
            id="nickName"
            className="mcui-input p-1 ps-2"
            value={ nickname }
            onInput={ e => setNickname((e.target as HTMLInputElement).value) }
          />
        </div>

        <div className="text-right box-border">
          <button
            className="mcui-button bg-green-800 w-32 h-10"
            onClick={ onCommit }
          >
            Update
          </button>
        </div>
      </div>}
    </>
  );
}