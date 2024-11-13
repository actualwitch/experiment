import { atom } from "jotai";

export type Message = {
  message?: string;
  tool_calls?: object[];
  role: string;
  content?: string;
};
export type Chat = { messages: Message[]; response: Message };

export const importsRegistry = atom<Record<string, Chat[]>>({});

export const filenames = atom((get) => {
  const registry = get(importsRegistry);
  return Object.keys(registry);
});

export const selectedChat = atom<Array<string | number> | undefined>(undefined);

export const expandedChatIds = atom<string[]>([]);

export const processCsvAtom = atom(null, (get, set, file?: File) => {
  if (!file || file.type !== "text/csv") return;
  const fileName = file.name.slice(0, -4);
  const reader = new FileReader();
  reader.onload = async (e) => {
    const file = e.target?.result;
    if (!file) return;
    const { default: csv } = await import("csvtojson");
    const lines = await csv().fromString(file.toString());
    console.log(lines[0]);
    const chats = lines.map(({ messages, choice }) => ({
      messages: JSON.parse(messages),
      response: JSON.parse(choice).message,
    }));
    set(importsRegistry, (prev) => ({
      ...prev,
      [fileName]: chats,
    }));
  };
  reader.readAsText(file);
});

// function Bob<State>(state = {} as State) {
//   return {
//     with<Key extends string, Value extends unknown>(key: Key, value: Value) {
//       const newState = { ...state, [key]: value } as State & {
//         [k in Key]: Value;
//       };
//       return Bob(newState);
//     },
//     build() {
//       return state;
//     },
//   };
// }
