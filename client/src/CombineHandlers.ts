import { GroupId, GroupMap, MachineId, MachineMap, Slot } from "@server/types/core-types";
import { GroupDelReq, GroupEditReq, MachineDelReq, MachineEditReq, Request } from "@server/types/messages";
import { v4 as uuidv4 } from "uuid";

/**
 * The CCPipes messages that need to be sent to ComputerCraft to enact a
 * combining operation, and the final React Flow node state after combining.
 */

/**
 * Combine 1 or more source machines into a target Machine.
 * - Groups from the source machines will be moved into the target machine
 * - The source machines will then de deleted
 * @param sourceMachineIds Machines that will be combined into the target
 * @param targetMachineId Machine that will be combined into
 * @param machines Map from Machine IDs to Machine objects
 * @param groups Map from Group IDs to Group objects
 * @returns Messages needed to combine and final node state after combination
 */
function combineMachines(sourceMachineIds: MachineId[], targetMachineId: MachineId, machines: MachineMap, groups: GroupMap) {
  const messages: Request[] = [];

  const namedGroups: {[nick: string]: GroupId[]} = {}; // named groups with the same nickname will be combined into the first group of that name encountered
  const unnamedGroups: GroupId[] = []; // unnamed groups will just be added to the target without changing its slots
  for (let machineId of [targetMachineId].concat(sourceMachineIds)) {
    for (let groupId of machines[machineId].groups) {
      const group = groups[groupId];

      if (!group.nickname) {
        unnamedGroups.push(groupId);
        continue;
      }

      if (!(group.nickname in namedGroups)) {
        namedGroups[group.nickname] = [];
      }

      namedGroups[group.nickname].push(groupId);
    }
  }

  const finalNamedGroups: GroupId[] = []; // named groups that have been combined
  for (const groupIds of Object.values(namedGroups)) {
    if (groupIds.length > 1) {
      messages.push(...combineGroups(groupIds.slice(1), groupIds[0], groups))
    }
    finalNamedGroups.push(groupIds[0]);
  }
  
  messages.push({
    type: "MachineEdit",
    reqId: uuidv4(),
    machineId: targetMachineId,
    edits: {
      groups: [...finalNamedGroups, ...unnamedGroups],
    }
  } as MachineEditReq);

  // tell cc to delete the source machines
  for (let machineId of sourceMachineIds) {
    messages.push({
      type: "MachineDel",
      reqId: uuidv4(),
      machineId: machineId,
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