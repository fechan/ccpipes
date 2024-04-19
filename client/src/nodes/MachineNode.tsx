import { Machine } from "@server/types/core-types";
import type { NodeProps } from "reactflow";
import { DropTargetContext } from "../contexts/DropTargetContext";
import { useContext } from "react";

export type MachineNodeData = {
  machine: Machine,
};

export function MachineNode({ id, data }: NodeProps<MachineNodeData>) {
  const { machine } = data;

  const { dropTarget } = useContext(DropTargetContext);

  return (
    <div 
      className={ 
        "react-flow__node-default w-full h-full" +
        (dropTarget?.id === id ? " bg-green-200" : "")
      }
    >
      <div className="absolute -top-5 left-0">
        { machine.nickname || machine.id }
        { machine.nickname && 
            <span>({ machine.nickname })</span>
        }
      </div>
    </div>
  );
}