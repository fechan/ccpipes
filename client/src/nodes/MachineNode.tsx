import { Machine } from "../types/core-types";
import type { NodeProps } from "reactflow";

export type MachineNodeData = {
  machine: Machine,
};

export function MachineNode({ data }: NodeProps<MachineNodeData>) {
  const { machine } = data;
  return (
    <div className="react-flow__node-default w-full h-full">
      <div className="absolute -top-5 left-0">
        { machine.nickname || machine.id }
        { machine.nickname && 
            <span>({ machine.nickname })</span>
        }
      </div>
    </div>
  );
}