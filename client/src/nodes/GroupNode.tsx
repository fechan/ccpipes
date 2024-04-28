import { Group, MachineId } from "@server/types/core-types";
import { Handle, NodeProps, Position } from "reactflow";
import { ItemSlot } from "../components/ItemSlot";
import { useDropTargetStore } from "../stores/dropTarget";
import { useFactoryStore } from "../stores/factory";
import { useShallow } from "zustand/react/shallow";

export const SIZES = {
  slot: 30,
  slotContainerPadding: 10,
  paddingTop: 10,
};

export type GroupNodeData = {
  group: Group,
  machineId: MachineId,
};

export function GroupNode({ id }: NodeProps<GroupNodeData>) {
  const dropTarget = useDropTargetStore(state => state.dropTarget);
  const { nickname, numSlots, slots } = useFactoryStore(useShallow(state => ({
    ...state.factory.groups[id],
    numSlots: state.factory.groups[id]?.slots.length,
  })));
  const parentMachineId = useFactoryStore(state => state.groupParents[id]);

  // HACK: right now React Flow is not notified of deleted groups until the
  // useEffect that listens for addsAndDeletes in App.tsx runs.
  // Basically:
  // Factory updates come via WS from CC -> Factory store is updated ->
  // App.tsx gets rerendered and useEffect runs -> React Flow nodes get updated ->
  // React Flow removes stale Node components
  // Ideally we want the factory store and the nodes to get updated simultaneously,
  // but for now we just detect if this Node is stale and render a placeholder
  if (slots === undefined) {
    return (
      <div className="react-flow__node-default"></div>
    );
  }
  
  return (
    <div
      className={
        "react-flow__node-default w-full h-full bg-mcgui-bg p-0 rounded-sm z-20 " + 
        "border border-mcgui-group-border " +
        (dropTarget?.id === id ? " !bg-green-200" : "")
      }
      style={{
        width: Math.min(9, numSlots) * SIZES.slot + SIZES.slotContainerPadding*2,
        height: Math.ceil(numSlots / 9) * SIZES.slot + SIZES.slotContainerPadding*2 + SIZES.paddingTop,
      }}
    >
      <div
        className={
          "h-full rounded-sm z-20 " +
          "border border-t-mcgui-group-border-light border-s-mcgui-group-border-light border-b-mcgui-group-border-dark border-e-mcgui-group-border-dark "
        }
      >
        <div className="w-full hover:w-max text-start px-2 truncate text-xs">
          { nickname || id }
        </div>

        <div>
          {
            slots.map((slot, i) =>
              <ItemSlot
                key={slot.periphId + slot.slot}
                slotIdx={ i }
                slot={ slot }
                machineId={ parentMachineId }
                oldGroupId={ id }
              />
            )
          }
        </div>
      </div>

      <Handle type="target" position={ Position.Left } />
      <Handle type="source" position={ Position.Right } />
    </div>
  );
}