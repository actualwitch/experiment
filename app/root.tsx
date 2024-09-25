import { Global } from "@emotion/react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import { Provider, useAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
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
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔬</text></svg>"></link>
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

const AppShell = () => {
  const serverAtoms = useLoaderData<typeof loader>();
  useHydrateAtoms(
    Object.entries(serverAtoms || {}).map(([key, value]: any) => [
      entangledAtoms[key as keyof typeof entangledAtoms],
      value,
    ]),
  );
  useAtom(portalSubscription);
  const [styles] = useAtom(stylesAtom);
  return (
    <Container>
      <NavigationSidebar />
      <Outlet />
      <Global styles={styles} />
    </Container>);
}

export default function App() {
  return (
    <Provider store={store}>
      <AppShell />
    </Provider>
  );
}
