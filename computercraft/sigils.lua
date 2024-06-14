local Controller = require('sigils.controller')
local Factory = require('sigils.factory')
local Pipe = require('sigils.pipe')
local WebSocket = require('sigils.websocket')
local Utils = require('sigils.utils')
local Logging = require('sigils.logging')

local DEFAULT_SERVER_URL = 'wss://sigils.fredchan.org'

---Wait for the quit key (q) to be pressed, and quit gracefully
---@param wsContext table|boolean WebSocket context containing a websocket `ws` to close
local function waitForQuitKey (wsContext)
  while true do
    local event, key = os.pullEvent('key')
    if keys.getName(key) == 'q' then
      if wsContext.ws then wsContext.ws.close() end
      -- there's no canonical exit function, so we just raise an error to stop
      error("Program quit successfully. Thank you for using SIGILS!")
    end
  end
end

---Read the SIGILS config file into a table. If it doesn't exist, the default
---config is copied to the expected location
---@return table config SIGILS configuration
local function getConfig ()
  local config = io.open(Utils.absolutePathTo('sigils-config.json'), 'r')

  if config == nil then
    fs.copy(
      Utils.absolutePathTo('.sigils/sigils/sigils-config.dist.json'),
      Utils.absolutePathTo('sigils-config.json')
    )
    config = io.open(Utils.absolutePathTo('sigils-config.json'), 'r')
  end

  if config then
    config = config:read('a')
  else
    error("Failed to read config file!")
  end

  return textutils.unserializeJSON(config)
end

local function init ()
  print("Welcome to SIGILS! Press Q to stop all pipes and quit.\n")

  local config = getConfig()
  Logging.LOGGER:setLevel(config.logLevel or Logging.LEVELS.ERROR)

  -- try to load the factory
  local factoryJsonFile = io.open(Utils.absolutePathTo('factory.json'), 'r')
  local factory

  -- if there's no existing json file, generate a factory from detected peripherals
  if factoryJsonFile == nil then
    factory = Factory.autodetectFactory()
    Factory.saveFactory(factory)
  else
    factory = textutils.unserializeJSON(factoryJsonFile:read('a'))
    io.close(factoryJsonFile)

    Factory.updateWithPeriphChanges(factory)
    Factory.saveFactory(factory)
  end

  -- When attachSession is called, the wsContext updates wsContext.ws with a
  -- CC WebSocket handle.
  -- If the socket dies and it successfully reconnects, the ws will be replaced.
  -- Basically the point of this context is to be able to pass the socket handle
  -- by reference to other coroutines that use it
  local wsContext = {
    wsUrl = config.server or DEFAULT_SERVER_URL,
    ws = nil,
    reconnectToken = nil,
    sessionId = string,
  }

  parallel.waitForAll(
    function () WebSocket.doWebSocket(wsContext) end,
    function () Controller.listenForCcpipesEvents(wsContext, factory) end,
    function () Pipe.processAllPipesForever(factory) end,
    function () waitForQuitKey(wsContext) end,
    function () while true do os.sleep(0.05) end end -- forces the OS not to lock up
  )
end

init()