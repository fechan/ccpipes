import { Handle, NodeProps, Position } from "reactflow";
import { Group, Slot } from "@server/types/core-types";

export type GroupNodeData = {
  group: Group,
};

export function GroupNode({ data }: NodeProps<GroupNodeData>) {
  const { group } = data;

  return (
    <div className="react-flow__node-default w-full h-full">
      <div className="absolute -top-5 left-0 text-xs">
        { group.nickname || group.id }
      </div>

      <Handle type="target" position={ Position.Left } />
      <Handle type="source" position={ Position.Right } />
    </div>
  );
}