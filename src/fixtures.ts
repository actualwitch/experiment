import type { Message } from "./state/common";

const markdownTest = `
## Header

This is a small showcase of common elements in markdown for testing purposes. Here's a \`span\`, and *italics*  and **bold** text. Here's a [link](https://www.kaggle.com). Here's a list:

- item 1
- item 2
- item 3

Here's a numbered list:

1. item 1
2. item 2
3. item 3

Here's a table:

| Header 1 | Header 2 |
|----------|----------|
| cell 1   | cell 2   |
| cell 3   | cell 4   |

Here's a code block:

\`\`\`typescript
const interactive = css\`
  cursor: pointer;
  user-select: none;
  :hover {
    opacity: 1;
  }
\`;
const Emphasis = styled.em<{ isCollapsed?: boolean }>(
  css\`
    font-weight: italic;
    opacity: 0.7;
  \`,
  ({ isCollapsed }) => {
    if (!isCollapsed) return;
    return css\`
      :before {
        content: "( ";
        opacity: 0.3;
      }
      :after {
        content: " )";
        opacity: 0.3;
      }
    \`;
  },
  interactive,
);
\`\`\`

Here's an image:

![image](https://www.kaggle.com/static/images/site-logo.png)

Here's a blockquote:

> This is a blockquote.

Here's a horizontal rule:

---
`;

const sampleChat: Message[] = [
  { role: "system", content: "This is a system message." },
  { role: "user", content: "This is a user message." },
  { role: "assistant", fromServer: true, content: markdownTest },
];

export const FIXTURES = {
  sample: {
    isDarkMode: true,
    experimentLayout: "chat",
    experiments: { "0": { "0": sampleChat } },
    experimentIds: [["0", "0"]],
    experiment: sampleChat,
  },
} as const;

export function isFixture(value: unknown): value is keyof typeof FIXTURES {
  return value ? typeof value === "string" && Object.keys(FIXTURES).includes(value) : false;
}