import { Machine } from "@server/types/core-types";
import type { NodeProps, NodeTypes } from "reactflow";

export type MachineNodeData = {
  machine: Machine,
  intersectedBy? : keyof NodeTypes,
};

export function MachineNode({ data }: NodeProps<MachineNodeData>) {
  const { machine, intersectedBy } = data;
  return (
    <div 
      className={ 
        "react-flow__node-default w-full h-full" +
        (intersectedBy === "machine" ? " bg-green-200" : "")
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