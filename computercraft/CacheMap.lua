local CacheMap = {}

function CacheMap.new (initialMap)
  local o = {
    map = initialMap or {},
  }

  function o:Get (key, defaultGetter)
    local cachedValue = self.map[key]
    if cachedValue then
      return cachedValue
    end

    local newValue = defaultGetter(key)
    self.map[key] = newValue
    return newValue
  end

  function o:Set (key, value)
    self.map[key] = value
  end

  function o:Remove (key)
    self.map[key] = nil
  end

  return o
end

return CacheMap