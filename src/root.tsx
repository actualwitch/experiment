import { Global } from "@emotion/react";
import { Provider, useAtom, useSetAtom } from "jotai";
import { Suspense, useEffect, useState, type PropsWithChildren } from "react";
import { useLocation, useNavigate } from "react-router";
import styled from "@emotion/styled";

import { Navigation } from "./feature/ui/Navigation";
import { descriptionAtom, iconAtom, navigateAtom, pageTitleAtom, Router } from "./feature/router";
import { subscriptionAtom, trackVisibleAtom } from "./atoms/focus";
import { store } from "./store";
import { Container, Slideover, stylesAtom } from "./style";
import { Hydration } from "./utils/hydration";
import { FavIcon } from "./feature/ui/FavIcon";
import { getRealm } from "./utils/realm";
import { clientCss, clientFile, name } from "./const";
import { ErrorBoundary } from "./feature/ui/error";
import {
  isActionPanelOpenAtom,
  isNavPanelOpenAtom,
  layoutAtom,
  layoutTrackerAtom,
  selectionAtom,
} from "./atoms/common";
import { isDarkModeAtom, isTransRightsAtom } from "./atoms/store";
import { DesktopOnly, MobileHeader, MobileOnly } from "./feature/ui/Mobile";
import type { Nullish } from "./types";
import { Page } from "./feature/ui/Page";
import { widthLimit } from "./style/mixins";

const Meta = () => {
  const [title] = useAtom(pageTitleAtom);
  const [description] = useAtom(descriptionAtom);
  const [icon] = useAtom(iconAtom);
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <FavIcon>{icon}</FavIcon>
    </>
  );
};

const Paragraph = styled.p(widthLimit);

const App = () => {
  const [styles] = useAtom(stylesAtom);
  useAtom(trackVisibleAtom);
  useAtom(subscriptionAtom);
  useAtom(layoutTrackerAtom);
  const [layout] = useAtom(layoutAtom);
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [isTransRights] = useAtom(isTransRightsAtom);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const setNavigate = useSetAtom(navigateAtom);
  useEffect(() => {
    setNavigate(() => navigate);
  }, [navigate]);
  const [isNavPanelOpen, setIsNavPanelOpen] = useAtom(isNavPanelOpenAtom);
  const [isActionPanelOpen, setIsActionPanelOpen] = useAtom(isActionPanelOpenAtom);
  const setSelection = useSetAtom(selectionAtom);
  useEffect(() => {
    setIsNavPanelOpen(false);
    setIsActionPanelOpen(false);
    setSelection([]);
  }, [pathname]);
  return (
    <Suspense fallback={null}>
      <Container layout={layout}>
        {isTransRights === false ? (
          <Page>
            <h2>
              🏳️‍⚧️ Trans rights <i>are</i> human rights
            </h2>
            <Paragraph>
              Much of hardware and software forming foundation of digital experiences you participate in every day,
              wouldn't be possible without contributions from queer people. That includes {name}, too. By refusing our
              rights you not only forfeit your humanity, you erase wonderful contribution that could have existed.
            </Paragraph>
          </Page>
        ) : (
          <>
            <DesktopOnly>
              <Navigation />
            </DesktopOnly>
            <MobileOnly>
              <MobileHeader />
            </MobileOnly>
            <MobileOnly>
              <Slideover isOpen={isNavPanelOpen} isDarkMode={isDarkMode} from="left">
                <Navigation />
              </Slideover>
            </MobileOnly>
            <Router />
          </>
        )}
        <Global styles={styles} />
      </Container>
    </Suspense>
  );
};

const Context = ({ children }: PropsWithChildren) => {
  return (
    <Provider store={store}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </Provider>
  );
};

const SpaNormalizer = ({ children }: PropsWithChildren) => {
  if (getRealm() === "ssg") {
    const [shouldRender, setShouldRender] = useState(false);
    useEffect(() => {
      setShouldRender(true);
    }, []);
    if (!shouldRender) return null;
  }
  return children;
};

export const Shell = ({
  bootstrap,
  additionalScripts,
  baseUrl,
}: {
  bootstrap?: true;
  additionalScripts?: Array<string | Nullish>;
  baseUrl?: string;
}) => {
  // 👻
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="manifest" href="manifest.json" />
        <link rel="stylesheet" href={clientCss} />
        <link rel="icon" href="experiment.png" />
        <Context>
          <Meta />
        </Context>
      </head>
      <body>
        <Context>
          <SpaNormalizer>
            <App />
          </SpaNormalizer>
        </Context>
        <Suspense fallback={null}>
          <ErrorBoundary>
            <Hydration />
          </ErrorBoundary>
        </Suspense>
        {additionalScripts
          ?.filter((script): script is string => Boolean(script))
          .map((script, index) => {
            return <script suppressHydrationWarning key={index} dangerouslySetInnerHTML={{ __html: script }} />;
          })}
        {bootstrap && <script suppressHydrationWarning type="module" src={`${baseUrl ?? ""}${clientFile}`} async />}
      </body>
    </html>
  );
};
