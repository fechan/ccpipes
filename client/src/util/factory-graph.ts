import { Group, Machine, Pipe } from "../types/core-types";

export function getAllPipes(factory: Machine[]) {
  const pipes: Pipe[] = [];

  for (let machine of factory) {
    for (let group of machine.groups) {
      pipes.push(...group.outputs);
    }
  }

  return pipes;
}