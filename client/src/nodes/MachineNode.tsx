import { Machine } from "../types/core-types";
import type { NodeProps } from "reactflow";

export type MachineNodeData = {
  machine: Machine,
};

export function MachineNode({ data }: NodeProps<MachineNodeData>) {
  const { machine } = data;
  return (
    <div className="react-flow__node-default">
      <div>
        MACHINE { machine.id }
        { machine.nickname && 
            <span>({ machine.nickname })</span>
        }
      </div>
    </div>
  );
}