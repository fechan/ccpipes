Distribution = {}

function Distribution.roundRobin (pipes)
  local i = 0
  local function next ()
    local nextPipe = pipes[i + 1]
    i = (i + 1) % #pipes
    return nextPipe
  end
  return next
end

function Distrubtion.trueRandom()
  -- TODO: implement me
end

function Distribution.shuffle ()
  -- TODO: implement me
end

return Distribution