import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { atom, useAtom, useSetAtom } from "jotai";
import { type PropsWithChildren, useEffect, useState } from "react";
import { Item } from "react-stately";

import { Select } from "../ui/Select";
import { experimentLayoutAtom } from "../../atoms/common";
import {
  fontStackAtom,
  isBoldTextAtom,
  isDarkModeAtom,
  isMetaExperimentAtom,
  isTransRightsAtom,
  nameAtom,
  pronounsAtom,
  setTokenAtom,
  tokensAtom,
} from "../../atoms/store";
import { Button, FONT_STACKS, bs } from "../../style";
import { type WithDarkMode, withDarkMode } from "../../style/darkMode";
import { Palette } from "../../style/palette";
import { hasBackend } from "../../utils/realm";
import { providerLabels, providers, providerTypes, withIds, type ProviderType } from "../inference/types";
import { Page } from "../ui/Page";
import { TextField } from "../ui/TextField";
import { Switch } from "../ui/Switch";
import { Checkbox } from "../ui/Checkbox";
import { widthLimit } from "../../style/mixins";
import { CUSTOM_OPTION, PRONOUNS } from "../../const";
import { pronounOptions } from "./NewExperiment/Onboarding";
import { Trash2 } from "lucide-react";
import { shouldEnableLocalInferenceAtom } from "../inference/atoms";

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  ${widthLimit}
  input[type="text"] {
    flex: 1;
  }
  & > :not(h3) {
    margin-bottom: ${bs()};
  }
  & > :not(h3) + h3 {
    margin-top: ${bs(1 / 2)};
  }
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: ${bs(1 / 2)};
  & > header {
    font-size: 1.25em;
  }
  & > div {
    width: unset;
    display: unset;
  }
`;

const Container = styled.div<WithDarkMode>`
  padding: ${bs(1.5)} ${bs(2)};
  background: ${Palette.white};

  width: 520px;

  input {
    width: 100%;
  }
  ${(p) =>
    withDarkMode(
      p.isDarkMode,
      css`
        background: ${Palette.black};
      `,
    )}
`;

const Actions = styled.p`
  display: flex;
  justify-content: flex-end;
`;

const ModalContent = ({ children, close }: PropsWithChildren<{ close: () => void }>) => {
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);
  const [token, setToken] = useState("");
  const [tokens, setTokens] = useAtom(tokensAtom);
  const submit = () => {
    if (!selectedProvider) {
      return;
    }
    let value = token;

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    setTokens({ ...tokens, [selectedProvider]: value });
    close();
  };

  return (
    <Container isDarkMode={isDarkMode}>
      <h3>Add provider</h3>
      <p>
        <Select
          items={providers}
          onSelectionChange={(value) => setSelectedProvider(value as "anthropic" | "mistral" | "openai")}
        >
          {(item) => (
            <Item textValue={item.name}>
              <div>{item.name}</div>
            </Item>
          )}
        </Select>
      </p>
      <p>
        <input
          type="password"
          placeholder={hasBackend() ? "Token or 1Password reference" : "Token"}
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </p>
      <Actions>
        {children}
        <Button
          onClick={(e) => {
            e.preventDefault();
            submit();
          }}
          disabled={!selectedProvider || !token}
        >
          Add
        </Button>
      </Actions>
    </Container>
  );
};

export default function Parameters() {
  const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom);
  const [isBoldText, setIsBoldText] = useAtom(isBoldTextAtom);
  const [fontStack, setFontStack] = useAtom(fontStackAtom);
  const [experimentLayout, setExperimentLayout] = useAtom(experimentLayoutAtom);

  const [isMetaExperiment, setIsMetaExperiment] = useAtom(isMetaExperimentAtom);
  const [isTransRights, setIsTransRights] = useAtom(isTransRightsAtom);

  const [tokens, setTokens] = useAtom(tokensAtom);
  const [shouldEnableLocalInference] = useAtom(shouldEnableLocalInferenceAtom);
  const setProviderToken = useSetAtom(setTokenAtom);
  const [isAdding, setIsAdding] = useState(false);

  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);
  const [token, setToken] = useState("");

  const [name, setName] = useAtom(nameAtom);
  const [pronouns, setPronouns] = useAtom(pronounsAtom);

  const submit = () => {
    if (!selectedProvider || !token) {
      return;
    }

    setProviderToken(selectedProvider, token);
    setIsAdding(false);
    setToken("");
    setSelectedProvider(null);
  };

  const availableOptions = providerTypes
    .filter((provider) =>
      tokens[provider] !== undefined ? false : provider === "local" ? shouldEnableLocalInference : true,
    )
    .map((provider) => ({
      value: provider,
      name: providerLabels[provider],
    }));

  useEffect(() => {
    if (selectedProvider === "local") {
      setTokens({ ...tokens, local: "" });
      setSelectedProvider(null);
      setIsAdding(false);
    }
  }, [tokens, selectedProvider]);

  return (
    <Page>
      <StyledForm
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <h3>Visual</h3>
        <Row>
          <header>Theme</header>
          <Switch value={isDarkMode} onChange={setIsDarkMode}>
            {[
              { value: undefined, name: "System", isDefault: true },
              { value: false, name: "Light" },
              { value: true, name: "Dark" },
            ]}
          </Switch>
        </Row>
        <Row>
          <header>Font stack</header>
          <Select
            items={withIds(Object.keys(FONT_STACKS))}
            onSelectionChange={(value) => setFontStack(value as keyof typeof FONT_STACKS)}
            selectedKey={fontStack ?? "Transitional"}
          >
            {(item) => (
              <Item textValue={item.name}>
                <div>{item.name}</div>
              </Item>
            )}
          </Select>
        </Row>
        <Row>
          <header>Bold text</header>
          <Switch value={isBoldText} onChange={setIsBoldText}>
            {[
              { value: false, name: "Off", isDefault: true },
              { value: true, name: "On" },
            ]}
          </Switch>
          {/* <Checkbox /> */}
        </Row>
        <Row>
          <header>Layout</header>
          <Switch value={experimentLayout} onChange={setExperimentLayout}>
            {[
              { value: "left", name: "Left" },
              { value: "chat", name: "Chat", isDefault: true },
              { value: "chat-reverse", name: "Chat (rev)" },
            ]}
          </Switch>
        </Row>
        <h3>Semantic</h3>
        <Row>
          <header>Name</header>
          <TextField value={name} onChange={setName} />
        </Row>
        <Row>
          <header>Pronouns</header>

          {pronouns === undefined || PRONOUNS.includes(pronouns) ? (
            <Select
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
            <TextField optional value={pronouns} onChange={setPronouns} autoFocus />
          )}
        </Row>
        <Row>
          <header>MetaExperiment</header>
          <Switch value={isMetaExperiment} onChange={setIsMetaExperiment}>
            {[
              { value: false, name: "Off", isDefault: true },
              { value: true, name: "On" },
            ]}
          </Switch>
        </Row>
        <Row style={{ marginTop: `-${bs(3 / 4)}` }}>Enable hypotheses that are yet to demonstrate their viability.</Row>
        <Row>
          <header>🏳️‍⚧️ Trans rights</header>
          <Switch value={isTransRights} onChange={setIsTransRights}>
            {[
              { value: false, name: "Off" },
              { value: undefined, name: "On", isDefault: true },
            ]}
          </Switch>
        </Row>
        <h3>Inference</h3>
        <Row>
          <header>Providers</header>
          {isAdding ? (
            <Switch value={selectedProvider} onChange={setSelectedProvider}>
              {availableOptions}
            </Switch>
          ) : (
            availableOptions.length > 0 && <Button onClick={() => setIsAdding(true)}>Add</Button>
          )}
        </Row>
        {selectedProvider && (
          <TextField
            type="password"
            placeholder={hasBackend() ? "Token or 1Password reference" : "Token"}
            onChange={(value) => setToken(value)}
            onBlur={() => {
              submit();
            }}
          />
        )}
        {(Object.keys(tokens) as Array<keyof typeof tokens>).map((provider) => (
          <Row key={provider}>
            <header>{providerLabels[provider]}</header>
            <Button
              onClick={() => {
                const { [provider]: _, ...newTokens } = tokens;
                setTokens(newTokens);
              }}
            >
              <Trash2 size={12} />
              Remove
            </Button>
          </Row>
        ))}
      </StyledForm>
    </Page>
  );
}
