import { useAtom } from "jotai";
import { atomEffect } from "jotai-effect";
import { useMemo, useRef } from "react";
import { isDarkModeAtom } from "./state/common";

export type EditorProps = {
  children?: string | object;
  minHeight?: string;
  setValue?: (value: string) => void;
};

export const Editor = ({ children = "", minHeight = "100%", setValue }: EditorProps) => {
  const monacoEl = useRef<HTMLDivElement | null>(null);
  const mountEffect = useMemo(() => {
    return atomEffect((get, set) => {
      let value = "";

      if (typeof children === "object") {
        value = JSON.stringify(children, null, 2);
      }
      if (typeof children === "string") {
        value = children;
      }

      const isDarkMode = get(isDarkModeAtom);

      const promise = import("monaco-editor").then((monaco) => {
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
      return () => promise.then((editor) => editor.dispose());
    });
  }, []);
  useAtom(mountEffect);

  return <div ref={monacoEl} style={{ minHeight }}></div>;
};
