--- pipe.lua: Functions for making pipes in the factory actually
--- transfer items

---A data structure for a Pipe matching `/server/src/types/core-types.ts#Pipe`
---@class Pipe

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

local function matchFilter (slot, filter)
  --TODO: getItemDetail takes 50 ms... wtf??
  local displayName = peripheral.wrap(slot.periphId).getItemDetail(slot.slot).displayName
  return displayName and filter and string.match(displayName, filter) ~= nil
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
    if fromSlotDetail and matchFilter(fromSlot, pipe.filter) then
      local itemsToTransfer = fromSlotDetail.count

      --TODO: you'll notice if you try transferring a bunch of stacks of an item from
      --one chest to another that the transferring slows down the more stacks it sends.
      --I think it's because every time it moves on to the next stack, it still tries to
      --transfer the items to a destination stack that's already full, and it's trying
      --(and failing) to transfer them, which takes time.
      --I think the fix is to keep track of which slots are full after transferring,
      --and then ignore them for the next origin slot
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