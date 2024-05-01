import { CSSProperties, FC } from "react";
import { BaseEdge, EdgeProps, getBezierPath } from "reactflow";

export const TempEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const style: CSSProperties = {
    strokeWidth: 3,
    stroke: "magenta",
    strokeDasharray: "4",
  }

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
    </>
  );
}