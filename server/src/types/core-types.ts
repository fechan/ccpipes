/**
 * These types are used to describe a Minecraft factory. The ComputerCraft
 * program outputs JSON that is compatible with these types.
 * 
 * The maps like PipeMap and GroupMap are maps and *not* arrays
 * mainly because the ComputerCraft program needs to reference Pipes etc. by ID
 * a lot since it's faster than searching through an array.
 */

export interface Factory {
    pipes: PipeMap,
    machines: MachineMap,
    groups: GroupMap,
}

export type PipeId = string;
export type PipeMap = { [key: PipeId]: Pipe };

export interface Pipe {
    id: PipeId,
    from: GroupId,
    to: GroupId
    nickname?: string,
};

export interface Slot {
    periphId: string,
    slot: number,
};

export type GroupId = string;
export type GroupMap = { [key: GroupId]: Group };

export interface Group {
    id: GroupId,
    slots: Slot[],
    distribution: string,
    nickname?: string,
};

export type MachineId = string;
export type MachineMap = { [key: MachineId]: Machine };

export interface Machine {
    id: MachineId,
    groups: GroupId[],
    nickname?: string,
}