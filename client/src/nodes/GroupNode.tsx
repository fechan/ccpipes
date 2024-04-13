import { Handle, NodeProps, Position } from "reactflow";
import { Group, Slot } from "@server/types/core-types";

export type GroupNodeData = {
  group: Group,
};

export function GroupNode({ data }: NodeProps<GroupNodeData>) {
  const { group } = data;

  function ItemSlot({ slot }: {slot: Slot}) {
    return (
      <li
        className="border w-8 h-8 grow-0 flex items-center justify-center"
      >
        { slot.slot }
      </li>
    )
  }

  return (
    <div className="react-flow__node-default w-full h-full">
      <div className="absolute -top-5 left-0 text-xs">
        { group.nickname || group.id }
      </div>

      <div>
        <ul className="flex gap-1 flex-wrap">
          {
            group.slots.map(slot => <ItemSlot
              key={ `${slot.periphId}-${slot.slot}` }
              slot={ slot }
              />)
          }
        </ul>
      </div>

      <Handle type="target" position={ Position.Left } />
      <Handle type="source" position={ Position.Right } />
    </div>
  );
}