--- pipe.lua: Functions for making pipes in the factory actually
--- transfer items

---A data structure for a Pipe matching `/server/src/types/core-types.ts#Pipe`
---@class Pipe

local TransferCalculator = require('transfer-calculator')

local function matchNameFilter (query)
  return function (itemDetail)
    return string.match(itemDetail.name, query or '') ~= nil
  end
end

local function processPipe (pipe, groupMap)

  local start = os.epoch('utc')

  local filter = matchNameFilter(pipe.filter)
  local transferOrders = TransferCalculator.getTransferOrders(groupMap[pipe.from], groupMap[pipe.to], filter)
  for i, order in ipairs(transferOrders) do
    local fromPeriph = peripheral.wrap(order.from.periphId)
    print('xfer', order.limit, 'items from', order.from.periphId, 'slot', order.from.slot, 'to', order.to.periphId, 'slot', order.to.slot)
    local xfered = fromPeriph.pushItems(order.to.periphId, order.from.slot, order.limit, order.to.slot)
    print(xfered)
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