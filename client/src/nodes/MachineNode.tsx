import type { NodeProps } from "reactflow";
import { useDropTargetStore } from "../stores/dropTarget";
import { useFactoryStore } from "../stores/factory";
import { useShallow } from "zustand/react/shallow";

export function MachineNode({ id }: NodeProps) {
  const { nickname, exists } = useFactoryStore(useShallow(state => ({
    exists: id in state.factory.machines,
    nickname: state.factory.machines[id]?.nickname,
  })));

  const dropTarget = useDropTargetStore(state => state.dropTarget);

  // HACK: right now React Flow is not notified of deleted groups until the
  // useEffect that listens for addsAndDeletes in App.tsx runs.
  // Basically:
  // Factory updates come via WS from CC -> Factory store is updated ->
  // App.tsx gets rerendered and useEffect runs -> React Flow nodes get updated ->
  // React Flow removes stale Node components
  // Ideally we want the factory store and the nodes to get updated simultaneously,
  // but for now we just detect if this Node is stale and render a placeholder
  if (!exists) {
    return <div className="react-flow__node-default"></div>
  }

  return (
    <div 
      className={ 
        "react-flow__node-default w-full h-full" +
        (dropTarget?.id === id ? " bg-green-200" : "")
      }
    >
      <div className="absolute -top-5 left-0">
        { nickname || id }
        { nickname && 
            <span>({ nickname })</span>
        }
      </div>
    </div>
  );
}