import { Group, MachineId, Slot } from "@server/types/core-types";
import { useContext, useEffect } from "react";
import { Handle, NodeProps, Position, useUpdateNodeInternals } from "reactflow";
import { DropTargetContext } from "../contexts/DropTargetContext";
import { ItemSlot } from "../components/ItemSlot";

export const SIZES = {
  slot: 30,
  slotContainerPadding: 10,
};

export type GroupNodeData = {
  group: Group,
  machineId: MachineId,
};

export function GroupNode({ id, data }: NodeProps<GroupNodeData>) {
  const { group, machineId } = data;
  const { dropTarget } = useContext(DropTargetContext);
  
  return (
    <div
      className={
        "react-flow__node-default w-full h-full" + 
        (dropTarget?.id === id ? " bg-green-200" : "")
      }
      style={{
        width: Math.min(9, data.group.slots.length) * SIZES.slot + SIZES.slotContainerPadding*2,
        height: Math.ceil(data.group.slots.length / 9) * SIZES.slot + SIZES.slotContainerPadding*2,
      }}
    >
      <div className="absolute -top-5 left-0 text-xs">
        { group.nickname || group.id }
      </div>

      <div>
        {
          data.group.slots.map((slot, i) =>
            <ItemSlot
              key={slot.periphId + slot.slot}
              slotIdx={ i }
              slot={ slot }
              machineId={ machineId }
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