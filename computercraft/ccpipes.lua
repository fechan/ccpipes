local Machine = require('machine')
local WebSocket = require('websocket')
local Controller = require('controller')
local Pipe = require('pipe')

local SERVER_URL = "ws://localhost:3000"

local function getPeripheralIds ()
  local periphs = {}
  for i, periphId in ipairs(peripheral.getNames()) do
    if string.find(periphId, ':') then
      table.insert(periphs, periphId)
    end
  end
  return periphs
end

local function absolutePathTo (relativePath)
  return '/' .. shell.dir() .. '/' .. relativePath
end

local function init ()
  local factoryJsonFile = io.open(absolutePathTo('factory.json'), 'r')
  local factory
  
  -- if there's no existing json file, generate a factory from detected peripherals
  if factoryJsonFile == nil then
    factory = {}

    for i, periphId in ipairs(getPeripheralIds()) do
      local machine = Machine.fromPeriphId(periphId)
      factory[machine.id] = machine
    end

    -- save it as json
    local json = textutils.serializeJSON(factory)
    local f = fs.open(absolutePathTo('factory.json'), 'w')
    f.write(json)
    f.close()
  else
    -- TODO: we should detect any added/removed machines after reading from JSON
    factory = textutils.unserializeJSON(factoryJsonFile:read('a'))
    io.close(factoryJsonFile)
  end

  local ws = WebSocket.connect(SERVER_URL)
  -- TODO: constantly loop between three coloutines:
  -- 1. move items across all pipes
  -- 2. handle when the user wants to start/stop editing pipes
  -- 3. check for websocket messages and update factory
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