import { type Setter, atom, useAtom } from "jotai";
import { useEffect } from "react";
import path from "node:path";
import { readdir, readFile } from "node:fs/promises";

import { navigateAtom, titleOverrideAtom } from ".";
import templates from "../../../fixtures/templates.json";
import { filenames, importsRegistry, selectedChat } from "../../atoms/client";
import { experimentAtom, isNavPanelOpenAtom, layoutAtom, templatesAtom } from "../../atoms/common";
import { type Config, ConfigRenderer } from "../ui/ConfigRenderer";
import { collapsedAtom, View } from "../ui/view";
import type { ExperimentWithMeta } from "../../types";
import { ExperimentPreview } from "../chat/ExperimentPreview";
import { selectionAtom } from "../chat/chat";
import { Actions } from "../ui/Actions";
import { DesktopOnly } from "../ui/Mobile";
import { SidebarInput } from "../ui/Navigation";
import { Page } from "../ui/Page";
import { getRealm } from "../../utils/realm";
import { entangledAtom } from "../../utils/entanglement";
import { nopeAtom } from "../../atoms/util";
import { Maybe } from "true-myth";

const pwdAtom = getRealm() === "server" ? atom(Bun.env.PWD) : nopeAtom;

const dirOverrideAtom = atom<string | null>(null);

const currentDirAtom = atom((get) => {
  const override = get(dirOverrideAtom);
  return override ?? get(pwdAtom);
});

const goToAtom = entangledAtom(
  "gotodir",
  atom(null, (get, set, dir: string) => {
    if (getRealm() !== "server") return;
    const currentDir = Maybe.of(get(currentDirAtom));
    const newPath = currentDir.map(currentDir => path.join(currentDir, dir));
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
      directories.push(entry.name);
    } else {
      files.push(`${entry.parentPath}${path.sep}${entry.name}`);
    }
  }
  directories.sort();
  files.sort();
  for (const directory of directories) {
    files = [...(await iterateDir(path.join(dir, directory), thisIgnores)), ...files];
  }
  return files;
}

const currentDirNameAtom = entangledAtom(
  "cwd",
  atom(async (get) => {
    const currentDir = get(currentDirAtom);
    if (currentDir) {
      const foo = await iterateDir(currentDir);
      for (const url of foo) {
        console.log(url.slice(currentDir.length));
      }
      const files = await filesInDir(currentDir);
      const entry = path.parse(currentDir);
      return { [entry.name]: Object.fromEntries(files.map((file) => [file.name, {}])) };
    }
    return null;
  }),
);

const SidebarContents = () => {
  const [currentDir] = useAtom(currentDirNameAtom);
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
