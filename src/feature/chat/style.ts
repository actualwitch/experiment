import { type SerializedStyles, css } from "@emotion/react";
import styled from "@emotion/styled";
import { transparentize } from "polished";
import { match } from "ts-pattern";
import type { Store } from "../../atoms/store";
import { TRIANGLE } from "../../const";
import { bs } from "../../style";
import type { WithDarkMode } from "../../style/darkMode";
import { nonInteractive } from "../../style/mixins";
import { Palette } from "../../style/palette";
import type { Role } from "../../types";
import type { WithTransitionState } from "../transitionState";
import type { WithLayout } from "../../atoms/common";
import { withOnMobile } from "../../style/layout";

export const ChatContainer = styled.div<WithDarkMode & WithLayout>`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: end;

  :not(pre) > code {
    border-radius: ${bs(Palette.borderSpan)};
    padding: 0 ${bs(1 / 10)};
  }

  pre {
    text-align: left;
  }

  a {
    color: ${(p) => (p.isDarkMode ? Palette.pink : Palette.pink)};
    text-decoration: none;
    :hover {
      color: ${(p) => (p.isDarkMode ? Palette.purple : Palette.purple)};
    }
  }

  & > article {
    flex-shrink: 0;
  }
  ${(p) =>
    withOnMobile(
      p.layout,
      css`
        article {
          margin-right: -${bs()};
          margin-left: -${bs()};
        }
      `,
    )}
`;

export const getAlign = (fromServer: boolean, experimentLayout: Store["experimentLayout"]) => {
  switch (experimentLayout) {
    case "left":
      return "left";
    case "chat-reverse":
      return fromServer ? "right" : "left";
    default:
      return fromServer ? "left" : "right";
  }
};

export const MessageComponent = styled.article<
  {
    role: Role;
    contentType?: string;
    ioType?: "input" | "output";
    isSelected?: boolean;
    isDarkMode?: boolean;
    experimentLayout: Store["experimentLayout"];
    name?: string;
    sideLabel?: string | false;
  } & WithTransitionState
>(
  ({
    name,
    role,
    ioType,
    contentType,
    isSelected,
    isDarkMode,
    experimentLayout,
    transitionState,
    sideLabel = [contentType, name ?? role].filter(Boolean).join(` ${TRIANGLE} `),
  }) => {
    const fromServer = ioType === "output";
    const align = getAlign(fromServer, experimentLayout);
    const alignComplement = align === "right" ? "left" : "right";
    const styles: SerializedStyles[] = [
      css`
      border-${align}: 4px solid transparent;
      position: relative;
      overflow: hidden;
      transition: all 100ms ease-in;
      opacity: 0;
      transform: translateX(${align === "left" ? "-" : ""}10px);
      padding-bottom: ${bs(1 / 2)};
      padding-${align}: ${bs(3 / 8)};
      padding-${alignComplement}: ${bs(1 / 4)};
      text-align: ${align};
      cursor: pointer;

      & > * {
        padding-${align}: ${bs(3 / 8)};
      }

      & > *:not(header) {
        transition: background 100ms ease-out, border-color 100ms ease-out;
        border-radius: ${bs(Palette.borderCode)};
        border: 1px solid ${Palette.white}00;
        padding-top: ${bs(1 / 4)};
        padding-${alignComplement}: ${bs(1 / 4)};
      }

      
      &:hover > *:not(header) {
        border-color: ${isDarkMode ? `${Palette.white}40` : "#22222240"};
      }

      & > * {
        display: grid;
        word-wrap: break-word;
      }

      li ul,
      li ol {
        padding-${align}: ${bs()};
        padding-${alignComplement}: 0;
      }

      hr {
        opacity: 0.2;
        color: ${isDarkMode ? Palette.white : Palette.black};
        margin-top: ${bs(0.15)};
        margin-bottom: ${bs(0.05)};
        border: 0;
        border-bottom: 1px solid currentColor;
      }

      pre > hr {
        margin-bottom: ${bs(1 / 4)}
      }
    `,
    ];
    if (sideLabel) {
      styles.push(css`
        & > * {
          padding-${align}: ${bs(1.5)};
        }
        &:before {
          content: "${sideLabel}";
          position: absolute;
          ${align}: 0;
          transform-origin: ${align};
          ${
            align === "right"
              ? css`
                transform: rotate(-90deg) translate(0, -20px);
              `
              : css`
                transform: rotate(270deg) translate(-100%, 16px);
              `
          }
        }
      `);
    }
    if (align === "right" && contentType === "object") {
      styles.push(css`
        ol {
          padding-left: 0;
        }
      `);
    }

    const accentColor = match(role)
      .with("system", () => Palette.yellow)
      .with("developer", () => Palette.blue)
      .with("user", () => Palette.purple)
      .with("assistant", () => Palette.pink)
      .with("tool", () => Palette.green)
      .with("info", () => (isDarkMode ? `${Palette.white}70` : `${Palette.black}50`))
      .with("error", () => Palette.red)
      .with("context", () => Palette.teal)
      .exhaustive();

    styles.push(css`
      border-color: ${accentColor};
      background: linear-gradient(
        to ${alignComplement},
        ${transparentize(0.87, accentColor)},
        ${transparentize(1, accentColor)} 33%
      );
      *::selection {
        background-color: ${accentColor};
      }
    `);
    if (isSelected) {
      if (isDarkMode) {
        styles.push(css`
          & > *:not(header) {
            background: #f9f9f924;
          }
        `);
      } else {
        styles.push(css`
          & > *:not(header) {
            background: #7d7d7d24;
          }
        `);
      }
    }

    if (transitionState === "entered") {
      styles.push(css`
        opacity: 1;
        transform: translateX(0px);
      `);
    }
    if (transitionState === "entering") {
      styles.push(css`
        opacity: 1;
        transform: translateX(0px);
      `);
    }

    return styles;
  },
);

export const Banner = styled.div`
  display: grid;
  place-items: center;
  height: 100%;
  font-size: ${bs(2)};
`;

export const Header = styled.header`
  padding-top: ${bs(1 / 4)};
  font-size: 14px;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 4px;
  ${nonInteractive}
`;
