-- BEGIN TESTING SCAFFOLD
-- this fakes the ComputerCraft peripheral API with a dropper and dispenser
local originList = require('tests.mock.origin') -- dropper
local destList = require('tests.mock.dest') -- dispenser

peripheral = {
  wrap = function (periphId)
    return {
      getItemLimit = function () return 64 end,
      getItemDetail = function (slot)
        if string.match(periphId, 'dropper') then
          return originList[slot] or nil
        elseif string.match(periphId, 'dispenser') then
          return destList[slot] or nil
        else
          error('Tried to inventory.getItemDetail() on unexpected peripheral ' .. periphId)
        end
      end,
      list = function ()
        if string.match(periphId, 'dropper') then
          return originList
        elseif string.match(periphId, 'dispenser') then
          return destList
        else
          error('Tried to inventory.list() on unexpected peripheral ' .. periphId)
        end
      end
    }
  end
}
-- END TESTING SCAFFOLD

local function test ()
  local transferCalculator = require('transfer-calculator')

  local testFactory = require('tests.mock.factory')
  local from = testFactory.groups['minecraft:dropper_1:g1']
  local to = testFactory.groups['minecraft:dispenser_1:g1']

  local function filterAllowAll ()
    return true
  end

  local orders = transferCalculator.getTransferOrders(from, to, filterAllowAll)
  print("Did the test pass?", #orders == 3)
end

test()