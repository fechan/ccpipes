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

export function getWidth(numSlots: number) {
  return Math.min(9, numSlots) * SIZES.slot + SIZES.slotContainerPadding*2;
}

export function getHeight(numSlots: number) {
  return Math.ceil(numSlots / 9) * SIZES.slot + SIZES.slotContainerPadding*2 + SIZES.paddingTop;
}

export function GroupNode({ id, selected }: NodeProps) {
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
      <div className="react-flow__node-default hidden"></div>
    );
  }
  
  return (
    <div
      className={
        "react-flow__node-default w-full h-full bg-mcgui-bg p-0 rounded-sm " + 
        "border border-mcgui-group-border " +
        (dropTarget?.id === id ? " !bg-green-200" : "") +
        (selected ? " !bg-blue-200" : "")
      }
      style={{
        width: getWidth(numSlots),
        height: getHeight(numSlots),
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
                key={`${slot.periphId} ${slot.slot}`}
                slotIdx={ i }
                slot={ slot }
                machineId={ parentMachineId }
                oldGroupId={ id }
              />
            )
          }
        </div>
      </div>

      <Handle
        type="target"
        position={ Position.Top }
        className="h-2.5 w-2.5 rounded-sm bg-blue-600 border border-t-mcgui-group-border-light border-s-mcgui-group-border-light border-b-mcgui-group-border-dark border-e-mcgui-group-border-dark"
      />

      <Handle
        type="source"
        position={ Position.Bottom }
        className="h-2.5 w-2.5 rounded-sm bg-red-600 border border-t-mcgui-group-border-light border-s-mcgui-group-border-light border-b-mcgui-group-border-dark border-e-mcgui-group-border-dark"
        style={{ clipPath: "polygon(100% 0, 0 0, 50% 100%)" }}
      />
    </div>
  );
}