---machine.lua: Functions for initializing Machines

---A data structure for a Machine with slot groups matching `/server/src/types/core-types.ts#Machine`
---@class Machine
Machine = {}

---A data structure for a Machine with slot groups matching `/server/src/types/core-types.ts#Group`
---@class Group

---Initialize a new machine
---@param periphId string CC Peripheral ID
---@param groups table? List of starting slot groups. If `nil` is passed, the groups attribute will be an empty table.
---@param nickname string? Machine name
---@return Machine machine New machine
function Machine.new (periphId, groups, nickname)
  return {
    id = periphId,
    groups = groups or {},
    nickname = nickname,
  }
end

---Initialize a machine from a CC peripheral where every slot has its own group
---@param periphId string CC Peripheral ID
---@return Machine machine New machine
---@return Group[] groups List of groups for this machine
function Machine.fromPeriphId (periphId)
  local o = Machine.new(periphId)

  if (
    string.find(periphId, 'minecraft:chest_') or
    string.find(periphId, 'minecraft:trapped_chest_') or
    string.find(periphId, 'minecraft:barrel_') or
    string.find(periphId, 'minecraft:dispenser_') or
    string.find(periphId, 'minecraft:dropper_') or
    (string.find(periphId, 'minecraft:') and string.find(periphId, '_shulker_box_'))
  ) then
    return Machine.fromChestPeriphId(periphId)
  end

  local peripheral = peripheral.wrap(periphId)
  local groups = {}

  -- create 1 group for each slot
  for slotNbr=1, peripheral.size() do
    local slot = {
      periphId = periphId,
      slot = slotNbr,
    }

    local groupId = periphId .. ':g' .. slotNbr
    local group = {
      id = groupId,
      slots = {slot},
      distribution = 'roundRobin',
      nickname = 'Slot ' .. slotNbr,
    }

    groups[groupId] = group
    table.insert(o.groups, groupId)
  end

  return o, groups
end

---Initialize a chest machine from a CC peripheral where every slot is in one big group
---@param periphId string CC Peripheral ID
---@return Machine machine New machine
---@return Group[] groups List of one group representing the inventory
function Machine.fromChestPeriphId (periphId)
  local o = Machine.new(periphId)

  local groupId = periphId .. ':g1'
  local group = {
    id = groupId,
    slots = {},
    distribution = 'roundRobin',
    nickname = 'Inventory',
  }

  local peripheral = peripheral.wrap(periphId)
  local groups = {}

  for slotNbr=1, peripheral.size() do
    local slot = {
      periphId = periphId,
      slot = slotNbr,
    }

    groups[groupId] = group
    table.insert(group.slots, slot)
  end

  table.insert(o.groups, groupId)

  return o, groups
end

return Machine