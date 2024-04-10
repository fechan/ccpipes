local Machine = require('machine')

local function getPeripheralIds ()
  return {'minecraft:chest_0', 'minecraft:furnace_0'}
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
      table.insert(factory, machine)
    end

    -- save it as json
    local json = textutils.serializeJSON(factory)
    local f = fs.open(absolutePathTo('factory.json'), 'w')
    f.write(json)
    f.close()
  else
    factory = textutils.unserializeJSON(factoryJsonFile:read('a'))
    io.close(factoryJsonFile)
  end
end

init()