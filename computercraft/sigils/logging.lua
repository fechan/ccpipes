local Utils = require('sigils.utils')

local f = fs.open(Utils.absolutePathTo('sigils-log.txt'), 'w')
f.close()

local LEVELS = {
  DEBUG = 4,
  INFO = 3,
  WARN = 2,
  ERROR = 1,
  FATAL = 0,
}

local LOGGER = {
  level = 1,
}

function LOGGER:writeLogLine(text)
  local f = fs.open(Utils.absolutePathTo('sigils-log.txt'), 'a')
  f.write(os.epoch('utc') .. " " .. text .. "\n")
  f.close()
end

function LOGGER:setLevel (newLevel)
  self.level = newLevel
end

function LOGGER:warn (text)
  if self.level >= LEVELS.WARN then
    print(text)
    self:writeLogLine(text)
  end
end

return {
  LOGGER = LOGGER,
  LEVELS = LEVELS,
}