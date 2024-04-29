import { MachineId } from "@server/types/core-types";
import { stringToColor } from "../StringToColor";
import { DragEvent } from "react";

export interface PeripheralBadgeProps {
  periphId: string,
  machineId: MachineId
};

export interface PeripheralBadgeDragData {
  periphId: string,
  oldMachineId: MachineId,
}

export function PeripheralBadge({ periphId, machineId }: PeripheralBadgeProps) {
  function onDragStart(event: DragEvent<HTMLSpanElement>) {
    const dragData: PeripheralBadgeDragData = {
      periphId: periphId,
      oldMachineId: machineId,
    };
    event.dataTransfer.setData("application/ccpipes-peripheralmove", JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = "move";
  }

  return (
    <span
      className="rounded py-0.5 px-2 text-xs me-1 bg-blue-500 text-white"
      style={{
        backgroundColor: stringToColor(periphId)
      }}
      onDragStart={ onDragStart }
    >
      { periphId.split(":")[1] }
    </span>
  );
}