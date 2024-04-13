--- pipe.lua: Functions for making pipes in the factory actually
--- transfer items

local Factory = require('factory')

local function processPipe (pipe, groupMap)
  local fromGroup = groupMap[pipe.from]
  local toGroup = groupMap[pipe.to]

  for i, fromSlot in ipairs(fromGroup.slots) do
    for j, toSlot in ipairs(toGroup.slots) do
      local fromPeriph = peripheral.wrap(fromSlot.periphId)

      -- stop trying to transfer if the origin slot is empty
      local fromSlotDetail = fromPeriph.getItemDetail(fromSlot.slot)
      if not fromSlotDetail then
        break
      end

      fromPeriph.pushItems(toSlot.periphId, fromSlot.slot)
    end
  end
end

local function processAllPipes (factory)
  for pipeId, pipe in pairs(factory.pipes) do
    processPipe(pipe, factory.groups)
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