export type PipeId = string;
export type PipeMap = { [key: PipeId]: Pipe };

export type Pipe = {
    id: PipeId,
    from: GroupId,
    to: GroupId
    nickname?: string,
};

export type Slot = {
    periphId: string,
    slot: number,
};

export type GroupId = string;
export type GroupMap = { [key: GroupId]: Group };

export type Group = {
    id: GroupId,
    slots: Slot[],
    distribution: string,
    outputs: PipeMap,
    nickname?: string,
};

export type MachineId = string;
export type Factory = { [key: MachineId]: Machine };

export type Machine = {
    id: MachineId,
    groups: GroupMap,
    nickname?: string,
}