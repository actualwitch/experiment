const transFlag = ["#5BCEFA", "#F5A9B8", "#FFFFFF"];
const enbyFlag = ["#2D2D2D", "#9B59D0", "#FFFFFF", "#FFF433"];

export const Palette = {
  actionableBackground: "#dddddd",
  disabledBackground: "#b5b5b50f",
  accent: "#ff98ef80",
  successGreen: "color(display-p3 0.372 0.903 0.775 / 1)",
  buttonHoverBackground: "color(display-p3 0 0 0 / 0.19)",
  buttonHoverDark: "#1a1a1a",
  buttonDisabledBackground: "#b5b5b50f",
  buttonDisabledForeground: "#e6e6e6",
  buttonDisabledBorder: "#8888880f",
  buttonShadowDark: "#ececec",
  white: transFlag[2],
  black: "#000000",
  blue: transFlag[0],
  inputBackground: "#eeeeee",
  link: enbyFlag[1],
  purple: enbyFlag[1],
  yellow: enbyFlag[3],
  green: "lightgreen",
  pink: "rgba(241, 165, 209, 1)",
  red: "red",
  teal: "rgb(0, 255, 231)",
  baseRadius: 3 / 4,
  borderCode: 1 / 3,
  borderSpan: 1 / 8,
} as const;
