local Utils = require('utils')

-- This is a table with message type names as keys and not an array
-- so it's easy to check if a string is in the list of message types
local MESSAGE_TYPES = {
  ConfirmationResponse = true,
  SessionCreate = true,
  SessionJoin = true,
  FactoryGet = true,
  FactoryGetResponse = true,
  PipeAdd = true,
  PipeEdit = true,
  PipeDel = true,
  MachineAdd = true,
  MachineEdit = true,
  MachineDel = true,
  GroupAdd = true,
  GroupEdit = true,
  GroupDel = true,
}

local function connect (url)
  local websocket, err = http.websocket(url)
  if websocket == false then
    print("Failed to connect to editor session server... pipes will continue to run but you cannot edit them.")
    print("Reason:", err)
  end
  return websocket
end

local function requestSession (ws)
  local sessionId = Utils.randomString(1)
  local req = {
    type = 'SessionCreate',
    reqId = Utils.randomString(20),
    sessionId = sessionId,
  }
  ws.send(textutils.serializeJSON(req))

  local res = ws.receive(5)
  return textutils.unserializeJSON(res), sessionId
end

local function queueEventFromMessage (message)
  local messageType = message['type']

  if MESSAGE_TYPES[messageType] then
    os.queueEvent("ccpipes-" .. messageType, message)
  else
    print("Unhandled message type: " .. messageType)
  end
end

local function attachSession (ws)
  local res, sessionId = requestSession(ws)
  local attempts = 1
  while res == nil or not res.ok do
    if attempts > 5 then
      print("Failed to create session for editor... pipes will continue to run but you cannot edit them.")
      print("Reason:", res.message)
      return
    end
    res, sessionId = requestSession(ws)
    attempts = attempts + 1
  end
  print("Insert code", sessionId, "into web editor to edit pipes.")

  -- main ws listening loop
  while true do
    local res, isBinary = ws.receive()
    if (res ~= nil and not isBinary) then
      queueEventFromMessage(textutils.unserializeJSON(res))
    end
  end
end

return {
  connect = connect,
  attachSession = attachSession,
}