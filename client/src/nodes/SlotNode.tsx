import { NodeProps } from "reactflow";

export type SlotNodeData = {
  periphId: string,
  slot: number,
};

export function SlotNode({ data }: NodeProps<SlotNodeData>) {
  const { periphId, slot } = data;

  return (
    <div className="react-flow__node-default w-full h-full border flex items-center justify-center">
      { slot }
    </div>
  );
}