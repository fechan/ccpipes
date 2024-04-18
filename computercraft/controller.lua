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

local function handlePipeEdit (request, factory, sendMessage)
  Factory.pipeEdit(factory, request.pipeId, request.edits)
  Factory.saveFactory(factory)
end

local function handleMachineDel (request, factory, sendMessage)
  Factory.machineDel(factory, request.machineId)
  Factory.saveFactory(factory)
end

local function handleMachineEdit (request, factory, sendMessage)
  Factory.machineEdit(factory, request.machineId, request.edits)
  Factory.saveFactory(factory)
end

local function handleGroupDel (request, factory, sendMessage)
  Factory.groupDel(factory, request.groupId)
  Factory.saveFactory(factory)
end

local function handleGroupEdit (request, factory, sendMessage)
  Factory.groupEdit(factory, request.groupId, request.edits)
  Factory.saveFactory(factory)
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

      if handlers[event] then
        handlers[event](message, factory, sendMessage)
      end
    else
      coroutine.yield()
    end
  end
end

return {
  listenForCcpipesEvents = listenForCcpipesEvents,
}