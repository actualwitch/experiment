import { useEffect, useState } from "react";
import { EditorProps } from "../editor";

export function useEditor() {
  const [Editor, setEditor] = useState<null | ((p: EditorProps) => JSX.Element)>(null);
  useEffect(() => {
    async function loadEditor() {
      const { Editor } = await import("../editor");
      setEditor(() => Editor);
    }
    loadEditor();
  }, []);
  return Editor;
}
