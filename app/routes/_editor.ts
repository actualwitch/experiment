import { useEffect, useState } from "react";

export function useEditor() {
  const [Editor, setEditor] = useState<null | ((p: { children?: string }) => JSX.Element)>(null);
  useEffect(() => {
    async function loadEditor() {
      const { Editor } = await import("../editor");
      setEditor(() => Editor);
    }
    loadEditor();
  }, []);
  return Editor;
}
