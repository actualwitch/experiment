import { sampleChat } from "../fixtures/templates.json";

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
const openaiEventStream = [
  {
    index: 0,
    delta: {
      role: "assistant",
      content: null,
      tool_calls: [
        {
          index: 0,
          id: "call_psZOuVcEAR1Qqvdx3nl1nq7I",
          type: "function",
          function: {
            name: "bio",
            arguments: "",
          },
        },
      ],
      refusal: null,
    },
    logprobs: null,
    finish_reason: null,
  },
  {
    index: 0,
    delta: {
      tool_calls: [
        {
          index: 0,
          function: {
            arguments: '{"',
          },
        },
      ],
    },
    logprobs: null,
    finish_reason: null,
  },
  {
    index: 0,
    delta: {
      tool_calls: [
        {
          index: 0,
          function: {
            arguments: "memory",
          },
        },
      ],
    },
    logprobs: null,
    finish_reason: null,
  },
  {
    index: 0,
    delta: {
      tool_calls: [
        {
          index: 0,
          function: {
            arguments: '":"',
          },
        },
      ],
    },
    logprobs: null,
    finish_reason: null,
  },
  {
    index: 0,
    delta: {
      tool_calls: [
        {
          index: 0,
          function: {
            arguments: "User",
          },
        },
      ],
    },
    logprobs: null,
    finish_reason: null,
  },
  {
    index: 0,
    delta: {
      tool_calls: [
        {
          index: 0,
          function: {
            arguments: "'s",
          },
        },
      ],
    },
    logprobs: null,
    finish_reason: null,
  },
  {
    index: 0,
    delta: {
      tool_calls: [
        {
          index: 0,
          function: {
            arguments: " name",
          },
        },
      ],
    },
    logprobs: null,
    finish_reason: null,
  },
  {
    index: 0,
    delta: {
      tool_calls: [
        {
          index: 0,
          function: {
            arguments: " is",
          },
        },
      ],
    },
    logprobs: null,
    finish_reason: null,
  },
  {
    index: 0,
    delta: {
      tool_calls: [
        {
          index: 0,
          function: {
            arguments: " Ade",
          },
        },
      ],
    },
    logprobs: null,
    finish_reason: null,
  },
  {
    index: 0,
    delta: {
      tool_calls: [
        {
          index: 0,
          function: {
            arguments: '."',
          },
        },
      ],
    },
    logprobs: null,
    finish_reason: null,
  },
  {
    index: 0,
    delta: {
      tool_calls: [
        {
          index: 0,
          function: {
            arguments: "}",
          },
        },
      ],
    },
    logprobs: null,
    finish_reason: null,
  },
  {
    index: 0,
    delta: {},
    logprobs: null,
    finish_reason: "stop",
  },
];

const casualPrompt = `
You use casual speech and reply in short to-the-point responses. You have varying vocabulary and don't repeat yourself
`;
