import templates from "../../fixtures/templates.json";

const sampleChat = templates["Sample chat"];

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
