--- factory.lua: Functions for modifying the factory data structure (in place)
local Machine = require('machine')

local function pipeAdd (factory, pipe)
  factory.pipes[pipe.id] = pipe
end

local function getPeripheralIds ()
  local periphs = {}
  for i, periphId in ipairs(peripheral.getNames()) do
    if string.find(periphId, ':') then
      table.insert(periphs, periphId)
    end
  end
  return periphs
end

local function autodetectFactory ()
  local factory = {
    machines = {},
    groups = {},
    pipes = {},
  }
  for i, periphId in ipairs(getPeripheralIds()) do
    local machine, groups = Machine.fromPeriphId(periphId)
    factory.machines[machine.id] = machine

    for groupId, group in pairs(groups) do
      factory.groups[groupId] = group
    end
  end

  return factory
end

return {
  pipeAdd = pipeAdd,
  getGlobalGroupMap = getGlobalGroupMap,
  autodetectFactory = autodetectFactory,
}