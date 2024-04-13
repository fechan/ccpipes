local Factory = require('factory')

local function handleFactoryGet (request, sendMessage, factory)
  local factoryGetRes = {
    type = 'ConfirmationResponse',
    respondingTo = 'FactoryGet',
    reqId = request.reqId,
    ok = true,
    factory = factory,
  }
  sendMessage(textutils.serializeJSON(factoryGetRes))
end

local function handlePipeAdd (request, sendMessage, factory)
  local pipe = request.pipe
  print("adding pipe from", pipe.from, "to", pipe.to)
  Factory.pipeAdd(factory, pipe)
end

local function listenForCcpipesEvents (sendMessage, factory)
  while true do
    local event, message = os.pullEvent()

    if event == 'ccpipes-FactoryGet' then
      handleFactoryGet(message, sendMessage, factory)
    elseif event == 'ccpipes-PipeAdd' then
      handlePipeAdd(message, sendMessage, factory)
    end

  end
end

return {
  listenForCcpipesEvents = listenForCcpipesEvents,
}