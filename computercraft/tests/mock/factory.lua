return {
  groups = {
    ["minecraft:dropper_1:g1"] = {
      id = "minecraft:dropper_1:g1",
      nickname = "Inventory",
      slots = { {
        periphId = "minecraft:dropper_1",
        slot = 1
      }, {
        periphId = "minecraft:dropper_1",
        slot = 2
      }, {
        periphId = "minecraft:dropper_1",
        slot = 3
      }, {
        periphId = "minecraft:dropper_1",
        slot = 4
      }, {
        periphId = "minecraft:dropper_1",
        slot = 5
      }, {
        periphId = "minecraft:dropper_1",
        slot = 6
      }, {
        periphId = "minecraft:dropper_1",
        slot = 7
      }, {
        periphId = "minecraft:dropper_1",
        slot = 8
      }, {
        periphId = "minecraft:dropper_1",
        slot = 9
      } },
      distribution = "roundRobin"
    },
    ["minecraft:dispenser_1:g1"] = {
      id = "minecraft:dispenser_1:g1",
      nickname = "Inventory",
      slots = { {
        periphId = "minecraft:dispenser_1",
        slot = 1
      }, {
        periphId = "minecraft:dispenser_1",
        slot = 2
      }, {
        periphId = "minecraft:dispenser_1",
        slot = 3
      }, {
        periphId = "minecraft:dispenser_1",
        slot = 4
      }, {
        periphId = "minecraft:dispenser_1",
        slot = 5
      }, {
        periphId = "minecraft:dispenser_1",
        slot = 6
      }, {
        periphId = "minecraft:dispenser_1",
        slot = 7
      }, {
        periphId = "minecraft:dispenser_1",
        slot = 8
      }, {
        periphId = "minecraft:dispenser_1",
        slot = 9
      } },
      distribution = "roundRobin"
    }
  },
  machines = {
    ["minecraft:dropper_1"] = {
      id = "minecraft:dropper_1",
      groups = { "minecraft:dropper_1:g1" }
    },
    ["minecraft:dispenser_1"] = {
      id = "minecraft:dispenser_1",
      groups = { "minecraft:dispenser_1:g1" }
    }
  },
  pipes = { }
}