import { Global } from "@emotion/react";
import { atom, Provider, useAtom, useSetAtom } from "jotai";
import { Suspense, useEffect, useState, type PropsWithChildren } from "react";
import { useLocation } from 'react-router';

import { NavigationSidebar } from "./navigation";
import { Router } from "./pages/_router";
import { subscriptionAtom, trackVisibleAtom } from "./state/focus";
import { store } from "./state/store";
import { Container, Slideover, stylesAtom } from "./style";
import { Hydration } from "./utils/hydration";
import { FavIcon } from "./components/FavIcon";
import { getRealm } from "./utils/realm";
import { clientFile } from "./const";
import { pageTitleAtom, descriptionAtom, iconAtom } from "./state/meta";
import { ErrorBoundary } from "./components/error";
import { isActionPanelOpenAtom, isDarkModeAtom, isNavPanelOpenAtom, layoutAtom, layoutTrackerAtom } from "./state/common";
import { MobileHeader } from "./components/Mobile";

const Context = ({ children }: PropsWithChildren) => {
  return (
    <Provider store={store}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </Provider>
  );
};

const SpaNormalizer = ({ children }: PropsWithChildren) => {
  if (getRealm() === "spa") {
    const [shouldRender, setShouldRender] = useState(false);
    useEffect(() => {
      setShouldRender(true);
    }, []);
    if (!shouldRender) return null;
  }
  return children;
};

const App = () => {
  const [styles] = useAtom(stylesAtom);
  useAtom(trackVisibleAtom);
  useAtom(subscriptionAtom);
  useAtom(layoutTrackerAtom);
  const [layout] = useAtom(layoutAtom);
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const {pathname} = useLocation();
  const [isNavPanelOpen, setIsNavPanelOpen] = useAtom(isNavPanelOpenAtom);
  const [isActionPanelOpen, setIsActionPanelOpen] = useAtom(isActionPanelOpenAtom);
  useEffect(() => {
    setIsNavPanelOpen(false);
    setIsActionPanelOpen(false);
  }, [pathname]);
  return (
    <Suspense fallback={null}>
      <Container layout={layout}>
        {layout === "desktop" && <NavigationSidebar />}
        {layout === "mobile" && <MobileHeader />}
        {layout === "mobile" && (
          <Slideover isOpen={isNavPanelOpen} isDarkMode={isDarkMode} from="right">
            <NavigationSidebar />
          </Slideover>
        )}
        <Router />
        <Global styles={styles} />
      </Container>
    </Suspense>
  );
};

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

export const Shell = ({
  bootstrap,
  additionalScripts,
  baseUrl,
}: {
  bootstrap?: true;
  additionalScripts?: string[];
  baseUrl?: string;
}) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
        {additionalScripts?.map((script, index) => {
          return <script suppressHydrationWarning key={index} dangerouslySetInnerHTML={{ __html: script }} />;
        })}
        {bootstrap && <script suppressHydrationWarning type="module" src={`${baseUrl ?? ""}${clientFile}`} async />}
      </body>
    </html>
  );
};
