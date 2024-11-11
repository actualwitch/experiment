
const transFlag = [
    "#5BCEFA",
    "#F5A9B8",
    "#FFFFFF"
];
const enbyFlag = [
    "#2D2D2D",
    "#9B59D0",
    "#FFFFFF",
    "#FFF433",
];

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
    inputBackground: "#eeeeee",
    link: transFlag[0],
    purple: enbyFlag[1],
    yellow: enbyFlag[3],
    green: "lightgreen",
    pink: "color(display-p3 0.9 0.66 0.81)",
} as const;