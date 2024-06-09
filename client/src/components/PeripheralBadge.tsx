import { MachineId } from "@server/types/core-types";
import { stringToColor } from "../StringToColor";
import { DragEvent } from "react";
import { useFactoryStore } from "../stores/factory";

export interface PeripheralBadgeProps {
  periphId: string,
  machineId: MachineId
};

export interface PeripheralBadgeDragData {
  periphId: string,
  oldMachineId: MachineId,
}

export function PeripheralBadge({ periphId, machineId }: PeripheralBadgeProps) {
  const missingPeriphs = useFactoryStore(state => state.factory.missing);

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
      draggable
      className={
        "nodrag rounded py-0.5 px-2 text-xs me-1 bg-blue-500 text-white " +
        (missingPeriphs[periphId] ? "opacity-30" : "")
      }
      style={{
        backgroundColor: stringToColor(periphId)
      }}
      onDragStart={ onDragStart }
    >
      { periphId.split(":")[1] }
    </span>
  );
}