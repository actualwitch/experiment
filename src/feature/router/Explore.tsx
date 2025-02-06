import { atom, useAtom } from "jotai";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { useEffect } from "react";

import { Maybe } from "true-myth";
import { titleOverrideAtom } from ".";
import { nopeAtom } from "../../atoms/util";
import { store } from "../../store";
import { entangledAtom } from "../../utils/entanglement";
import { getRealm } from "../../utils/realm";
import { SidebarInput } from "../ui/Navigation";
import { Page } from "../ui/Page";
import { View, collapsedAtom } from "../ui/view";

export const pwdAtom = getRealm() === "server" ? atom(Bun.env.PWD) : nopeAtom;

const dirOverrideAtom = atom<string | null>(null);

export const currentDirAtom = entangledAtom("cwd", atom((get) => {
  const override = get(dirOverrideAtom);
  return override ?? get(pwdAtom);
}));

const goToAtom = entangledAtom(
  "gotodir",
  atom(null, (get, set, dir: string) => {
    if (getRealm() !== "server") return;
    const currentDir = Maybe.of(get(currentDirAtom));
    const newPath = currentDir.map((currentDir) => path.join(currentDir, dir));
    if (newPath.isJust) {
      set(dirOverrideAtom, newPath.value);
    }
  }),
);

export async function filesInDir(thisPath: string) {
  const files = await readdir(thisPath, { withFileTypes: true });
  files.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) {
      return -1;
    }
    if (!a.isDirectory() && b.isDirectory()) {
      return 1;
    }
    const nameA = a.name.toUpperCase();
    const nameB = b.name.toUpperCase();
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  });
  return files;
}

const includeExtensions = ["ts", "tsx", "md", "json", "yml"];
export async function iterateDir(dir: string, ignore: string[] = [".git"]) {
  const thisIgnores = [...ignore];
  const entries = await readdir(dir, { withFileTypes: true });
  if (entries.some((entry) => entry.isFile() && entry.name === ".gitignore")) {
    const contents = await readFile(path.join(dir, ".gitignore"), "utf-8");
    const newIgnores = contents.split("\n").map((ignore) => {
      if ([path.sep, "*"].includes(ignore.charAt(0))) {
        return ignore.slice(1);
      }
      return ignore;
    });
    thisIgnores.push(...newIgnores);
  }
  const directories: string[] = [];
  let files: string[] = [];
  for (const entry of entries) {
    if (thisIgnores.some((ignore) => entry.name === ignore)) continue;
    if (entry.isDirectory()) {
      if (entry.name === "fixtures") continue;
      directories.push(entry.name);
    } else {
      const parts = entry.name.split(".");
      const ext = parts[parts.length - 1];
      if (entry.isFile() && includeExtensions.includes(ext)) {
        files.push(`${entry.parentPath}${path.sep}${entry.name}`);
      }
    }
  }
  directories.sort();
  for (const directory of directories) {
    files = [...(await iterateDir(path.join(dir, directory), thisIgnores)), ...files];
  }
  files.sort();
  return files;
}

const currentDirContentAtom = entangledAtom(
  "cwd-content",
  atom(async (get) => {
    const currentDir = get(currentDirAtom);
    if (currentDir) {
      try {
        const files = await filesInDir(currentDir);
        const entry = path.parse(currentDir);
        return { [entry.name]: Object.fromEntries(files.map((file) => [file.name, {}])) };
      } catch {
        store.set(dirOverrideAtom, null);
      }
    }
    return null;
  }),
);

export const createContextFromFiles = async (files: string[], basePath: string) => {
  let context = "";
  let index = 1;
  for (const url of files) {
    const relUrl = url.slice(basePath.length);
    const content = await readFile(url, "utf-8");
    const thisDoc = `
      <document index="${index}">
        <source>${relUrl}</source>
        <document_content>
        ${content}
        </document_content>
      </document>
    `;
    context += thisDoc;
    index += 1;
  }
  return `<documents>\n${context}\n</documents>`;
};

export const currentDirContextAtom = entangledAtom(
  "currentdircontext",
  atom(async (get) => {
    const currentDir = Maybe.of(get(currentDirAtom)).map(async (currentDir) => {
      const files = await iterateDir(currentDir);
      return await createContextFromFiles(files, currentDir);
    });
    return await currentDir.unwrapOr(async () => null);
  }),
);

const SidebarContents = () => {
  const [currentDir] = useAtom(currentDirContentAtom);
  const [_, goToDir] = useAtom(goToAtom);
  const [collapsed, setCollapsed] = useAtom(collapsedAtom);
  if (!currentDir) {
    return null;
  }
  return (
    <View
      disableSorting
      onTitleClick={(value, key, path) => {
        if (path.length < 2) {
          goToDir("..");
          return;
        }
        goToDir(path[path.length - 1]);
      }}
    >
      {currentDir}
    </View>
  );
};
export default function () {
  const title = "Explore";
  const [titleOverride, setTitleOverride] = useAtom(titleOverrideAtom);

  useEffect(() => {
    setTitleOverride(title);
    return () => setTitleOverride(null);
  }, []);

  return (
    <>
      <Page></Page>
      {/* <Actions>
        <ConfigRenderer>{config}</ConfigRenderer>
      </Actions> */}
      <SidebarInput>
        <SidebarContents />
      </SidebarInput>
    </>
  );
}
