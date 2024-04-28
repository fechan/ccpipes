import { SendMessage } from "react-use-websocket";
import { Node, useOnSelectionChange } from "reactflow";
import { GraphUpdateCallbacks } from "../GraphUpdateCallbacks";
import { Dispatch, SetStateAction, useState } from "react";
import { Group } from "@server/types/core-types";
import { useFactoryStore } from "../stores/factory";

interface GroupOptionsProps {
  sendMessage: SendMessage,
};

export function GroupOptions({ sendMessage }: GroupOptionsProps) {
  const [ selectedGroups, setSelectedGroups ] = useState([] as Node[]);

  const groups = useFactoryStore(state => state.factory.groups);

  const [ nickname, setNickname ] = useState("");

  const setters: { [key: string]: Dispatch<SetStateAction<string>> } = {
    "nickname": setNickname,
  };

  useOnSelectionChange({
    onChange: ({ nodes }) => {
      const selectedNodeTypes = new Set(nodes.map(node => node.type));
      if (selectedNodeTypes.size === 1 && selectedNodeTypes.has("slot-group")) {
        setSelectedGroups(nodes);
        setNickname(nodes.length === 1 ? (groups[nodes[0].id].nickname || "") : "...");
      } else {
        setSelectedGroups([]);
      }
    }
  });

  function onGroupOptionChanged(option: keyof Group, value: string) {
    for (let group of selectedGroups) {
      GraphUpdateCallbacks.onGroupUpdate(group.id, { [option]: value }, sendMessage)
    }
    setters[option](value);
  }

  return (
    <>
      {selectedGroups.length > 0 && <div className="border p-3 border-2 rounded mcui-window">
        <div className="mb-3">
          Editing { selectedGroups?.length || 'no' } groups
        </div>

        <div className="mb-3 flex flex-col">
          <label htmlFor="nickName" className="mb-1">Nickname</label>
          <input
            type="text"
            name="nickName"
            id="nickName"
            className="mcui-input p-1 ps-2"
            value={ nickname }
            onInput={ e => onGroupOptionChanged("nickname", (e.target as HTMLInputElement).value) }
          />
        </div>
      </div>}
    </>
  );
}