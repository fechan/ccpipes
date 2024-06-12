--- pipe.lua: Functions for making pipes in the factory actually
--- transfer items

---A data structure for a Pipe matching `/server/src/types/core-types.ts#Pipe`
---@class Pipe

local TransferCalculator = require('sigils.transfer-calculator')
local Filter = require('sigils.filter')
local LOGGER = require('sigils.logging').LOGGER
local Utils  = require('sigils.utils')

local function processPipe (pipe, groupMap, missingPeriphs)
  local filter = Filter.getFilterFn(pipe.filter)
  local ok, transferOrders = pcall(
    function ()
      return TransferCalculator.getTransferOrders(groupMap[pipe.from], groupMap[pipe.to], missingPeriphs, filter)
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
    LOGGER:warn("pipe.lua#processPipe() caught error " .. transferOrders)
  end
end

local function processAllPipes (factory)
  -- build a set of pipe IDs needing processing
  local pipesToProcess = {}
  local numPipesToProcess = 0
  for pipeId,_ in pairs(factory.pipes) do
    pipesToProcess[pipeId] = true
    numPipesToProcess = numPipesToProcess + 1
  end

  local groupIdsInBatch = {} -- set of group IDs that are affected during this batch of pipe runs

  while numPipesToProcess > 0 do
    local pipeCoros = {}

    for pipeId, _ in pairs(pipesToProcess) do
      local pipe = factory.pipes[pipeId]
      if groupIdsInBatch[pipe.from] == nil and groupIdsInBatch[pipe.to] == nil then
        table.insert(pipeCoros, function ()
          processPipe(pipe, factory.groups, factory.missing)
        end)
        numPipesToProcess = numPipesToProcess - 1
        pipesToProcess[pipeId] = nil
        groupIdsInBatch[pipe.from] = true
        groupIdsInBatch[pipe.to] = true
      end
    end

    parallel.waitForAll(unpack(pipeCoros))
    groupIdsInBatch = {}
  end
end

local function processAllPipesForever (factory)
  while true do
    local ok, err = pcall(function () processAllPipes(factory) end)
    if not ok then
      LOGGER:warn("pipe.lua#processAllPipesForever() caught error " .. err)
    end
    coroutine.yield()
  end
end

return {
  processAllPipesForever = processAllPipesForever,
}