local files = {
  'sigils.lua',
  'sigils/CacheMap.lua',
  'sigils/concurrent.lua',
  'sigils/controller.lua',
  'sigils/factory.lua',
  'sigils/filter.lua',
  'sigils/machine.lua',
  'sigils/pipe.lua',
  'sigils/transfer-calculator.lua',
  'sigils/utils.lua',
  'sigils/websocket.lua',
}

write('Downloading SIGILS...')

local tasks = {}
for i, path in ipairs(files) do
  tasks[i] = function()
    local req, err = http.get('https://raw.githubusercontent.com/fechan/SIGILS/master/computercraft/' .. path)
    if not req then error('Failed to download ' .. path .. ': ' .. err, 0) end

    local file = fs.open('.sigils/' .. path, 'w')
    file.write(req.readAll())
    file.close()

    req.close()
  end
end

parallel.waitForAll(table.unpack(tasks))

print(' done')

io.open('sigils.lua', 'w'):write("shell.run('.sigils/sigils.lua')"):close()

local writeStartup
while writeStartup == nil do
  print('Run SIGILS when the computer starts up? (press y/n)')
  print('(If not, you must manually restart SIGILS if the chunk is unloaded.)')
  local event, char = os.pullEvent('char')
  print(char)
  if string.lower(char) == 'y' then
    writeStartup = true
  elseif string.lower(char) == 'n' then
    writeStartup = false
  end
end

if writeStartup then
  io.open('startup', 'w'):write("shell.run('.sigils/sigils.lua')"):close()
end

print('SIGILS successfully installed! Run /sigils.lua to start.')