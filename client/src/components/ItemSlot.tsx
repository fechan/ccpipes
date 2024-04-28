import { GroupId, MachineId, Slot } from "@server/types/core-types";
import { SIZES } from "../nodes/GroupNode";
import { DragEvent } from "react";
import { stringToColor } from "../StringToColor";

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
      className={
        "nodrag absolute border w-[30px] h-[30px] flex items-center justify-center bg-mcgui-slot-bg hover:bg-blue-400 text-white hover:text-black" +
        "border-2 border-b-mcgui-slot-border-light border-e-mcgui-slot-border-light border-t-mcgui-slot-border-dark border-s-mcgui-slot-border-dark "
      }
      style={{
        top: Math.floor(slotIdx / 9) * SIZES.slot + SIZES.slotContainerPadding + SIZES.paddingTop,
        left: (slotIdx % 9) * SIZES.slot + SIZES.slotContainerPadding,
        backgroundColor: stringToColor(slot.periphId)
      }}
      onDragStart={ onDragStart }
    >
      {slot.slot}
    </div>
  );
}