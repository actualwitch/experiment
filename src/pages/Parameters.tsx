import styled from "@emotion/styled";
import { useAtom } from "jotai";
import { hasResolvedTokenAtom, isDarkModeAtom, tokensAtom } from "../state/common";
import { bs } from "../style";
import { withFormStyling, type FormProps } from "../style/form";


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

export default function Configure() {
  const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom);
  const [hasResolvedToken] = useAtom(hasResolvedTokenAtom);
  console.log(hasResolvedToken);
  const [tokens, setTokens] = useAtom(tokensAtom);
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
              let value = e.target.value;
              if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
              }
              if (value.startsWith("op://")) {
                setTokens({ ...tokens, anthropic: value });
              }
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
              if (value.startsWith("op://")) {
                setTokens({ ...tokens, openai: value });
              }
            }}
          />
        </label>
      </StyledForm>
    </>
  );
}
