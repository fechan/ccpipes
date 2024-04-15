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

---Request a session from the editor session server once
---@param ws Websocket ComputerCraft Websocket handle
---@return table response ConfirmationResponse as a Lua table
---@return string sessionId Session ID requested
local function requestSessionOnce (ws)
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

---Connect to the editor session server and request a session, retrying if needed
---@param wsContext table Shared WebSocket context
---@param maxAttempts number Max attempts to connect and get a session
---@return boolean ok True if session was acquired, false otherwise
local function connectAndRequestSession (wsContext, maxAttempts)
  local attempts = 1

  local ws, err = http.websocket(wsContext.wsUrl)
  while not ws do
    if attempts > maxAttempts then
      print("Failed to connect to editor session server... pipes will continue to run but you cannot edit them.")
      print("Reason:", err)
      return false
    end

    print("Trying to connect. Attempt", attempts)
    os.sleep(3)
    ws, err = http.websocket(wsContext.wsUrl)
    attempts = attempts + 1
  end
  wsContext.ws = ws

  local res, sessionId = requestSessionOnce(ws)
  while res == nil or not res.ok do
    if attempts > maxAttempts then
      print("Failed to create session for editor... pipes will continue to run but you cannot edit them.")
      print("Reason:", res.message)
      return false
    end
    print("Trying to create session. Attempt", attempts)
    res, sessionId = requestSessionOnce(ws)
    attempts = attempts + 1
  end

  print()
  print("Insert code", sessionId, "into web editor to edit pipes.")
  return true
end

---Queue an OS event for a given message. The event name will always be in the
---format `ccpipes-{message.type}` and have the message body as its data.
---
---The purpose of this is to notify the factory controller of user edits.
---@param message table Any message from the session server
local function queueEventFromMessage (message)
  local messageType = message['type']

  if MESSAGE_TYPES[messageType] then
    os.queueEvent("ccpipes-" .. messageType, message)
  else
    print("Unhandled message type: " .. messageType)
  end
end

---Connect to the editor session server and request a session. Stops if it fails
---to connect after a few attempts.
---@param wsContext table Shared WebSocket context
local function attachSession (wsContext)
  local established = connectAndRequestSession(wsContext, 5)
  if not established then return end

  while true do
    local ok, res, isBinary = pcall(function () return wsContext.ws.receive() end)
    if not ok then
      print("Lost connection to editor session server. Trying to reconnect...")
      os.sleep(3)
      established = connectAndRequestSession(wsContext, 5)
      if not established then return end
    elseif (res ~= nil and not isBinary) then
      queueEventFromMessage(textutils.unserializeJSON(res))
    end
  end
end

return {
  attachSession = attachSession,
}