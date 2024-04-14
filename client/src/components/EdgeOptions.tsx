import { SendMessage } from "react-use-websocket";
import { Edge, useOnSelectionChange } from "reactflow";
import { GraphUpdateCallbacks } from "../GraphUpdateCallbacks";
import { Dispatch, SetStateAction, useState } from "react";
import { Pipe } from "@server/types/core-types";

export interface EdgeOptionsData {
  sendMessage: SendMessage,
};

export function EdgeOptions({ sendMessage }: EdgeOptionsData) {
  const [ selectedEdges, setSelectedEdges ] = useState([] as Edge[]);

  const [ nickname, setNickname ] = useState("");
  const [ filter, setFilter ] = useState("");

  const setters: { [key: string]: Dispatch<SetStateAction<string>> } = {
    "nickname": setNickname,
    "filter": setFilter,
  };

  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      setSelectedEdges(edges);
      setFilter(edges.length === 1 ? (edges[0]?.data?.filter || "") : "...");
      setNickname(edges.length === 1 ? (edges[0]?.data?.nickname || "") : "...");
    }
  });

  function onPipeOptionChanged(option: keyof Pipe, value: string) {
    const edits: Partial<Pipe> = {}
    edits[option] = value;

    for (let edge of selectedEdges) {
      GraphUpdateCallbacks.onPipeUpdate(edge.id, edits, sendMessage)
    }
    setters[option](value);
  }

  return (
    <>
      {selectedEdges.length > 0 && <div className="border rounded-lg bg-white shadow p-3">
        <div className="mb-3">
          Editing { selectedEdges?.length || 'no' } pipes
        </div>

        <div className="mb-3">
          <label htmlFor="nickName">Nickname</label>
          <input
            type="text"
            name="nickName"
            id="nickName"
            className="border rounded-lg p-1 ms-3"
            value={ nickname }
            onInput={ e => onPipeOptionChanged("nickname", (e.target as HTMLInputElement).value) }
          />
        </div>

        <div className="mb-3">
          <label htmlFor="pipeFilter">Item filter</label>
          <input
            type="text"
            name="pipeFilter"
            id="pipeFilter"
            className="border rounded-lg p-1 ms-3"
            value={ filter }
            onInput={ e => onPipeOptionChanged("filter", (e.target as HTMLInputElement).value) }
          />
        </div>
      </div>}
    </>
  );
}