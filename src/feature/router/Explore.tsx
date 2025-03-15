// import { atom, useAtom } from "jotai";
// import { readFile, readdir } from "node:fs/promises";
// import path from "node:path";
// import { useEffect } from "react";

// import { Maybe } from "true-myth";
// import { titleOverrideAtom } from ".";
// import { store } from "../../store";
// import { entangledAtom } from "../../utils/entanglement";
// import { getRealm } from "../../utils/realm";
// import { SidebarInput } from "../ui/Navigation";
// import { Page } from "../ui/Page";
// import { View, collapsedAtom } from "../ui/view";
// import { Editor } from "../editor/Editor";
// import type { Language } from "../editor";
// import { nopeAtom } from "../../atoms/common";

// export const pwdAtom = getRealm() === "server" ? atom(Bun.env.PWD) : nopeAtom;

// const dirOverrideAtom = atom<string | null>(null);

// export const currentDirAtom = entangledAtom(
//   "cwd",
//   atom((get) => {
//     const override = get(dirOverrideAtom);
//     return override ?? get(pwdAtom);
//   }),
// );

// export const currentDirContentAtom = entangledAtom(
//   "cwd-content",
//   atom(async (get) => {
//     if (getRealm() !== "server") return;
//     try {
//       let currentDir: string | null = null;
//       // const selection = get(selectionAtom);
//       // const experiment = get(experimentAtom);
//       // const selectedIdx = selection ? selection[0] : null;
//       // if (selectedIdx !== null) {
//       //   const selectedMessage = experiment[selectedIdx];
//       //   if (selectedMessage.role === "context" && typeof selectedMessage.content === "string") {
//       //     currentDir =  selectedMessage.content;
//       //   }
//       // }
//       currentDir ??= get(currentDirAtom) || null;
//       if (currentDir) {
//         try {
//           const files = await filesInDir(currentDir);
//           const entry = path.parse(currentDir);
//           return { [entry.name]: Object.fromEntries(files.map((file) => [file.name, {}])) };
//         } catch (e){
//           // store.set(dirOverrideAtom, null);
//           console.log(e);
//         }
//       }
//       return null;
//     } catch (e) {
//       console.log(e);
//     }
//   }),
// );

// export const selectedFileAtom = entangledAtom("selectedFile", atom<null | string>());
// export const selectedFileExtension = entangledAtom(
//   "selectedFileExtension",
//   atom<null | Language>((get) => {
//     const selectedFile = get(selectedFileAtom);
//     if (!selectedFile) return null;
//     if (selectedFile.endsWith(".json")) return "json";
//     if (selectedFile.endsWith(".ts") || selectedFile.endsWith(".tsx")) return "typescript";
//     if (selectedFile.endsWith(".yaml") || selectedFile.endsWith(".yml")) return "yaml";
//     if (selectedFile.endsWith(".md")) return "markdown";
//     if (selectedFile.endsWith(".sh")) return "shell";
//     return null;
//   }),
// );
// export const selectedFileContentsAtom = entangledAtom(
//   "selectedFileContents",
//   atom(async (get) => {
//     const selectedFile = get(selectedFileAtom);
//     if (selectedFile) {
//       const content = await readFile(selectedFile, "utf-8");
//       return content;
//     }
//     return null;
//   }),
// );

// const goToAtom = entangledAtom(
//   "gotodir",
//   atom(null, async (get, set, dir: string) => {
//     if (getRealm() !== "server") return;
//     const currentDir = get(currentDirAtom);
//     if (!currentDir) return;
//     const files = await readdir(currentDir, { withFileTypes: true });
//     if (dir !== "..") {
//       const entry = files.find((ent) => ent.name === dir);
//       if (entry?.isFile()) {
//         set(selectedFileAtom, path.join(currentDir, entry.name));
//         return;
//       }
//     }
//     set(dirOverrideAtom, path.join(currentDir, dir));
//   }),
// );

// export async function filesInDir(thisPath: string) {
//   const files = await readdir(thisPath, { withFileTypes: true });
//   files.sort((a, b) => {
//     if (a.isDirectory() && !b.isDirectory()) {
//       return -1;
//     }
//     if (!a.isDirectory() && b.isDirectory()) {
//       return 1;
//     }
//     const nameA = a.name.toUpperCase();
//     const nameB = b.name.toUpperCase();
//     if (nameA < nameB) {
//       return -1;
//     }
//     if (nameA > nameB) {
//       return 1;
//     }
//     return 0;
//   });
//   return files;
// }
// export const currentDirContextAtom = entangledAtom(
//   "currentdircontext",
//   atom(async (get) => {
//     const currentDir = Maybe.of(get(currentDirAtom)).map(async (currentDir) => {
//       const files = await iterateDir(currentDir);
//       return await createContextFromFiles(files, currentDir);
//     });
//     return await currentDir.unwrapOr(async () => null);
//   }),
// );

// export const SidebarExplore = () => {
//   const [currentDir] = useAtom(currentDirContentAtom);
//   const [_, goToDir] = useAtom(goToAtom);
//   const [collapsed, setCollapsed] = useAtom(collapsedAtom);
//   if (!currentDir) {
//     return null;
//   }
//   return (
//     <View
//       disableSorting
//       onTitleClick={(value, key, path) => {
//         if (path.length < 2) {
//           goToDir("..");
//           return;
//         }
//         goToDir(path[path.length - 1]);
//       }}
//     >
//       {currentDir}
//     </View>
//   );
// };
// export default function () {
//   const title = "Explore";
//   const [titleOverride, setTitleOverride] = useAtom(titleOverrideAtom);
//   const [selectedFileContents] = useAtom(selectedFileContentsAtom);
//   const [language] = useAtom(selectedFileExtension);

//   useEffect(() => {
//     setTitleOverride(title);
//     return () => setTitleOverride(null);
//   }, []);

//   return (
//     <>
//       <Page>
//         <Editor language={language ?? undefined}>{selectedFileContents ?? ""}</Editor>
//       </Page>
//       {/* <Actions>
//         <ConfigRenderer>{config}</ConfigRenderer>
//       </Actions> */}
//       <SidebarInput>
//         <SidebarExplore />
//       </SidebarInput>
//     </>
//   );
// }
