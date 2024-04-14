local Controller = require('controller')
local Factory = require('factory')
local Pipe = require('pipe')
local WebSocket = require('websocket')
local Utils = require('utils')

local SERVER_URL = "ws://localhost:3000"

---Wait for the quit key (q) to be pressed, and quit gracefully
---@param ws WebSocket|boolean Websocket to close before program exits
local function waitForQuitKey (ws)
  while true do
    local event, key = os.pullEvent('key')
    if keys.getName(key) == 'q' then
      if ws then ws.close() end
      -- there's no canonical exit function, so we just raise an error to stop
      error("Program quit successfully. Thank you for using CCPipes!")
    end
  end
end

local function init ()
  print("Welcome to CCPipes! Press Q to quit.\n")

  local factoryJsonFile = io.open(Utils.absolutePathTo('factory.json'), 'r')
  local factory
  
  -- if there's no existing json file, generate a factory from detected peripherals
  if factoryJsonFile == nil then
    factory = Factory.autodetectFactory()
    Factory.saveFactory(factory)
  else
    -- TODO: we should detect any added/removed machines after reading from JSON
    factory = textutils.unserializeJSON(factoryJsonFile:read('a'))
    io.close(factoryJsonFile)
  end

  local ws = WebSocket.connect(SERVER_URL)

  parallel.waitForAll(
    function () if ws then WebSocket.attachSession(ws) end end,
    function () if ws then Controller.listenForCcpipesEvents(ws.send, factory) end end,
    function () Pipe.processAllPipesForever(factory) end,
    function () waitForQuitKey(ws) end,
    -- HACK TODO: the following makes the os keep going
    -- basically the os is getting stuck on something, and only something like
    -- os.queueEvent or os.sleep will make it keep going
    -- I think a coroutine isn't properly implemented or something. Maybe pipe.lua?
    function () while true do os.sleep(0.05) end end
  )
end

init()