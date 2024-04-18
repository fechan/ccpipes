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
end

local function handlePipeDel (request, factory, sendMessage)
  local pipeId = request.pipeId
  Factory.pipeDel(factory, pipeId)
end

local function handlePipeEdit (request, factory, sendMessage)
  Factory.pipeEdit(factory, request.pipeId, request.edits)
end

local function handleMachineDel (request, factory, sendMessage)
  Factory.machineDel(factory, request.machineId)
end

local function handleMachineEdit (request, factory, sendMessage)
  Factory.machineEdit(factory, request.machineId, request.edits)
end

local function handleGroupDel (request, factory, sendMessage)
  Factory.groupDel(factory, request.groupId)
end

local function handleGroupEdit (request, factory, sendMessage)
  Factory.groupEdit(factory, request.groupId, request.edits)
end

local function listenForCcpipesEvents (wsContext, factory)
  while true do
    if wsContext.ws then
      local sendMessage = wsContext.ws.send
      local event, message = os.pullEvent()

      local handlers = {
        ['ccpipes-FactoryGet'] = handleFactoryGet,
        ['ccpipes-PipeAdd'] = handlePipeAdd,
        ['ccpipes-PipeDel'] = handlePipeDel,
        ['ccpipes-PipeEdit'] = handlePipeEdit,
        ['ccpipes-MachineDel'] = handleMachineDel,
        ['ccpipes-MachineEdit'] = handleMachineEdit,
        ['ccpipes-GroupDel'] = handleGroupDel,
        ['ccpipes-GroupEdit'] = handleGroupEdit,
      }

      if event == 'ccpipes-BatchRequest' then
        for i, request in pairs(message.requests) do
          local handlerName = 'ccpipes-' .. request.type
          if handlers[handlerName] then
            handlers[handlerName](request, factory, sendMessage)
          end
        end
      elseif handlers[event] then
        handlers[event](message, factory, sendMessage)
      end

      if (handlers[event] or event == 'ccpipes-BatchRequest') and event ~= 'ccpipes-FactoryGet' then
        Factory.saveFactory(factory)
      end
    else
      coroutine.yield()
    end
  end
end

return {
  listenForCcpipesEvents = listenForCcpipesEvents,
}