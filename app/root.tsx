import { Global } from "@emotion/react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import { Provider, useAtom } from "jotai";
import { createLoader } from "./createLoader";
import { NavigationSidebar } from "./navigation";
import { portalSubscription } from "./routes/portal";
import { stylesAtom } from "./state/client";
import { entangledAtoms, store } from "./state/common";
import { Container } from "./style";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export const loader = createLoader(entangledAtoms);

function Styles() {
  const [styles] = useAtom(stylesAtom);
  return <Global styles={styles} />;
}

export default function App() {
  useAtom(portalSubscription);
  return (
    <Provider store={store}>
      <Container>
        <NavigationSidebar />
        <Outlet />
        <Styles />
      </Container>
    </Provider>
  );
}
