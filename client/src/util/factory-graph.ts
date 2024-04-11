import { Factory, Pipe } from "../types/core-types";

export function getAllPipes(factory: Factory) {
  const pipes: Pipe[] = [];

  for (let machine of Object.values(factory)) {
    for (let group of Object.values(machine.groups)) {
      for (let pipe of Object.values(group.outputs)) {
        pipes.push(pipe);
      }
    }
  }

  return pipes;
}