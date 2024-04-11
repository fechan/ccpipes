export type Pipe = {
    id: string,
    nickname?: string,
    from: GroupId,
    to: GroupId
};

export type Slot = {
    periphId: string,
    slot: number,
};

export type GroupId = string;

export type Group = {
    id: GroupId,
    nickname?: string,
    slots: Slot[],
    distribution: string,
    outputs: Pipe[],
};

export type Machine = {
    id: string,
    nickname?: string,
    groups: Group[],
}