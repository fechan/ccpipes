import { Group, MachineId } from "@server/types/core-types";
import { Handle, NodeProps, Position } from "reactflow";
import { ItemSlot } from "../components/ItemSlot";
import { useDropTargetStore } from "../stores/dropTarget";
import { useFactoryStore } from "../stores/factory";
import { useShallow } from "zustand/react/shallow";

export const SIZES = {
  slot: 30,
  slotContainerPadding: 10,
};

export type GroupNodeData = {
  group: Group,
  machineId: MachineId,
};

export function GroupNode({ id }: NodeProps<GroupNodeData>) {
  const dropTarget = useDropTargetStore(state => state.dropTarget);
  const { nickname, numSlots, slots } = useFactoryStore(useShallow(state => ({
    ...state.factory.groups[id],
    numSlots: state.factory.groups[id]?.slots.length,
  })));
  const parentMachineId = useFactoryStore(state => state.groupParents[id]);

  if (slots === undefined) {
    return (
      <div className="react-flow__node-default"></div>
    );
  }
  
  return (
    <div
      className={
        "react-flow__node-default w-full h-full" + 
        (dropTarget?.id === id ? " bg-green-200" : "")
      }
      style={{
        width: Math.min(9, numSlots) * SIZES.slot + SIZES.slotContainerPadding*2,
        height: Math.ceil(numSlots / 9) * SIZES.slot + SIZES.slotContainerPadding*2,
      }}
    >
      <div className="absolute -top-5 left-0 text-xs">
        { nickname || id }
      </div>

      <div>
        {
          slots.map((slot, i) =>
            <ItemSlot
              key={slot.periphId + slot.slot}
              slotIdx={ i }
              slot={ slot }
              machineId={ parentMachineId }
              oldGroupId={ id }
            />
          )
        }
      </div>

      <Handle type="target" position={ Position.Left } />
      <Handle type="source" position={ Position.Right } />
    </div>
  );
}