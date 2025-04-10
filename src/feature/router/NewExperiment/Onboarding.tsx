import styled from "@emotion/styled";
import { useAtom, useSetAtom } from "jotai";
import { useState } from "react";
import { Item } from "react-stately";

import { isOnboardedAtom, nameAtom, pronounsAtom, setTokenAtom, tokensAtom } from "../../../atoms/store";
import { CUSTOM_OPTION, PRONOUNS, name } from "../../../const";
import { bs, Button } from "../../../style";
import { hasBackend } from "../../../utils/realm";
import { type ProviderType, providerLabels, providerTypes, withIds } from "../../inference/types";
import { Select } from "../../ui/Select";
import { Switch } from "../../ui/Switch";
import { TextField } from "../../ui/TextField";
import { Underline } from "../../../style/utils";

export const pronounOptions = withIds([...PRONOUNS, CUSTOM_OPTION]);

export const OnboardingForm = styled.form`
  max-width: 40ch;
  margin-bottom: ${bs(3 / 2)};
  & > div + div {
    margin-top: ${bs(1 / 2)};
  }
  & > p {
    margin-top: ${bs()};
  }
`;

export const Margin = styled.div`
  margin-bottom: ${bs()};
`;

export const MarginTop = styled.div`
  margin-top: ${bs(3 / 2)};
`;

export const Onboarding = () => {
  const [userName, setUserName] = useAtom(nameAtom);
  const [pronouns, setPronouns] = useAtom(pronounsAtom);
  const setIsOnboarded = useSetAtom(isOnboardedAtom);
  const setProviderToken = useSetAtom(setTokenAtom);

  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);
  const [token, setToken] = useState("");
  const [tokens, setTokens] = useAtom(tokensAtom);
  return (
    <>
      <h2>
        Let's start the <Underline>{name}</Underline>
      </h2>

      <h5>
        Welcome, <i>{userName || "User"}</i>.
      </h5>
      <OnboardingForm>
        <TextField label="Name" optional value={userName || ""} onChange={(val) => setUserName(val)} />
        {pronouns === undefined || PRONOUNS.includes(pronouns) ? (
          <Select
            label="Pronouns"
            optional
            selectedKey={pronouns}
            onSelectionChange={(option) => setPronouns(String(option))}
            items={pronounOptions}
          >
            {(item) => (
              <Item textValue={item.name}>
                {item.name === CUSTOM_OPTION ? <i>{item.name}</i> : <div>{item.name}</div>}
              </Item>
            )}
          </Select>
        ) : (
          <TextField
            label="Pronouns"
            optional
            value={pronouns}
            onChange={(val) => setPronouns(val)}
            placeholder="( custom )"
            autoFocus
          />
        )}
      </OnboardingForm>

      {Object.keys(tokens).length !== 3 && (
        <>
          <h3>Add provider</h3>
          <Margin>
            <Switch value={selectedProvider} onChange={setSelectedProvider}>
              {providerTypes.map((provider) => ({
                value: provider,
                name: providerLabels[provider],
                isDisabled: tokens[provider] !== undefined,
              }))}
            </Switch>
          </Margin>

          {selectedProvider && (
            <OnboardingForm>
              <TextField
                label={hasBackend() ? "Token or 1Password reference" : "Token"}
                type="password"
                value={token}
                onChange={(val) => setToken(val)}
              />
              <p>
                <Button
                  onClick={() => {
                    setProviderToken(selectedProvider, token);
                    setToken("");
                    setSelectedProvider(null);
                  }}
                >
                  Add
                </Button>
              </p>
            </OnboardingForm>
          )}
        </>
      )}

      {Object.keys(tokens).length > 0 && (
        <>
          {/* <h3>Add MCP</h3> */}
          <MarginTop>
            <Button
              onClick={() => {
                setIsOnboarded(true);
              }}
            >
              🔬 Start
            </Button>
          </MarginTop>
        </>
      )}
    </>
  );
};
