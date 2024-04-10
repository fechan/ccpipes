Machine = {}

---Initialize a machine from a CC peripheral ID using default values.
---
---Each inventory slot will be assigned to a different group.
---@param periphId string CC Peripheral ID
---@return table machine New machine
function Machine.fromPeriphId (periphId)
  local o = {
    nickname = nil,
    periphId = periphId,
  }

  o.groups = {}

  local peripheral = peripheral.wrap(periphId)

  -- create 1 group for each slot
  for slotNbr=1, peripheral.size() do
    local slot = {
      periphId = periphId,
      slot = slotNbr,
      outputs = {},
      distribution = 'roundRobin',
    }

    local group = {
      slots = {slot}
    }

    table.insert(o.groups, group)
  end

  return o
end

return Machine