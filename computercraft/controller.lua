local Factory = require('factory')

local function handleFactoryGet (request, factory, sendMessage)
  local factoryGetRes = {
    type = 'ConfirmationResponse',
    respondingTo = 'FactoryGet',
    reqId = request.reqId,
    ok = true,
    factory = factory,
  }
  sendMessage(textutils.serializeJSON(factoryGetRes))
end

local function handlePipeAdd (request, factory, sendMessage)
  local pipe = request.pipe
  Factory.pipeAdd(factory, pipe)
  Factory.saveFactory(factory)
end

local function handlePipeDel (request, factory, sendMessage)
  local pipeId = request.pipeId
  Factory.pipeDel(factory, pipeId)
  Factory.saveFactory(factory)
end

local function listenForCcpipesEvents (sendMessage, factory)
  while true do
    local event, message = os.pullEvent()

    local handlers = {
      ['ccpipes-FactoryGet'] = handleFactoryGet,
      ['ccpipes-PipeAdd'] = handlePipeAdd,
      ['ccpipes-PipeDel'] = handlePipeDel,
    }

    if handlers[event] then
      handlers[event](message, factory, sendMessage)
    end

  end
end

return {
  listenForCcpipesEvents = listenForCcpipesEvents,
}