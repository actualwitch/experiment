import styled from "@emotion/styled";
import { useAtom } from "jotai";
import { experimentLayoutAtom, isDarkModeAtom, tokensAtom } from "../state/common";
import { bs } from "../style";
import { withFormStyling, type FormProps } from "../style/form";
import { hasResolvedTokenAtom } from "../state/inference";
import { Switch } from "../components/switch";
import { useState } from "react";

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

export default function Configure() {
  const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom);
  const [experimentLayout, setExperimentLayout] = useAtom(experimentLayoutAtom);
  const [hasResolvedToken] = useAtom(hasResolvedTokenAtom);
  const [tokens, setTokens] = useAtom(tokensAtom);
  const [token, setToken] = useState("");
  return (
    <>
      <StyledForm onSubmit={(e) => {
        e.preventDefault();
      }}>
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
        <p>For each provider, paste the secret reference from 1Password, it will be securely fetched just-in-time.</p>
        <h5>Anthropic</h5>
        <label>
          <span>{hasResolvedToken.anthropic ? "🔐" : "🔑"}</span>
          <Input
            _type={hasResolvedToken.anthropic ? "success" : undefined}
            type="text"
            name="token"
            value={tokens.anthropic}
            onChange={(e) => {
              e.preventDefault();
              let value = e.target.value;
              if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
              }
              console.log(value);
              setTokens({ ...tokens, anthropic: value });
            }}
          />
        </label>
        <h5>Mistral</h5>
        <label>
          <span>{hasResolvedToken.anthropic ? "🔐" : "🔑"}</span>
          <Input
            _type={hasResolvedToken.anthropic ? "success" : undefined}
            type="text"
            name="token"
            value={token}
            onChange={(e) => {
              e.preventDefault();
              let value = e.target.value;
              if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
              }
              setToken(value);
            }}
          />
        </label>
        <h5>OpenAI</h5>
        <label>
          <span>{hasResolvedToken.openai ? "🔐" : "🔑"}</span>
          <Input
            _type={hasResolvedToken.openai ? "success" : undefined}
            type="text"
            name="token"
            value={tokens.openai}
            onChange={(e) => {
              let value = e.target.value;
              if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
              }
              setTokens({ ...tokens, openai: value });
            }}
          />
        </label>
      </StyledForm>
    </>
  );
}
