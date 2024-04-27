import { GroupId, MachineId, Slot } from "@server/types/core-types";
import { SIZES } from "../nodes/GroupNode";
import { DragEvent } from "react";

export interface ItemSlotProps {
  slotIdx: number,
  slot: Slot,
  machineId: MachineId,
  oldGroupId: GroupId,
};

export interface ItemSlotDragData {
  slot: Slot,
  machineId: MachineId,
  oldGroupId: GroupId,
}

export function ItemSlot ({ slotIdx, slot, machineId, oldGroupId }: ItemSlotProps) {
  function onDragStart(event: DragEvent<HTMLDivElement>) {
    const dragData: ItemSlotDragData = {
      slot: slot,
      machineId: machineId,
      oldGroupId: oldGroupId,
    };
    event.dataTransfer.setData("application/ccpipes-slotmove", JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = "move";
  }

  return (
    <div
      draggable
      className="nodrag absolute border w-[30px] h-[30px] flex items-center justify-center hover:bg-blue-100"
      style={{
        top: Math.floor(slotIdx / 9) * SIZES.slot + SIZES.slotContainerPadding,
        left: (slotIdx % 9) * SIZES.slot + SIZES.slotContainerPadding,
      }}
      onDragStart={ onDragStart }
    >
      {slot.slot}
    </div>
  );
}