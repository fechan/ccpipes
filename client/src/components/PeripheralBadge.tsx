import { stringToColor } from "../StringToColor";

interface PeripheralBadgeProps {
  periphId: string,
};

export function PeripheralBadge({ periphId }: PeripheralBadgeProps) {
  return (
    <span
      className="rounded py-0.5 px-2 text-xs me-1 bg-blue-500 text-white"
      style={{
        backgroundColor: stringToColor(periphId)
      }}
    >
      { periphId.split(":")[1] }
    </span>
  );
}