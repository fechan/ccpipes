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

return {
  randomString = randomString,
	absolutePathTo = absolutePathTo,
	reverse = reverse,
}