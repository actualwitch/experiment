import type React from "react";
import { useState } from "react";
import { createPortal } from "react-dom";

import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

export const Iframe = ({ children, ...props }: React.ComponentProps<"iframe"> & { children: React.ReactNode }) => {
  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null);

  const cache = createCache({
    key: "css",
    container: contentRef?.contentWindow?.document?.head,
    prepend: true,
  });

  const mountNode = contentRef?.contentWindow?.document?.body;

  return (
    <CacheProvider value={cache}>
      <iframe {...props} ref={setContentRef}>
        {mountNode && createPortal(children, mountNode)}
      </iframe>
    </CacheProvider>
  );
};
