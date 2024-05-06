---Check if the itemDetail's mod name/namespace matches the filter
---@param itemDetail table CC itemDetail object
---@param filter string Filter to match
---@return boolean match True if match, false otherwise
local function modNameMatch (itemDetail, filter)
  local modName = string.match(itemDetail.name, '[^:]+')
  modName = string.lower(modName)
  return string.match(
    modName,
    string.sub(filter, 2)
  ) ~= nil
end

---Check if the itemDetail's item ID matches the filter
---@param itemDetail table CC itemDetail object
---@param filter string Filter to match
---@return boolean match True if match, false otherwise
local function itemIdMatch (itemDetail, filter)
  local itemId = string.sub(string.match(itemDetail.name, ':[^:]+'), 2)
  itemId = string.lower(itemId)
  return string.match(
    itemId,
    string.sub(filter, 2)
  ) ~= nil
end

---Check if any of the itemDetail's tags matches the filter
---@param itemDetail table CC itemDetail object
---@param filter string Filter to match
---@return boolean match True if match, false otherwise
local function tagMatch (itemDetail, filter)
  for tag, hasTag in pairs(itemDetail.tags) do
    tag = string.lower(tag)
    if string.match( tag, string.sub(filter, 2) ) then
      return true
    end
  end
  return false
end

---Check if the itemDetail's nbt hash matches the filter
---@param itemDetail table CC itemDetail object
---@param filter string Filter to match
---@return boolean match True if match, false otherwise
local function nbtHashMatch (itemDetail, filter)
  local nbtHash = itemDetail.nbt
  if nbtHash == nil then return false end

  return string.match(nbtHash, string.sub(filter, 2) ) ~= nil
end

---Check if the itemDetail's display name matches the filter
---@param itemDetail table CC itemDetail object
---@param filter string Filter to match
---@return boolean match True if match, false otherwise
local function displayNameMatch (itemDetail, filter)
  local displayName = string.lower(itemDetail.displayName)
  return string.match(displayName, filter) ~= nil
end

---Get a filter function for a single argument in aJEI-like filter string
---(i.e. without any ORs or ANDs)
---@param jeiFilterSingle string A single JEI-like item filter string argument
---@return function filterFn A function that accepts a CC itemDetail and returns true if the filter matches, false otherwise
local function getSingleFilterFn (jeiFilterSingle)
  jeiFilterSingle = string.lower(jeiFilterSingle)
  jeiFilterSingle = string.gsub(jeiFilterSingle, '%s', '')

  local negate = false
  if string.find(jeiFilterSingle, '^!') then
    negate = true
    jeiFilterSingle = string.sub(jeiFilterSingle, 2)
  end

  local filterFn

  if string.find(jeiFilterSingle, '^@') then -- if starts with @ then match mod/namespace name
    filterFn = function (itemDetail) return modNameMatch(itemDetail, jeiFilterSingle) end
  elseif string.find(jeiFilterSingle, '^&') then -- if starts with & then match item ID (no namespace)
    filterFn = function (itemDetail) return itemIdMatch(itemDetail, jeiFilterSingle) end
  elseif string.find(jeiFilterSingle, '^%$') then -- if starts with $ then match tags/oreDict
    filterFn = function (itemDetail) return tagMatch(itemDetail, jeiFilterSingle) end
  elseif string.find(jeiFilterSingle, '^~') then -- if starts with ~ then match NBT hash
    filterFn = function (itemDetail) return nbtHashMatch(itemDetail, jeiFilterSingle) end
  else -- otherwise match display name
    filterFn = function (itemDetail) return displayNameMatch(itemDetail, jeiFilterSingle) end
  end

  if negate then
    return function (itemDetail) return not filterFn(itemDetail) end
  end
  return filterFn
end

---Get a filter function for a filter string where all whitespace-separated arguments
---must be matched
---@param jeiFilterNoOr string JEI-like item filter string, without any pipes/ORs
---@return function filterFn A function that accepts a CC itemDetail and returns true if the filter matches, false otherwise
local function getUnionFilterFn (jeiFilterNoOr)
  local matchAll = {}
  for andOperand in string.gmatch(jeiFilterNoOr, '[%S]+') do
    table.insert(matchAll, getSingleFilterFn(andOperand))
  end

  return function (itemDetail)
    for i, subFilter in pairs(matchAll) do
      if not subFilter(itemDetail) then
        return false
      end
    end
    return true
  end
end

---Get a filter function for a filter string in JEI-like syntax
---@param jeiFilter string JEI-like item filter string
---@return function filterFn A function that accepts a CC itemDetail and returns true if the filter matches, false otherwise
local function getFilterFn (jeiFilter)
  if jeiFilter == nil or string.gsub(jeiFilter, '%s', '') == '' then -- if the filter is blank
    return function () return true end     -- the filter should always return true
  end

  local matchAny = {}
  for orOperand in string.gmatch(jeiFilter, '[^|]+') do
    table.insert(matchAny, getUnionFilterFn(orOperand))
  end

  return function (itemDetail)
    for i, subFilter in pairs(matchAny) do
      if subFilter(itemDetail) then
        return true
      end
    end
    return false
  end
end

return {
  getFilterFn = getFilterFn
}