--- factory.lua: Functions for modifying the factory data structure (in place)

local function pipeAdd (factory, pipe)
  for machineId, machine in pairs(factory) do
    for groupId, group in pairs(machine.groups) do
      if groupId == pipe.from then
        group.outputs[pipe.id] = pipe
        return
      end
    end
  end
end

local function getGlobalGroupMap (factory)
  local groupMap = {}
  for machineId, machine in pairs(factory) do
    for groupId, group in pairs(machine.groups) do
      groupMap[groupId] = group
    end
  end
  return groupMap
end

return {
  pipeAdd = pipeAdd,
  getGlobalGroupMap = getGlobalGroupMap
}