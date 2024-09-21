import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, json, useLoaderData, useSubmit } from "@remix-run/react";
import { atom, useAtom, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import * as serverState from "~/state/server";
import { bs } from "~/style";
import { withFormStyling, type FormProps } from "~/style/form";
import styled from "@emotion/styled";
import {
  isDarkModeAtom,
  store,
  tokenAtom,
  entangledAtoms,
  getInitialStore,
  sseSubscriptionEffect,
} from "~/state/common";
import { Debugger } from "~/dbg";
import { atomEffect } from "jotai-effect";
import { getRealm } from "~/state/entanglement";
import { useHydrateAtoms } from "jotai/utils";
import { portalSubscription } from "./portal";
import { eventStream } from "~/eventStream";
import { createAction, createLoader } from "~/createLoader";
import { createController } from "~/createController";
import { createSubscription } from "~/createSubscription";

export { defaultMeta as meta } from "~/meta";

const atoms = { isDarkMode: isDarkModeAtom, token: tokenAtom, hasResolvedToken: entangledAtoms.hasResolvedTokenAtom };
export const loader = createLoader(atoms);

export const action = createAction(atoms);

const useController = createController(atoms);

const Input = styled.input<FormProps>(withFormStyling);

const StyledForm = styled(Form)`
  display: flex;
  & > * {
    display: flex;
    gap: ${bs(1 / 2)};
  }
  flex-direction: column;
  input[type="text"] {
    flex: 1;
  }
  label {
    display: flex;
    align-items: baseline;
    margin-bottom: ${bs(1.5)};
  }
`;

export default function Configure() {
  const {
    isDarkMode: [isDarkMode, setIsDarkMode],
    token: [token, setToken],
  } = useController();
  const [hasResolvedToken] = useAtom(entangledAtoms.hasResolvedTokenAtom);
  return (
    <>
      <StyledForm method="post">
        <h3>Visual</h3>
        <label>
          <input
            type="checkbox"
            name="isDarkMode"
            checked={isDarkMode}
            onChange={(e) => {
              setIsDarkMode(e.target.checked);
            }}
          />
          Enable dark mode
        </label>
        <h3>Inference</h3>
        <h4>Anthropic API token</h4>
        <p>Token is resolved from 1password by the backend, get the reference by clicking on arrow on the field.</p>
        <label>
          <span>{hasResolvedToken ? "🔐" : "🔑"}</span>
          <Input
            _type={hasResolvedToken ? "success" : undefined}
            type="text"
            name="token"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
            }}
          />
        </label>
      </StyledForm>
    </>
  );
}
