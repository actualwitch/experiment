import { Global } from "@emotion/react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, useSubmit } from "@remix-run/react";
import { Provider, useAtom } from "jotai";
import { createLoader } from "./createLoader";
import { NavigationSidebar } from "./navigation";
import { portalSubscription } from "./routes/portal";
import { stylesAtom } from "./state/client";
import { entangledAtoms, store } from "./state/common";
import { Container } from "./style";
import { createController } from "./createController";
import { useHydrateAtoms } from "jotai/utils";
import { useMemo } from "react";

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

const useController = () => {
  const serverAtoms = useLoaderData<typeof loader>();
  console.log({ serverAtoms });
  const hydration = useMemo(() => {
    return Object.entries(serverAtoms || {}).map(([key, value]: any) => [entangledAtoms[key as keyof typeof entangledAtoms], value]) as any;
  }, []);
  useHydrateAtoms(hydration);
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
