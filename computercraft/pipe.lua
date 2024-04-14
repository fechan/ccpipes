--- pipe.lua: Functions for making pipes in the factory actually
--- transfer items

local Factory = require('factory')

local function getFilledSlots (slots, periphItemLists)
  local filledSlots = {}
  for i, slot in ipairs(slots) do
    if periphItemLists[slot.periphId] == nil then
      periphItemLists[slot.periphId] = peripheral.wrap(slot.periphId).list()
    end
    local itemList = periphItemLists[slot.periphId]

    if itemList[slot.slot] then
      table.insert(filledSlots, slot)
    end
  end

  return filledSlots
end

local function processPipe (pipe, groupMap)
  local fromGroup = groupMap[pipe.from]
  local toGroup = groupMap[pipe.to]

  -- local start = os.epoch('utc')

  -- cache item lists for peripherals
  local periphItemLists = {}

  for i, fromSlot in ipairs(getFilledSlots(fromGroup.slots, periphItemLists)) do
    -- try to access the item list from cache
    local fromPeriph = peripheral.wrap(fromSlot.periphId)
    if periphItemLists[fromSlot.periphId] == nil then
      periphItemLists[fromSlot.periphId] = fromPeriph.list()
    end
    local itemList = periphItemLists[fromSlot.periphId]

    local fromSlotDetail = itemList[fromSlot.slot]
    if fromSlotDetail then
      local itemsToTransfer = fromSlotDetail.count

      for j, toSlot in ipairs(toGroup.slots) do
        local transferred = fromPeriph.pushItems(toSlot.periphId, fromSlot.slot, nil, toSlot.slot)

        -- move on to the next origin slot if the origin slot is empty
        itemsToTransfer = itemsToTransfer - transferred
        if itemsToTransfer <= 0 then
          break
        end

      end
    end
  end

  -- print(os.epoch('utc') - start)

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