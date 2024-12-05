import styled from "@emotion/styled";
import { useAtom } from "jotai";
import { experimentLayoutAtom, isDarkModeAtom, tokensAtom } from "../state/common";
import { bs, Button } from "../style";
import { withFormStyling, type FormProps } from "../style/form";
import { hasResolvedTokenAtom } from "../state/inference";
import { Switch } from "../components/switch";
import { useState, type PropsWithChildren } from "react";
import { ModalTrigger } from "../components/ModalTrigger";
import { Block, providers, providerTypes, type ProviderType } from "./NewExperiment";
import { Select } from "../components/Select";
import { Item } from "react-stately";
import { withDarkMode, type WithDarkMode } from "../style/darkMode";
import { css } from "@emotion/react";
import { Palette } from "../style/palette";

const Input = styled.input<FormProps>(withFormStyling);

const StyledForm = styled.form`
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

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${bs()};
  & > header {
    font-size: 1.25em;
  }
`;

const Container = styled.div<WithDarkMode>`
  padding: ${bs(1.5)} ${bs(2)};
  background: ${Palette.white};

  width: 520px;

  input {
    width: 100%;
  }
  ${p => withDarkMode(p.isDarkMode, css`
    background: ${Palette.black};
    `)}
`;

const Actions = styled.p`
  display: flex;
  justify-content: flex-end;
`;

const ModalContent = ({ children, close }: PropsWithChildren<{close: () => void}>) => {
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
  }

  return (
    <Container isDarkMode={isDarkMode}>
      <h3>Add provider</h3>
      <p>
        <Select items={providers} onSelectionChange={(value) => setSelectedProvider(value)}>
          {(item) => (
            <Item textValue={item.name}>
              <div>{item.name}</div>
            </Item>
          )}
        </Select>
      </p>
      <p>
        <Input
          type="password"
          placeholder="Token or 1password reference"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </p>
      <Actions>
        {children}
        <Button onClick={(e) => {
          e.preventDefault();
          submit();
        }} disabled={!selectedProvider || !token}>Add</Button>
      </Actions>
    </Container>
  );
};

export default function Configure() {
  const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom);
  const [experimentLayout, setExperimentLayout] = useAtom(experimentLayoutAtom);
  const [hasResolvedToken] = useAtom(hasResolvedTokenAtom);
  const [tokens, setTokens] = useAtom(tokensAtom);
  return (
    <>
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
              { value: undefined, label: "System", isDefault: true },
              { value: false, label: "Light" },
              { value: true, label: "Dark" },
            ]}
          </Switch>
        </Row>
        <Row>
          <header>Layout</header>
          <Switch value={experimentLayout} onChange={setExperimentLayout}>
            {[
              { value: "left", label: "Left" },
              { value: "chat", label: "Chat", isDefault: true },
              { value: "chat-reverse", label: "Chat (rev)" },
            ]}
          </Switch>
        </Row>
        <h3>Inference</h3>
        <Row>
          <header>Providers</header>
          <ModalTrigger label="Add">
            {(close) => {
              return (
                <ModalContent close={close}>
                  <Button onClick={close}>close</Button>
                </ModalContent>
              );
            }}
          </ModalTrigger>
        </Row>
        {Object.keys(tokens).map((provider) => (
          <Row key={provider}>
            <header>{provider}</header>
            <Button onClick={() => setTokens({ ...tokens, [provider]: undefined })}>Remove</Button>
          </Row>
        ))}
      </StyledForm>
    </>
  );
}
