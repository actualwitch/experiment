import { Global } from "@emotion/react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import { Provider, useAtom } from "jotai";
import { createEntanglement, entangledResponse } from "./again";
import { sourceEffectAtom } from "./again";
import { NavigationSidebar } from "./navigation";
import { isDarkModeAtom, store } from "./state/common";
import { appStyle, Container, darkMode } from "./style";

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

const atoms = { isDarkModeAtom };
export const loader = () => entangledResponse(atoms);
const useEntanglement = createEntanglement(atoms);

const AppShell = () => {
  useAtom(sourceEffectAtom);
  useEntanglement();
  const isDarkMode = useAtom(isDarkModeAtom);
  const styles = isDarkMode ? [...appStyle, darkMode] : appStyle;
  return (
    <Container>
      <NavigationSidebar />
      <Outlet />
      <Global styles={styles} />
    </Container>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <AppShell />
    </Provider>
  );
}
