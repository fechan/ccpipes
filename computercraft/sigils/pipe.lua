--- pipe.lua: Functions for making pipes in the factory actually
--- transfer items

---A data structure for a Pipe matching `/server/src/types/core-types.ts#Pipe`
---@class Pipe

local TransferCalculator = require('sigils.transfer-calculator')
local Filter = require('sigils.filter')

local function processPipe (pipe, groupMap)
  local filter = Filter.getFilterFn(pipe.filter)
  local ok, transferOrders = pcall(
    function ()
      return TransferCalculator.getTransferOrders(groupMap[pipe.from], groupMap[pipe.to], filter)
    end
  )

  if ok then
    local coros = {}
    for i, order in ipairs(transferOrders) do
      local fromPeriph = peripheral.wrap(order.from.periphId)
      local coro = function ()
        pcall(function ()
          fromPeriph.pushItems(order.to.periphId, order.from.slot, order.limit, order.to.slot)
        end)
      end
      table.insert(coros, coro)
    end
    parallel.waitForAll(unpack(coros))
  else
    print('caught err', transferOrders)
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