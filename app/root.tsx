import { Global } from "@emotion/react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import { appStyle, Container, darkMode } from "./style";
import { NavigationSidebar } from "./navigation";
import { useAtom } from "jotai";
import { stylesAtom } from "./state/client";
import { Suspense, useMemo } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [styles] = useAtom(stylesAtom);
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Container>
          <NavigationSidebar />
          {children}
        </Container>
        <ScrollRestoration />
        <Global styles={styles} />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Outlet />
    </Suspense>
  );
}
