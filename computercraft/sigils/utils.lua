---Generate a random string of some length
---@param length number Length of string
---@return string res Random string
local function randomString (length)
	math.randomseed((os.epoch('utc')))

	local res = ""
	for i = 1, length do
		res = res .. string.char(math.random(65, 90))
	end
	return res
end

---Convert a relative to absolute path
---@param relativePath string Relative path
---@return string absolutePath Absolute path
local function absolutePathTo (relativePath)
  return '/' .. shell.dir() .. '/' .. relativePath
end

---Reverse a list in-place
---@param tbl table List to reverse
local function reverse(tbl)
  for i=1, math.floor(#tbl / 2) do
    local tmp = tbl[i]
    tbl[i] = tbl[#tbl - i + 1]
    tbl[#tbl - i + 1] = tmp
  end
end

---Shallow copy a table
---@param tbl table Table to copy
---@return table t2 Shallow copy of table
local function shallowCopy (tbl)
	local t2 = {}
  for k,v in pairs(tbl) do
    t2[k] = v
  end
  return t2
end

function concatArrays (...)
  local t = {}

  for i = 1, arg.n do
      local array = arg[i]
      if (type(array) == "table") then
          for j = 1, #array do
              t[#t+1] = array[j]
          end
      else
          t[#t+1] = array
      end
  end

  return t
end

function freezeTable (tbl)
  return textutils.unserialize(textutils.serialize(tbl))
end

return {
  randomString = randomString,
	absolutePathTo = absolutePathTo,
	reverse = reverse,
  shallowCopy = shallowCopy,
  concatArrays = concatArrays,
  freezeTable = freezeTable,
}