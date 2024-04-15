local Controller = require('controller')
local Factory = require('factory')
local Pipe = require('pipe')
local WebSocket = require('websocket')
local Utils = require('utils')

local SERVER_URL = "ws://localhost:3000"

---Wait for the quit key (q) to be pressed, and quit gracefully
---@param wsContext table|boolean WebSocket context containing a websocket `ws` to close
local function waitForQuitKey (wsContext)
  while true do
    local event, key = os.pullEvent('key')
    if keys.getName(key) == 'q' then
      if wsContext.ws then wsContext.ws.close() end
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

  -- When attachSession is called, the wsContext updates wsContext.ws with a
  -- CC WebSocket handle.
  -- If the socket dies and it successfully reconnects, the ws will be replaced.
  -- Basically the point of this context is to be able to pass the socket handle
  -- by reference to other coroutines that use it
  local wsContext = {
    wsUrl = SERVER_URL,
    ws = nil,
  }

  parallel.waitForAll(
    function () WebSocket.attachSession(wsContext) end,
    function () Controller.listenForCcpipesEvents(wsContext, factory) end,
    function () Pipe.processAllPipesForever(factory) end,
    function () waitForQuitKey(wsContext) end,
    function () while true do os.sleep(0.05) end end -- forces the OS not to lock up
  )
end

init()