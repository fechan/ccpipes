local function randomString (length)
	math.randomseed(os.time('utc')^5)

	local res = ""
	for i = 1, length do
		res = res .. string.char(math.random(65, 90))
	end
	return res
end

return {
  randomString = randomString,
}