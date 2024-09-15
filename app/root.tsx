import { Global } from "@emotion/react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import { Provider, useAtom } from "jotai";
import { NavigationSidebar } from "./navigation";
// import * as clientAtoms from "./state/client";
// import * as serverAtoms from "./state/server";
import { Container } from "./style";
import { useHydrateAtoms } from "jotai/utils";
import { Debugger } from "./dbg";
import { ReactNode } from "react";
import { entangledAtoms, store, } from "./state/common";
import { stylesAtom } from "./state/client";

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

export const loader = async () => {
  const resolvedStore = store.get(entangledAtoms.storeAtom);
  const atoms = Object.entries(entangledAtoms).map(([key, atom]) => {
    const value = store.get(atom as any);
    return [key, value];
  });
  return { store: resolvedStore, entangledAtoms: atoms };
};

const Hydration = ({ children }: { children: ReactNode }) => {
  const { store, entangledAtoms: serverAtoms } = useLoaderData<typeof loader>();
  const items = [
    // @ts-ignore
    ...(serverAtoms.map(([key, value]) => [entangledAtoms[key], value]) as any),
  ];
  useHydrateAtoms(items);
  return <>{children}</>;
};

function Styles() {
  const [styles] = useAtom(stylesAtom);
  return <Global styles={styles} />;
}

export default function App() {
  return (
    <Hydration>
      <Provider store={store}>
        <Container>
          <NavigationSidebar />
          <Outlet />
          <Styles />
        </Container>
      </Provider>
    </Hydration>
  );
}
