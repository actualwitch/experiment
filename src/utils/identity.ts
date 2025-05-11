import { newLine } from "../const";

export function identity<T>(input: T) {
  return input;
}

export function getName(message: string) {
  const regex = /^(\w*):\n\n/gm;

  let m;

  let name: string | null = null;

  while ((m = regex.exec(message)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      if (!match.includes(newLine)) name = match;
    });
  }
  return name;
}
