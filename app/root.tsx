import { Global } from "@emotion/react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import { useAtom } from "jotai";
import { NavigationSidebar } from "./navigation";
import { stylesAtom } from "./state/client";
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

export default function App() {
  const [styles] = useAtom(stylesAtom);
  return (
    <Container>
      <NavigationSidebar />
      <Outlet />
      <Global styles={styles} />
    </Container>
  );
}
