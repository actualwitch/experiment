import { name } from ".";

const icons = {
  "🔬": "🪄",
  "⛴️": "😈",
  "🛠️": "🧙‍♀️",
  "💿": "📖",
  "📅": "✨",
  "🌍": "🚪",
};

const terms = {
  [name]: "Incantation",
  Import: "Conjure",
  Templates: "Enchiridion",
  Parameters: "Witchcraft",
  context: "Circumstance",
  Calendar: "Timeline",
  Explore: "Portal",
};

export const terminologyMap = {
  ...icons,
  ...terms,
};

export const mapTerminology = (term: string) => terminologyMap[term as keyof typeof terminologyMap] || term;
