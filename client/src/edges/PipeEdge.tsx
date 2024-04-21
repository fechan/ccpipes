import { FC } from "react";
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from "reactflow";
import { useFactoryStore } from "../stores/factory";

export const PipeEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const nickname = useFactoryStore(state => state.factory.pipes[id]?.nickname);

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      { ( nickname ) && <EdgeLabelRenderer>
        <div
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          className="absolute text-gray-600"
        >
          { nickname }
        </div>
      </EdgeLabelRenderer>}
    </>
  );
}