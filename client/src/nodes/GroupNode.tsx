import { Handle, NodeProps, Position } from "reactflow";
import { Group } from "../types/core-types";

export type GroupNodeData = {
  group: Group,
};

export function GroupNode({ data }: NodeProps<GroupNodeData>) {
  const { group } = data;
  return (
    <div className="react-flow__node-default">
      <div>GROUP { group.id }</div>

      <div>
        <ul>
          {
            group.slots.map(slot => <li key={ `${slot.periphId}-${slot.slot}` }>{ slot.slot }</li>)
          }
        </ul>
      </div>

      <Handle type="target" position={ Position.Left } />
      <Handle type="source" position={ Position.Right } />
    </div>
  );
}