local Utils = require('utils')

local function connect (url)
  return http.websocket(url)
end

local function requestSession (ws)
  local sessionId = Utils.randomString(5)
  local req = {
    reqId = Utils.randomString(20),
    type = 'SessionCreate',
    sessionId = sessionId,
  }
  ws.send(textutils.serializeJSON(req))

  local res = ws.receive(5)
  return textutils.unserializeJSON(res), sessionId
end

local function attachSession (ws)
  local res, sessionId = requestSession(ws)
  local attempts = 1
  while res == nil or not res.ok do
    if attempts > 5 then
      print("Failed to create session for editor... pipes will continue to run but you cannot edit them.")
      return
    end
    res, sessionId = requestSession(ws)
    attempts = attempts + 1
  end
  print("Insert code", sessionId, "into web editor to edit pipes.")

  -- main ws listening loop
  while true do
    local res = ws.receive()
    print(res)
  end
end

local ws = connect('ws://localhost:3000')
parallel.waitForAll(
  function () attachSession(ws) end
)
print('done')