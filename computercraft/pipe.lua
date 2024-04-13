--- pipe.lua: Functions for making pipes in the factory actually
--- transfer items

local Factory = require('factory')

local function processPipe (pipe, groupMap)
  local fromGroup = groupMap[pipe.from]
  local toGroup = groupMap[pipe.to]

  for i, fromSlot in ipairs(fromGroup.slots) do
    for j, toSlot in ipairs(toGroup.slots) do
      local fromPeriph = peripheral.wrap(fromSlot.periphId)

      fromPeriph.pushItems(toSlot.periphId, fromSlot.slot)
      
      -- stop trying to transfer if the from slot is empty
      local fromSlotDetail = fromPeriph.getItemDetail(fromSlot.slot)
      if not fromSlotDetail then
        break
      end

    end
  end
end

local function processAllPipes (factory)
  local globalGroupMap = Factory.getGlobalGroupMap(factory)

  for machineId, machine in pairs(factory) do
    for groupId, group in pairs(machine.groups) do
      for pipeId, pipe in pairs(group.outputs) do
        processPipe(pipe, globalGroupMap)
      end
    end
  end
end

local function processAllPipesForever (factory)
  while true do
    processAllPipes(factory)
    coroutine.yield()
  end
end

return {
  processAllPipesForever = processAllPipesForever,
}