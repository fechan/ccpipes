import { FC } from "react";
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath, MarkerType } from "reactflow";
import { useFactoryStore } from "../stores/factory";

export const PipeEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd
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
  const filter = useFactoryStore(state => state.factory.pipes[id]?.filter);

  const style = {
    strokeWidth: 1,
    stroke: "blue",
  }

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      { ( nickname || filter ) && <EdgeLabelRenderer>
        <div
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          className="absolute text-gray-600 text-xs"
        >
          { nickname }
          ({ filter })
        </div>
      </EdgeLabelRenderer>}
    </>
  );
}