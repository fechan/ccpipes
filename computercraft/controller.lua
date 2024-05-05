local Factory = require('factory')
local Machine = require('machine')
local Utils   = require('utils')

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
  local diff = Factory.pipeAdd(factory, pipe)
  return diff
end

local function handlePipeDel (request, factory, sendMessage)
  local pipeId = request.pipeId
  local diff = Factory.pipeDel(factory, pipeId)
  return diff
end

local function handlePipeEdit (request, factory, sendMessage)
  local diff = Factory.pipeEdit(factory, request.pipeId, request.edits)
  return diff
end

local function handleMachineAdd (request, factory, sendMessage)
  local machine = request.machine
  local diff = Factory.machineAdd(factory, machine)
  return diff
end

local function handleMachineDel (request, factory, sendMessage)
  local diff = Factory.machineDel(factory, request.machineId)
  return diff
end

local function handleMachineEdit (request, factory, sendMessage)
  local diff = Factory.machineEdit(factory, request.machineId, request.edits)
  return diff
end

local function handleGroupAdd (request, factory, sendMessage)
  local diff = Factory.groupAdd(factory, request.group, request.machineId)
  return diff
end

local function handleGroupDel (request, factory, sendMessage)
  local diff = Factory.groupDel(factory, request.groupId)
  return diff
end

local function handleGroupEdit (request, factory, sendMessage)
  local diff = Factory.groupEdit(factory, request.groupId, request.edits)
  return diff
end

local function createConfirmationResponse(request, ok, diff)
  return {
    type = 'ConfirmationResponse',
    respondingTo = request.type,
    reqId = request.reqId,
    ok = ok,
    diff = diff
  }
end

local function handlePeripheralAttach(periphId, factory, sendMessage)
  local newMachine, newGroups = Machine.fromPeriphId(periphId)
  local periphAttachDiffs = {}

  local machineAddDiff = Factory.machineAdd(factory, newMachine)
  machineAddDiff = Utils.freezeTable(machineAddDiff)
  table.insert(periphAttachDiffs, machineAddDiff)

  for groupId, group in pairs(newGroups) do
    local groupAddDiff = Factory.groupAdd(factory, group)
    groupAddDiff = Utils.freezeTable(groupAddDiff)
    table.insert(periphAttachDiffs, groupAddDiff)
  end

  local ccUpdatedFactory = {
    type = "CcUpdatedFactory",
    diff = Utils.concatArrays(unpack(periphAttachDiffs))
  }
  sendMessage(textutils.serializeJSON(ccUpdatedFactory))
end

local function listenForCcpipesEvents (wsContext, factory)
  while true do
    local sendMessage = function (...) end
    if wsContext.ws then
      sendMessage = wsContext.ws.send
    end
    local event, message = os.pullEvent()

    local handlers = {
      ['ccpipes-FactoryGet'] = handleFactoryGet,
      ['ccpipes-PipeAdd'] = handlePipeAdd,
      ['ccpipes-PipeDel'] = handlePipeDel,
      ['ccpipes-PipeEdit'] = handlePipeEdit,
      ['ccpipes-MachineAdd'] = handleMachineAdd,
      ['ccpipes-MachineDel'] = handleMachineDel,
      ['ccpipes-MachineEdit'] = handleMachineEdit,
      ['ccpipes-GroupAdd'] = handleGroupAdd,
      ['ccpipes-GroupDel'] = handleGroupDel,
      ['ccpipes-GroupEdit'] = handleGroupEdit,
    }

    if event == 'ccpipes-BatchRequest' then
      local diffs = {}
      for i, request in pairs(message.requests) do
        local handlerName = 'ccpipes-' .. request.type
        if handlers[handlerName] then
          local diff = Utils.freezeTable(handlers[handlerName](request, factory, sendMessage))
          if (diff ~= nil) then
            table.insert(diffs, diff)
          end
        end
      end
      diffs = Utils.concatArrays(unpack(diffs))
      sendMessage(textutils.serializeJSON(createConfirmationResponse(message, true, diffs)))
    elseif handlers[event] then
      local diff = handlers[event](message, factory, sendMessage)
      if (diff ~= nil) then
        sendMessage(textutils.serializeJSON(createConfirmationResponse(message, true, diff)))
      end
    elseif event == 'peripheral' then
      handlePeripheralAttach(message, factory, sendMessage)
    end

    if (handlers[event] or event == 'ccpipes-BatchRequest') and event ~= 'ccpipes-FactoryGet' then
      Factory.saveFactory(factory)
    end

    coroutine.yield()
  end
end

return {
  listenForCcpipesEvents = listenForCcpipesEvents,
}