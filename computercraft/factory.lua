--- factory.lua: Functions for modifying the factory data structure (in place)
local Machine = require('machine')
local Utils = require('utils')

---Save a factory as a JSON file
---@param factory Factory Factory to save
local function saveFactory(factory)
  local json = textutils.serializeJSON(factory)
  local f = fs.open(Utils.absolutePathTo('factory.json'), 'w')
  f.write(json)
  f.close()
end

---Add a pipe to a factory
---@param factory Factory Factory to add to
---@param pipe Pipe Pipe to add
local function pipeAdd (factory, pipe)
  factory.pipes[pipe.id] = pipe
end

---Delete a pipe from the factory
---@param factory Factory Factory to delete from
---@param pipeId string ID of pipe to remove
local function pipeDel (factory, pipeId)
  factory.pipes[pipeId] = nil
end

---Edit a pipe in the factory
---@param factory Factory Factory the pipe is in
---@param pipeId string ID of pipe to edit
---@param edits table Map of keys to edit -> new values
local function pipeEdit (factory, pipeId, edits)
  local pipe = factory.pipes[pipeId]
  for k, v in pairs(edits) do
    pipe[k] = v
  end
end

---Get peripheral IDs connected to this factory
---@return string[] periphs List of peripheral IDs
local function getPeripheralIds ()
  local periphs = {}
  for i, periphId in ipairs(peripheral.getNames()) do
    -- add if the peripheral has an inventory and is connected via a modem
    if peripheral.wrap(periphId)['pushItems'] and string.match(periphId, ':') then 
      table.insert(periphs, periphId)
    end
  end
  return periphs
end

---Autodetect peripherals and generate a Factory
---@return Factory factory Factory with autodetected peripherals
local function autodetectFactory ()
  local factory = {
    machines = {},
    groups = {},
    pipes = {},
  }
  for i, periphId in ipairs(getPeripheralIds()) do
    local machine, groups = Machine.fromPeriphId(periphId)
    factory.machines[machine.id] = machine

    for groupId, group in pairs(groups) do
      factory.groups[groupId] = group
    end
  end

  return factory
end

return {
  pipeAdd = pipeAdd,
  pipeDel = pipeDel,
  pipeEdit = pipeEdit,
  autodetectFactory = autodetectFactory,
  saveFactory = saveFactory,
}