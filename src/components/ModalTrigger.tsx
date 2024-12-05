import { useOverlayTrigger } from "react-aria";
import { useOverlayTriggerState } from "react-stately";
import { Button } from "../style";
import { Modal } from "./Modal";
import { cloneElement } from "react";

export function ModalTrigger({ label, children, ...props }: { label: string; children: (close: () => void) => JSX.Element }) {
  const state = useOverlayTriggerState(props);
  const { triggerProps, overlayProps } = useOverlayTrigger({ type: "dialog" }, state);

  return (
    <>
      <Button {...triggerProps}>{label}</Button>
      {state.isOpen && (
        <Modal {...props} state={state}>
          {cloneElement(children(state.close), overlayProps)}
        </Modal>
      )}
    </>
  );
}
