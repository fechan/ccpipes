import { Factory, GroupId, GroupMap, MachineMap, Slot } from "@server/types/core-types";
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
 * @param sourceMachineNodes Machines that will be combined into the target
 * @param targetMachineNode Machine that will be combined into
 * @returns Messages needed to combine and final node state after combination
 */
function combineMachines(sourceMachineNodes: Node[], targetMachineNode: Node, machines: MachineMap) {
  const messages: Request[] = [];

  // get the machine's groups and tell cc to add them to the drop target's group list
  const combinedGroupList: GroupId[] = sourceMachineNodes.reduce(
    (combinedList, sourceMachineNode) => [...combinedList, ...machines[sourceMachineNode.id].groups],
    [...machines[targetMachineNode.id].groups]
  );
  
  messages.push({
    type: "MachineEdit",
    reqId: uuidv4(),
    machineId: targetMachineNode.id,
    edits: {
      groups: combinedGroupList,
    }
  } as MachineEditReq);

  // tell cc to delete the dragged machine
  for (let machineNode of sourceMachineNodes) {
    messages.push({
      type: "MachineDel",
      reqId: uuidv4(),
      machineId: machineNode.id,
    } as MachineDelReq);
  }

  return messages;
}

/**
 * Combine 1 or more source groups with a target group
 * - Slots from the source groups will be moved into the target group
 * - The source groups will then be deleted
 * @param sourceGroupNodes Groups that will be combined into the target
 * @param targetGroupNode Group to combine into
 * @returns Messages needed to combine
 */
function combineGroups(sourceGroupNodes: Node[], targetGroupNode: Node, groups: GroupMap) {
  const messages: Request[] = [];

  // get the group's slots and tell cc to add them to the target group's slot list
  const combinedSlotList: Slot[] = sourceGroupNodes.reduce(
    (combinedList, sourceGroupNodes) => [...combinedList, ...groups[sourceGroupNodes.id].slots],
    [...groups[targetGroupNode.id].slots]
  );

  messages.push({
    type: "GroupEdit",
    reqId: uuidv4(),
    groupId: targetGroupNode.id,
    edits: {
      slots: combinedSlotList,
    }
  } as GroupEditReq);

  // tell cc to delete the source group
  for (let groupNode of sourceGroupNodes) {
    messages.push({
      type: "GroupDel",
      reqId: uuidv4(),
      groupId: groupNode.id,
    } as GroupDelReq);
  }

  return messages;
}

export const CombineHandlers = {
  combineMachines: combineMachines,
  combineGroups: combineGroups,
};