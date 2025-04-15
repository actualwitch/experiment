import styled from "@emotion/styled";
import { useAtom, useSetAtom } from "jotai";
import { useState } from "react";
import { Item } from "react-stately";

import {
  isMetaExperimentAtom,
  isOnboardedAtom,
  nameAtom,
  pronounsAtom,
  setTokenAtom,
  tokensAtom,
} from "../../../atoms/store";
import { CUSTOM_OPTION, PRONOUNS, name } from "../../../const";
import { bs, Button } from "../../../style";
import { hasBackend } from "../../../utils/realm";
import { type ProviderType, providerLabels, providerTypes, withIds } from "../../inference/types";
import { Select } from "../../ui/Select";
import { Switch } from "../../ui/Switch";
import { TextField } from "../../ui/TextField";
import { Underline } from "../../../style/utils";
import { DesktopOnly } from "../../ui/Mobile";
import { tryOr } from "true-myth/result";

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

const parseString = (input: string) => {
  return tryOr("Couldn't parse config", () => {
    const parsed = JSON.parse(input) as {
      mcpServers: {
        [name: string]: {
          env?: Record<string, string>;
          command: string;
          args?: string[];
        };
      };
    };
    const [name] = Object.keys(parsed.mcpServers);
    const config = parsed.mcpServers[name];
    return { name, ...config };
  });
};

export const Onboarding = () => {
  const [metaExperiment] = useAtom(isMetaExperimentAtom);

  const [userName, setUserName] = useAtom(nameAtom);
  const [pronouns, setPronouns] = useAtom(pronounsAtom);
  const setIsOnboarded = useSetAtom(isOnboardedAtom);
  const setProviderToken = useSetAtom(setTokenAtom);

  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);
  const [token, setToken] = useState("");
  const [tokens, setTokens] = useAtom(tokensAtom);

  const [selectedTransport, setSelectedTransport] = useState<"stdio" | "http" | null>(null);
  const [mcpName, setMcpName] = useState("");
  const [mcpCommandOrUrl, setMcpCommandOrUrl] = useState("");

  return (
    <>
      <DesktopOnly>
        <h2>
          Let's start the <Underline>{name}</Underline>
        </h2>
      </DesktopOnly>

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
            onChange={setPronouns}
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
          {/* {metaExperiment && (
            <>
              <h3>Add MCP</h3>
              <Margin>
                <Switch value={selectedTransport} onChange={setSelectedTransport}>
                  {[
                    {
                      name: "⌨️ stdio",
                      value: "stdio",
                    },
                    {
                      name: "🌐 HTTP",
                      value: "http",
                    },
                  ]}
                </Switch>
              </Margin>
            </>
          )} */}

          {selectedTransport && (
            <OnboardingForm>
              <TextField label="Name" type="text" value={mcpName} onChange={setMcpName} />
              <TextField
                label={selectedTransport === "stdio" ? "Command" : "URL"}
                type="text"
                placeholder={selectedTransport === "stdio" ? "Paste command or Claude Desktop config" : undefined}
                value={mcpCommandOrUrl}
                onChange={setMcpCommandOrUrl}
              />
              <p>
                <Button
                  onClick={() => {
                    setSelectedTransport(null);
                  }}
                >
                  Add
                </Button>
              </p>
            </OnboardingForm>
          )}

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
