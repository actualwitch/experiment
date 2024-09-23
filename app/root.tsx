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

const useController = () => {
  const serverAtoms = useLoaderData<typeof loader>();
  // useEffect(() => {

  //   for (const [key, value] of Object.entries(serverAtoms || {})) {
  //     store.set(entangledAtoms[key as keyof typeof entangledAtoms], value);
  //   }
  // }, []);

  // console.log("hydrating", serverAtoms);
  useHydrateAtoms(
    Object.entries(serverAtoms || {}).map(([key, value]: any) => [
      entangledAtoms[key as keyof typeof entangledAtoms],
      value,
    ]),
  );
};

function Styles() {
  const [styles] = useAtom(stylesAtom);
  return <Global styles={styles} />;
}

export default function App() {
  useController();
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
