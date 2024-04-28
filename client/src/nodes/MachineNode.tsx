import type { NodeProps } from "reactflow";
import { useDropTargetStore } from "../stores/dropTarget";
import { useFactoryStore } from "../stores/factory";
import { useShallow } from "zustand/react/shallow";
import { stringToColor } from "../StringToColor";

export function MachineNode({ id }: NodeProps) {
  const { nickname, exists, machineGroups, allGroups } = useFactoryStore(useShallow(state => ({
    exists: id in state.factory.machines,
    nickname: state.factory.machines[id]?.nickname,
    machineGroups: state.factory.machines[id]?.groups,
    allGroups: state.factory.groups,
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

  const peripheralIds = new Set<string>();
  for (let groupId of machineGroups) {
    const group = allGroups[groupId];
    for (let slot of group.slots) {
      peripheralIds.add(slot.periphId);
    }
  }

  return (
    <div 
      className={ 
        "react-flow__node-default mcui-window w-full h-full py-0.5 px-2 " +
        (dropTarget?.id === id ? "bg-green-200 " : "")
      }
    >
      <div
        className={
          "w-full h-12 p-1 px-2 text-start absolute left-0 -top-11 mcui-window border-b-0 rounded-t " +
          (dropTarget?.id === id ? "bg-green-200 " : "")
        }
      >
        <div>{ nickname || id }</div>
        <div className="h-7 overflow-x-scroll whitespace-nowrap">
          {
            Array.from(peripheralIds).map(periphId => (
              <span
                key={periphId}
                className="rounded py-0.5 px-2 text-xs me-1 bg-blue-500 text-white"
                style={{
                  backgroundColor: stringToColor(periphId)
                }}
              >
                { periphId.split(":")[1] }
              </span>
            ))
          }
        </div>
      </div>
    </div>
  );
}