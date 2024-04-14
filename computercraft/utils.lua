---Generate a random string of some length
---@param length number Length of string
---@return string res Random string
local function randomString (length)
	math.randomseed((os.epoch('utc'))^5)

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

return {
  randomString = randomString,
	absolutePathTo = absolutePathTo,
}