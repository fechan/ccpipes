import { Factory, GroupId, GroupMap, MachineId, MachineMap, Slot } from "@server/types/core-types";
import { GroupDelReq, GroupEditReq, MachineDelReq, MachineEditReq, Request } from "@server/types/messages";
import { Node } from "reactflow";
import { v4 as uuidv4 } from "uuid";

/**
 * The CCPipes messages that need to be sent to ComputerCraft to enact a
 * combining operation, and the final React Flow node state after combining.
 */

/**
 * Combine 1 or more source machines into a target Machine.
 * - Groups from the source machines will be moved into the target machine
 * - The source machines will then de deleted
 * @param sourceMachineId Machines that will be combined into the target
 * @param targetMachineId Machine that will be combined into
 * @param machines Map from Machine IDs to machine objects
 * @returns Messages needed to combine and final node state after combination
 */
function combineMachines(sourceMachineId: MachineId[], targetMachineId: MachineId, machines: MachineMap) {
  const messages: Request[] = [];

  // get the machine's groups and tell cc to add them to the drop target's group list
  const combinedGroupList: GroupId[] = sourceMachineId.reduce(
    (combinedList, sourceMachineId) => [...combinedList, ...machines[sourceMachineId].groups],
    [...machines[targetMachineId].groups]
  );
  
  messages.push({
    type: "MachineEdit",
    reqId: uuidv4(),
    machineId: targetMachineId,
    edits: {
      groups: combinedGroupList,
    }
  } as MachineEditReq);

  // tell cc to delete the dragged machine
  for (let machineNode of sourceMachineId) {
    messages.push({
      type: "MachineDel",
      reqId: uuidv4(),
      machineId: machineNode,
    } as MachineDelReq);
  }

  return messages;
}

/**
 * Combine 1 or more source groups with a target group
 * - Slots from the source groups will be moved into the target group
 * - The source groups will then be deleted
 * @param sourceGroupIds Groups that will be combined into the target
 * @param targetGroupId Group to combine into
 * @param groups Map from group IDs to group objects
 * @returns Messages needed to combine
 */
function combineGroups(sourceGroupIds: GroupId[], targetGroupId: GroupId, groups: GroupMap) {
  const messages: Request[] = [];

  // get the group's slots and tell cc to add them to the target group's slot list
  const combinedSlotList: Slot[] = sourceGroupIds.reduce(
    (combinedList, sourceGroupId) => [...combinedList, ...groups[sourceGroupId].slots],
    [...groups[targetGroupId].slots]
  );

  messages.push({
    type: "GroupEdit",
    reqId: uuidv4(),
    groupId: targetGroupId,
    edits: {
      slots: combinedSlotList,
    }
  } as GroupEditReq);

  // tell cc to delete the source group
  for (let groupNode of sourceGroupIds) {
    messages.push({
      type: "GroupDel",
      reqId: uuidv4(),
      groupId: groupNode,
    } as GroupDelReq);
  }

  return messages;
}

export const CombineHandlers = {
  combineMachines: combineMachines,
  combineGroups: combineGroups,
};