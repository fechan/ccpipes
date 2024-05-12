/**
 * These types are used to describe a Minecraft factory. The ComputerCraft
 * program outputs JSON that is compatible with these types.
 * 
 * The maps like PipeMap and GroupMap are maps and *not* arrays
 * mainly because the ComputerCraft program needs to reference Pipes etc. by ID
 * a lot since it's faster than searching through an array.
 */

/**
 * Data structure representing a factory's machines.
 * 
 * - A factory consists of Machines of one or more ComputerCraft peripherals on
 * the same network.
 * - Each machine has one or more slot Groups, which group together the
 * peripherals' slots so they're collectively addressable.
 * - Pipes connect Groups together to transfer items between them.
 */
export interface Factory {
    pipes: PipeMap,
    machines: MachineMap,
    groups: GroupMap,
}

export type PipeId = string;
export type PipeMap = { [key: PipeId]: Pipe };

/**
 * Data structure representing a pipe for transferring items between two Groups
 */
export interface Pipe {
    id: PipeId,
    from: GroupId,
    to: GroupId
    nickname?: string,
    filter?: string,
};

/**
 * Data structure representing a slot on a particular peripheral
 */
export interface Slot {
    periphId: string,
    slot: number,
};

export type GroupId = string;
export type GroupMap = { [key: GroupId]: Group };

/**
 * Data structure representing a group of slots from one or more peripherals
 */
export interface Group {
    id: GroupId,
    slots: Slot[],
    nickname?: string,
    x?: number,
    y?: number,
};

export type MachineId = string;
export type MachineMap = { [key: MachineId]: Machine };

/**
 * Data structure representing a machine with slot groups
 */
export interface Machine {
    id: MachineId,
    groups: GroupId[],
    nickname?: string,
    x?: number,
    y?: number,
}