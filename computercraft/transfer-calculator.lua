local CacheMap = require('CacheMap')

---A request to transfer `limit` items from the `from` slot to the `to` slot
---@class TransferOrder
---@field from Slot Origin slot
---@field to Slot Desitnation slot
---@field limit number Number of items to transfer

---Get slots in the given Group that match the filter.
---
---Optionally, you can provide a listCache, which will cause this function to
---use item details from inventory.list() instead of getItemDetail(), which is
---faster but less detailed. You should make sure your filter is compatible.
---@param group Group Group to check for matching slots
---@param filter function Filter function accepting item details
---@param periphCache CacheMap Peripheral cache
---@param listCache CacheMap? Optional inventory.list() cache. If provided, inventory lists are used instead of getItemDetail
---@return Slot[] matchingSlots Slots with matching items
local function getSlotsWithMatchingItems (group, filter, periphCache, listCache)
  local matchingSlots = {}
  for i, slot in pairs(group.slots) do

    if listCache then -- providing a list is faster but the filtering cannot be as detailed
      local list = listCache:Get(
        slot.periphId,
        function (periphId)
          local periph = periphCache:Get(periphId, peripheral.wrap)
          return periph.list(periphId)
        end
      )
      if list[slot.slot] and filter(list[slot.slot]) then
        table.insert(matchingSlots, slot)
      end
    else
      local periph = periphCache:Get(slot.periphId, peripheral.wrap)

      local itemDetail = periph.getItemDetail(slot.slot)
      if itemDetail and filter(itemDetail) then
        table.insert(matchingSlots, slot)
      end
    end

  end
  return matchingSlots
end

local function getEmptySlots (group, periphCache, inventoryListCache)
  local emptySlots = {}
  for i, slot in pairs(group.slots) do
    -- get the inv list from this slot's peripheral
    local invList = inventoryListCache:Get(slot.periphId, function (periphId)
      local periph = periphCache:Get(periphId, peripheral.wrap)
      return periph.list()
    end)
    -- check if slot.slot is in that list
    if invList[slot.slot] == nil then
      table.insert(emptySlots, slot)
    end
  end
  return emptySlots
end

local function popBestPossibleSlot (possibleSlotsEmpty, possibleSlotsFull)
  return table.remove(possibleSlotsFull, 1) or table.remove(possibleSlotsEmpty, 1)
end

local function getNumExistingItemsAt (slot, itemListCache, periphCache)
  local periphItemList = itemListCache:Get(
    slot.periphId,
    function (periphId)
      local periph = periphCache:Get(periphId, peripheral.wrap)
      return periph.list(periphId)
    end
  )

  if periphItemList[slot.slot] then
    return periphItemList[slot.slot].count
  end
  return 0
end

local function reverse(tbl)
  for i=1, math.floor(#tbl / 2) do
    local tmp = tbl[i]
    tbl[i] = tbl[#tbl - i + 1]
    tbl[#tbl - i + 1] = tmp
  end
end

---Get the transfer orders needed to transfer as many items as possible from the
---origin inventory to the destination
---@param origin Group Origin group to transfer from
---@param destination Group Destination group to transfer to
---@param filter function Filter function that accepts the result of inventory.getItemDetail()
---@return TransferOrder[] transferOrders List of transfer orders
local function getTransferOrders (origin, destination, filter)
  local orders = {}

  local periphCache = CacheMap.new() -- could be reused across calls of this func
  local itemMaxCountCache = CacheMap.new() -- could be reused across calls of this func
  local inventoryListCache = CacheMap.new()
  local itemLimitCache = CacheMap.new()

  local possibleSlotsEmpty = getEmptySlots(destination, periphCache, inventoryListCache)
  local shouldTransfer = getSlotsWithMatchingItems(origin, filter, periphCache, itemMaxCountCache)
  reverse(shouldTransfer) -- reverse list so table.remove(shouldTransfer) pops the head of the queue

  local possibleSlotsFullByItem = CacheMap.new()

  while #shouldTransfer > 0 do
    local originSlot = table.remove(shouldTransfer)

    ---@note This will get information about the item at the originSlot
    ---this uses info from inventory.list(), but if you need expanded info
    ---(to check for items with different NBT, which may not be stackable)
    ---this will need to change to use getItemDetail, even though it's slower
    local originPeriphList = inventoryListCache:Get(originSlot.periphId, function (periphId)
      local periph = periphCache:Get(periphId, peripheral.wrap)
      return periph.list()
    end)
    local originItem = originPeriphList[originSlot.slot]

    local possibleSlotsFull = possibleSlotsFullByItem:Get(originItem.name, function ()
      return getSlotsWithMatchingItems(
        destination,
        function (item) return item.name == originItem.name end,
        periphCache,
        inventoryListCache
      )
    end)

    -- start calculating how many of the item we can transfer
    local possibleDestSlot = popBestPossibleSlot(possibleSlotsEmpty, possibleSlotsFull)

    if possibleDestSlot ~= nil then
      local destSlotStackLimit = itemLimitCache:Get(possibleDestSlot.periphId .. "/" .. possibleDestSlot.slot, function ()
        local periph = periphCache:Get(possibleDestSlot.periphId, peripheral.wrap)
        return periph.getItemLimit(possibleDestSlot.slot)
      end)
      local numExistingItemsAtDest = getNumExistingItemsAt(possibleDestSlot, inventoryListCache, periphCache)

      local transferLimit = destSlotStackLimit - numExistingItemsAtDest

      -- can I transfer all of the origin stack?
      -- (originSlot.remainderStackSize is only defined if we tried to transfer this stack before but couldn't transfer all of it)
      local originStackSize = originSlot.remainderStackSize or getNumExistingItemsAt(originSlot, inventoryListCache, periphCache)

      if originStackSize <= transferLimit then -- if yes, transfer the whole stack and move on
        table.insert(orders, {from=originSlot, to=possibleDestSlot, limit=originStackSize})
      else -- if no, transfer the transferLimit and add the remainder of the stack to shouldTransfer
        table.insert(orders, {from=originSlot, to=possibleDestSlot, limit=transferLimit})
        table.insert(shouldTransfer, {
          periphId=originSlot.periphId,
          slot=originSlot.slot,
          remainderStackSize=originStackSize-transferLimit
        })
      end
    end
  end

  return orders
end

return {
  getTransferOrders = getTransferOrders,
}