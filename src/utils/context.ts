import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const includeExtensions = ["css", "scss", "rs", "sql", "ts", "tsx", "md", "json", "yml", "yaml", "toml", ".gitignore"];
export async function iterateDir(dir: string, ignore: string[] = [".git", ".sqlx", "package-lock.json"]) {
  const thisIgnores = [...ignore];
  const entries = await readdir(dir, { withFileTypes: true });
  if (entries.some((entry) => entry.isFile() && entry.name === ".gitignore")) {
    const contents = await readFile(path.join(dir, ".gitignore"), "utf-8");
    const newIgnores = contents.split("\n").map((ignore) => {
      let newIgnore = ignore.trim();
      if (newIgnore.includes(path.sep)) {
        newIgnore = newIgnore.replaceAll(path.sep, "");
      }
      if (["*"].includes(newIgnore.charAt(0))) {
        newIgnore = newIgnore.slice(1);
      }
      return newIgnore;
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

export const createXMLContextFromFiles = async (files: string[], basePath: string, title = "") => {
  let context = "";
  let index = 1;
  for (const url of files) {
    const relUrl = url.slice(basePath.length);
    const content = await readFile(url, "utf-8");
    const thisDoc = `<document index="${index}">
<source>${relUrl}</source>
<document_content>
${content}
</document_content>
</document>
`;
    context += thisDoc;
    index += 1;
  }
  return `<documents${title ? ` ${title}` : ""}>
${context}</documents>
`;
};

export const createContextFromFiles = async (files: string[], basePath: string, title = "") => {
  let context = "";
  let index = 1;
  for (const url of files) {
    const relUrl = url.slice(basePath.length);
    const content = await readFile(url, "utf-8");
    const thisDoc = `${relUrl}
---
${content}
---
`;
    context += thisDoc;
    index += 1;
  }
  return `${title ? `${title}
---` : ""}
${context}
`;
};

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
