import { useAtom } from "jotai";
import * as monaco from "monaco-editor";
import { useEffect, useMemo, useRef, useState } from "react";
import { isDarkModeAtom, store } from "./state/common";

export type EditorProps = {
  children?: string | object;
  minHeight?: string;
  setValue?: (value: string) => void;
};

export const Editor = ({
  children = "",
  minHeight = "100%",
  setValue
}: EditorProps) => {
  const monacoEl = useRef<HTMLDivElement | null>(null);

  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!monacoEl.current) return;
    setEditor((editor) => {
      if (editor) return editor;

      let value = "";

      if (typeof children === "object") {
        value = JSON.stringify(children, null, 2);
      }
      if (typeof children === "string") {
        value = children;
      }

      const isDarkMode = store.get(isDarkModeAtom);

      const newEditor = monaco.editor.create(monacoEl.current!, {
        value,
        language: "markdown",
        theme: isDarkMode ? "vs-dark" : "vs",
        automaticLayout: true,
        lineNumbers: "off",
        scrollBeyondLastLine: false,
        wordWrap: "on",
        wrappingStrategy: "advanced",
        minimap: {
          enabled: false,
        },
        overviewRulerLanes: 0,
      });

      newEditor.onDidBlurEditorText(() => {
        if (setValue) {
          setValue(newEditor.getValue());
        }
      });

    //   let ignoreEvent = false;
    //   const updateHeight = () => {
    //     const contentHeight = Math.min(1000, newEditor.getContentHeight());
    //     if (monacoEl.current) {
    //       monacoEl.current.style.width = `${300}px`;
    //       monacoEl.current.style.height = `${contentHeight}px`;
    //     }
    //     try {
    //       ignoreEvent = true;
    //       newEditor.layout({ width: 300, height: contentHeight });
    //     } finally {
    //       ignoreEvent = false;
    //     }
    //   };
    //   newEditor.onDidContentSizeChange(updateHeight);
    //   updateHeight();
      return newEditor;
    });

    return () => editor?.dispose();
  }, [monacoEl.current]);

  return <div ref={monacoEl} style={{minHeight}}></div>;
};
