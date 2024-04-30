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
  markerEnd,
  selected,
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
    strokeWidth: selected ? 3 : 1,
    stroke: "magenta",
  }

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      { ( nickname || filter ) && <EdgeLabelRenderer>
        <div
          className="absolute text-black text-xs"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            textShadow: "-1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white, 1px 1px 2px white",
          }}
        >
          { nickname }
          { filter && <> ({filter})</>}
        </div>
      </EdgeLabelRenderer>}
    </>
  );
}