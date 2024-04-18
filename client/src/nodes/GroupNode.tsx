import { Group } from "@server/types/core-types";
import { useContext } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { DropTargetContext } from "../contexts/DropTargetContext";

export type GroupNodeData = {
  group: Group,
};

export function GroupNode({ id, data }: NodeProps<GroupNodeData>) {
  const { group } = data;
  
  const { dropTarget } = useContext(DropTargetContext);
  
  return (
    <div
      className={
        "react-flow__node-default w-full h-full" + 
        (dropTarget?.id === id ? " bg-green-200" : "")
      }
    >
      <div className="absolute -top-5 left-0 text-xs">
        { group.nickname || group.id }
      </div>

      <Handle type="target" position={ Position.Left } />
      <Handle type="source" position={ Position.Right } />
    </div>
  );
}