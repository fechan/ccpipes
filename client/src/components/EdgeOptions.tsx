import { Pipe } from "@server/types/core-types";
import { useState } from "react";
import { SendMessage } from "react-use-websocket";
import { Edge, useOnSelectionChange, useStoreApi } from "reactflow";
import { GraphUpdateCallbacks } from "../GraphUpdateCallbacks";
import { useFactoryStore } from "../stores/factory";

interface EdgeOptionsProps {
  sendMessage: SendMessage,
  addReqNeedingLayout: (reqId: string) => void,
};

export function EdgeOptions({ sendMessage, addReqNeedingLayout }: EdgeOptionsProps) {
  const [ selectedEdges, setSelectedEdges ] = useState([] as Edge[]);

  const pipes = useFactoryStore(state => state.factory.pipes);

  const [ nickname, setNickname ] = useState("");
  const [ filter, setFilter ] = useState("");

  useOnSelectionChange({
    onChange: ({ edges }) => {
      setSelectedEdges(edges);
      setFilter(edges.length === 1 ? (pipes[edges[0].id].filter || "") : "...");
      setNickname(edges.length === 1 ? (pipes[edges[0].id].nickname || "") : "...");
    }
  });

  function onCommit() {
    const edits: Partial<Pipe> = {};
    let changes = false;

    if (nickname !== "...") {
      edits.nickname = nickname;
      changes = true;
    }
    
    if (filter !== "...") {
      edits.filter = filter;
      changes = true;
    }

    if (changes) {
      for (let edge of selectedEdges) {
        GraphUpdateCallbacks.onPipeUpdate(edge.id, edits, sendMessage)
      }
    }
  }

  const store = useStoreApi();
  const { addSelectedEdges } = store.getState();
  function onCancel() {
    addSelectedEdges([]);
  }

  return (
    <>
      {selectedEdges.length > 0 && <div className="border rounded p-3 border-2 mcui-window">
        <div className="mb-3 flex justify-between items-center">
          Editing { selectedEdges?.length || 'no' } pipes
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

        <div className="flex flex-col mb-5">
          <label htmlFor="pipeFilter" className="mb-1">Item filter</label>
          <input
            type="text"
            name="pipeFilter"
            id="pipeFilter"
            className="mcui-input p-1 ps-2"
            value={ filter }
            onInput={ e => setFilter((e.target as HTMLInputElement).value) }
          />
          <details className="text-sm text-neutral-700 mt-1 w-full">
            <summary className="cursor-pointer">Advanced syntax</summary>

            <p>
              Prefix a term with an exclamation mark (!) to exclude it:
              <blockquote className="ps-5">!cobblestone</blockquote>
            </p>

            <p>
              Filter supports JEI prefixes for:
              <ul className="list-disc ps-5">
                <li>@mod_name</li>
                <li>&item_id</li>
                <li>$ore_dict</li>
              </ul>
            </p>

            <p>
              To match multiple filters, use the pipe (|) character:
              <blockquote className="ps-5">iron ore | dirt | cobblestone</blockquote>
            </p>
          </details>
        </div>

        <div className="text-right box-border">
          <button
            className="mcui-button bg-red-700 w-32 h-10 me-3"
            onClick={ () => GraphUpdateCallbacks.onEdgesDelete(selectedEdges, sendMessage, addReqNeedingLayout) }
          >
            Delete
          </button>
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