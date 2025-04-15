import styled from "@emotion/styled";
import { transformerColorizedBrackets } from "@shikijs/colorized-brackets";
import { useAtom, useSetAtom } from "jotai";
import { type ReactNode, useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { applyDiffAtom } from "../../atoms/diff";
import { isDarkModeAtom } from "../../atoms/store";
import { newLine } from "../../const";
import { bs } from "../../style";
import { Palette } from "../../style/palette";
import { increaseSpecificity, widen } from "../../style/utils";
import { hasBackend } from "../../utils/realm";
import { isRunningAtom } from "../inference/atoms";
import { inlineButtonModifier } from "../router/NewExperiment/NewExperiment";
import { systemThemeAtom } from "../../atoms/darkMode";
import { match, P } from "ts-pattern";

const ActionRow = styled.div`
  display: flex;
  gap: ${bs(1 / 2)};
  ${increaseSpecificity()} {
    margin: 0 12px 2px;
  }
  button {
    padding: 0;
    font-size: 14px;
    text-decoration: underline;
    text-shadow: none;

    :hover {
      background: initial;
      color: ${Palette.accent};
    }
  }
  ${
    /* it may look stupid, but this exact construct is required because you can't increase specificity of element type selector, but class works */ ""
  }
  ${increaseSpecificity()} {
    button {
      ${inlineButtonModifier}
    }
  }
`;

const Container = styled.div`
  overflow-x: scroll;
  scrollbar-width: none;
  ${["left", "right", "bottom"].map((align) => widen(align, bs(1 / 2))).join(newLine)}
`;

export function Code({ language, value }: { language?: string; value?: ReactNode }) {
  const applyDiff = useSetAtom(applyDiffAtom);
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [isRunning] = useAtom(isRunningAtom);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [systemTheme] = useAtom(systemThemeAtom);

  useEffect(() => {
    if (isRunning || typeof value !== "string" || !language) return;
    const theme = match(isDarkMode)
      .with(P.nullish, () => systemTheme || "light")
      .with(false, () => "light")
      .otherwise(() => "dark");
    codeToHtml(value, {
      lang: language,
      theme: theme === "dark" ? "laserwave" : "material-theme-lighter",
      transformers: [transformerColorizedBrackets()],
    }).then((content) => setHtmlContent(content));
  }, [isRunning, language, value]);

  return (
    <>
      <ActionRow>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.writeText(value);
          }}
        >
          Copy
        </button>
        {language === "diff" && hasBackend() ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              applyDiff(value);
            }}
          >
            Apply
          </button>
        ) : null}
      </ActionRow>
      {htmlContent ? (
        <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: htmlContent }}></div>
      ) : (
        <pre>
          <Container>
            <code>{value}</code>
          </Container>
        </pre>
      )}
    </>
  );
}
