import { Global } from "@emotion/react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import { Provider, useAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { NavigationSidebar } from "./navigation";
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

export const loader = async () => {
  const atoms = Object.entries(entangledAtoms).map(([key, atom]) => {
    const value = store.get(atom as any);
    return [key, value];
  }).filter(([_, value]) => value !== undefined);
  return atoms;
};

function Styles() {
  const [styles] = useAtom(stylesAtom);
  return <Global styles={styles} />;
}

export default function App() {
  const serverAtoms = useLoaderData<typeof loader>();
  useHydrateAtoms(
    serverAtoms.map(([key, value]) => [entangledAtoms[key as keyof typeof entangledAtoms], value]) as any,
  );
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
