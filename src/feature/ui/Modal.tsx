import { useRef } from "react";
import { Overlay, useModalOverlay } from "react-aria";

export function Modal({ state, children, ...props }) {
  const ref = useRef(null);
  const { modalProps, underlayProps } = useModalOverlay(props, state, ref);

  return (
    <Overlay>
      <div
        style={{
          position: "fixed",
          zIndex: 100,
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        {...underlayProps}
      >
        <div
          {...modalProps}
          ref={ref}
          style={{
            background: "var(--page-background)",
            border: "1px solid gray",
          }}
        >
          {children}
        </div>
      </div>
    </Overlay>
  );
}
