Machine = {}

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
function Machine.fromPeriphId (periphId)
  local o = Machine.new(periphId)

  if string.find(periphId, 'minecraft:chest_') then
    return Machine.fromChestPeriphId(periphId)
  end

  local peripheral = peripheral.wrap(periphId)

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
      outputs = {},
      nickname = 'Slot ' .. slotNbr,
    }

    o.groups[groupId] = group
  end

  return o
end

---Initialize a chest machine from a CC peripheral where every slot is in one big group
---@param periphId string CC Peripheral ID
---@return Machine machine New machine
function Machine.fromChestPeriphId (periphId)
  local o = Machine.new(periphId)

  local groupId = periphId .. ':g1'
  local group = {
    id = groupId,
    slots = {},
    distribution = 'roundRobin',
    outputs = {},
    nickname = 'Inventory',
  }

  local peripheral = peripheral.wrap(periphId)

  for slotNbr=1, peripheral.size() do
    local slot = {
      periphId = periphId,
      slot = slotNbr,
    }

    table.insert(group.slots, slot)
  end

  o.groups[groupId] = group

  return o
end

return Machine