import * as monaco from "monaco-editor";

self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === "json") {
      return new Worker("monaco-editor/esm/vs/language/json/json.worker");
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new Worker("monaco-editor/esm/vs/language/css/css.worker");
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new Worker("monaco-editor/esm/vs/language/html/html.worker");
    }
    if (label === "typescript" || label === "javascript") {
      return new Worker("monaco-editor/esm/vs/language/typescript/ts.worker");
    }
    return new Worker("./../node_modules/monaco-editor/esm/vs/editor/editor.worker");
  },
};

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
