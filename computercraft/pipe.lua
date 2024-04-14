--- pipe.lua: Functions for making pipes in the factory actually
--- transfer items

local Factory = require('factory')

local function getFilledSlots (slots)
  local filledSlots = {}
  local periphItemLists = {}
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

local function getDestinationSlots (slots, name)
  local destinationSlots = {}
  local periphItemLists = {}
  for i, slot in ipairs(slots) do
    if periphItemLists[slot.periphId] == nil then
      periphItemLists[slot.periphId] = peripheral.wrap(slot.periphId).list()
    end
    local slotDetail = periphItemLists[slot.periphId][slot.slot]

    if slotDetail == nil then
      table.insert(destinationSlots, slot)
    elseif (slotDetail.name == name and slotDetail.count < slotDetail.maxCount) then
      table.insert(destinationSlots, slot)
    end
  end

  return destinationSlots
end

local function processPipe (pipe, groupMap)
  local fromGroup = groupMap[pipe.from]
  local toGroup = groupMap[pipe.to]

  local start = os.epoch('utc')
  
  for i, fromSlot in ipairs(getFilledSlots(fromGroup.slots)) do
    local fromPeriph = peripheral.wrap(fromSlot.periphId)
    local fromSlotDetail = fromPeriph.getItemDetail(fromSlot.slot)

    if fromSlotDetail then
      local itemsToTransfer = fromSlotDetail.count

      for j, toSlot in ipairs(toGroup.slots) do
        local transferred = fromPeriph.pushItems(toSlot.periphId, fromSlot.slot)

        itemsToTransfer = itemsToTransfer - transferred
        if itemsToTransfer <= 0 then
          break
        end

      end
    end
  end
  
  print(os.epoch('utc') - start)

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