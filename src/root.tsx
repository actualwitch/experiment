import { Provider, useAtom } from "jotai";
import { Suspense, useEffect, type PropsWithChildren } from "react";
import { Hydration } from "./utils/hydration";
import { Router } from "./pages/_router";
import { store } from "./state/common";
import { appStyle, Container, darkMode } from "./style";
import { Global } from "@emotion/react";
import { isDarkModeAtom } from "./state/common";
import { NavigationSidebar } from "./navigation";
import { publish } from "./state/æther";

const Context = ({ children }: PropsWithChildren) => {
  return <Provider store={store}>{children}</Provider>;
};

const App = () => {
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const styles = isDarkMode ? [...appStyle, darkMode] : appStyle;
  return (
    <Container>
      <NavigationSidebar />
      <Router />
      <Global styles={styles} />
    </Container>
  );
};

export const Shell = ({ bootstrap }: { bootstrap?: true }) => {
  useEffect(() => {
    const source = new EventSource("/");
    source.addEventListener("message", (event) => {
      publish(JSON.parse(event.data));
    });
    return () => {
      source.close();
    };
  }, []);
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Experiment</title>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔬</text></svg>"
        ></link>
      </head>
      <body>
        <Context>
          <App />
        </Context>
        <Hydration />
        {bootstrap && <script type="module" src="/script.js" async />}
      </body>
    </html>
  );
};
