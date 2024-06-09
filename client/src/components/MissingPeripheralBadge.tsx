import { useState } from "react";
import { stringToColor } from "../StringToColor";

export interface MissingPeripheralBadgeProps {
  periphId: string,
};

export function MissingPeripheralBadge({ periphId }: MissingPeripheralBadgeProps) {
  const [ hover, setHover ] = useState(false);

  return (
    <div
      className="mcui-button text-sm h-8 text-white w-full flex justify-center items-center"
      style={{
        backgroundColor: hover ? "rgb(220 38 38)" : stringToColor(periphId)
      }}
      onMouseOver={ () => setHover(true) }
      onMouseOut={ () => setHover(false) }
    >
      <span>{ hover ? "Remove" : periphId.split(":")[1] }</span>
    </div>
  );
}