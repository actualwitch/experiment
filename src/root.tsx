import { Global } from "@emotion/react";
import { Provider, useAtom } from "jotai";
import { type PropsWithChildren } from "react";
import { description, title } from "./meta";
import { NavigationSidebar } from "./navigation";
import { Router } from "./pages/_router";
import { subscriptionAtom, trackVisibleAtom } from "./state/focus";
import { store } from "./state/store";
import { Container, stylesAtom } from "./style";
import { Hydration } from "./utils/hydration";
import { FavIcon } from "./components/FavIcon";

const Context = ({ children }: PropsWithChildren) => {
  return <Provider store={store}>{children}</Provider>;
};

const App = () => {
  const [styles] = useAtom(stylesAtom);
  useAtom(trackVisibleAtom);
  useAtom(subscriptionAtom);
  return (
    <Container>
      <NavigationSidebar />
      <Router />
      <Global styles={styles} />
    </Container>
  );
};

export const Shell = ({ bootstrap }: { bootstrap?: true }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <FavIcon>🔬</FavIcon>
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
