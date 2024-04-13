local Controller = require('controller')
local Factory = require('factory')
local Pipe = require('pipe')
local WebSocket = require('websocket')
local Utils = require('utils')

local SERVER_URL = "ws://localhost:3000"

local function init ()
  local factoryJsonFile = io.open(Utils.absolutePathTo('factory.json'), 'r')
  local factory
  
  -- if there's no existing json file, generate a factory from detected peripherals
  if factoryJsonFile == nil then
    factory = Factory.autodetectFactory()
    Factory.saveFactory(Factory)
  else
    -- TODO: we should detect any added/removed machines after reading from JSON
    factory = textutils.unserializeJSON(factoryJsonFile:read('a'))
    io.close(factoryJsonFile)
  end

  local ws = WebSocket.connect(SERVER_URL)
  parallel.waitForAll(
    function () WebSocket.attachSession(ws) end,
    function () Controller.listenForCcpipesEvents(ws.send, factory) end,
    function () Pipe.processAllPipesForever(factory) end,
    -- HACK TODO: the following makes the os keep going
    -- basically the os is getting stuck on something, and only something like
    -- os.queueEvent or os.sleep will make it keep going
    -- I think a coroutine isn't properly implemented or something. Maybe pipe.lua?
    function () while 1 do os.sleep(0.05); coroutine.yield() end end 
  )
end

init()