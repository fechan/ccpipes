import { Factory, Group, Machine, Slot } from "@server/types/core-types";
import { GroupAddReq, GroupDelReq, GroupEditReq, MachineAddReq, Request } from "@server/types/messages";
import { Node } from "reactflow";
import { v4 as uuidv4 } from "uuid";
import { ItemSlotDragData } from "./components/ItemSlot";
import { PeripheralBadgeDragData } from "./components/PeripheralBadge";

export function splitSlotFromGroup(slotData: ItemSlotDragData, intersections: Node[], factory: Factory) {
  const { slot, machineId, oldGroupId } = slotData;

  // check if we're over a machine node of the same ID as machineId
  intersections = intersections.filter(node => node.id === machineId);

  // check if taking the slot out will cause the old group to be empty
  const oldGroup = factory.groups[oldGroupId];
  const oldGroupSlots = oldGroup.slots;
  const oldGroupWillBeEmpty = oldGroupSlots.length === 1;

  // if machineId is the same and the old group will still have a slot,
  // create a new group inside that node with just this slot in it
  // and remove this slot from its old group
  if (intersections.length > 0 && !oldGroupWillBeEmpty) {
    const newGroupId = uuidv4();
    const newGroup: Group = {
      id: newGroupId,
      slots: [slot],
    };
    const groupAddReq: GroupAddReq = {
      type: "GroupAdd",
      reqId: uuidv4(),
      machineId: machineId,
      group: newGroup
    };

    const oldGroupSlotsUpdated = oldGroupSlots.filter((oldSlot: Slot) => oldSlot.periphId !== slot.periphId || oldSlot.slot !== slot.slot);
    const groupEditReq: GroupEditReq = {
      type: "GroupEdit",
      reqId: uuidv4(),
      groupId: oldGroupId,
      edits: { slots: oldGroupSlotsUpdated }
    }

    return [groupAddReq, groupEditReq];
  }

  return [];
}

export function splitPeripheralFromMachine(peripheralData: PeripheralBadgeDragData, intersections: Node[], factory: Factory) {
  const { periphId, oldMachineId } = peripheralData;

  // don't do anything if dragging to the same machine
  intersections = intersections.filter(node => node.id === oldMachineId);
  if (intersections.length > 0) {
    return [];
  }
  
  const messages: Request[] = [];

  // create a machine for the split peripheral
  const newMachine: Machine = {
    id: uuidv4(),
    nickname: periphId,
    groups: []
  };

  const machineAddReq: MachineAddReq = {
    type: "MachineAdd",
    reqId: uuidv4(),
    machine: newMachine
  };
  messages.push(machineAddReq);

  for (let groupId of factory.machines[oldMachineId].groups) {
    const oldGroup = factory.groups[groupId];
    const slotsFromPeripheral = oldGroup.slots.filter(slot => slot.periphId === periphId);
    if (slotsFromPeripheral.length > 0) {
      // make new group with all slots from this peripheral that were in the old group
      const groupAddReq: GroupAddReq = {
        type: "GroupAdd",
        reqId: uuidv4(),
        machineId: newMachine.id,
        group: {
          id: uuidv4(),
          nickname: oldGroup.nickname,
          slots: slotsFromPeripheral,
        }
      };
      messages.push(groupAddReq);

      // remove slots from this peripheral from the old group
      const oldGroupUpdatedSlots = oldGroup.slots.filter(slot => slot.periphId !== periphId)
      if (oldGroupUpdatedSlots.length > 0) {
        const groupEditReq: GroupEditReq = {
          type: "GroupEdit",
          reqId: uuidv4(),
          groupId: oldGroup.id,
          edits: {
            slots: oldGroupUpdatedSlots
          }
        };
        messages.push(groupEditReq);
      } else {
        const groupDelReq: GroupDelReq = {
          type: "GroupDel",
          reqId: uuidv4(),
          groupId: oldGroup.id
        }
        messages.push(groupDelReq);
      }
    }

  }

  return messages;
}