import { stringToColor } from "../StringToColor";
import { DragEvent } from "react";
import { useFactoryStore } from "../stores/factory";

export interface AvailablePeripheralBadgeProps {
  periphId: string,
};

export interface AvailablePeripheralBadgeDragData {
  periphId: string,
}

export function AvailablePeripheralBadge({ periphId }: AvailablePeripheralBadgeProps) {
  const missingPeriphs = useFactoryStore(state => state.factory.missing);

  function onDragStart(event: DragEvent<HTMLSpanElement>) {
    const dragData: AvailablePeripheralBadgeDragData = {periphId: periphId};
    event.dataTransfer.setData("application/ccpipes-peripheraladd", JSON.stringify(dragData));
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