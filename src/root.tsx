import { Global } from "@emotion/react";
import { atom, Provider, useAtom } from "jotai";
import { Suspense, useEffect, useState, type PropsWithChildren } from "react";
import { description, title } from "./meta";
import { NavigationSidebar } from "./navigation";
import { Router } from "./pages/_router";
import { subscriptionAtom, trackVisibleAtom } from "./state/focus";
import { store } from "./state/store";
import { Container, stylesAtom } from "./style";
import { Hydration } from "./utils/hydration";
import { FavIcon } from "./components/FavIcon";
import { getRealm } from "./utils/realm";
import { clientFile } from "./const";
import { titleAtom, descriptionAtom, iconAtom } from "./state/meta";

const Context = ({ children }: PropsWithChildren) => {
  return <Provider store={store}>{children}</Provider>;
};

const SpaNormalizer = ({ children }: PropsWithChildren) => {
  if (getRealm() === "spa") {
    const [shouldRender, setShouldRender] = useState(false);
    useEffect(() => {
      setShouldRender(true);
    }, []);
    if (!shouldRender) return null;
  }
  return children;
};

const App = () => {
  const [styles] = useAtom(stylesAtom);
  useAtom(trackVisibleAtom);
  useAtom(subscriptionAtom);
  return (
    <Suspense fallback={null}>
      <Container>
        <NavigationSidebar />
        <Router />
        <Global styles={styles} />
      </Container>
    </Suspense>
  );
};

const Meta = () => {
  const [title] = useAtom(titleAtom);
  const [description] = useAtom(descriptionAtom);
  const [icon] = useAtom(iconAtom);
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <FavIcon>{icon}</FavIcon>
    </>
  );
};

export const Shell = ({
  bootstrap,
  additionalScripts,
  baseUrl,
}: {
  bootstrap?: true;
  additionalScripts?: string[];
  baseUrl?: string;
}) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Context>
          <Meta />
        </Context>
      </head>
      <body>
        <Context>
          <SpaNormalizer>
            <App />
          </SpaNormalizer>
        </Context>
        <Hydration />
        {additionalScripts?.map((script, index) => {
          return <script key={index} dangerouslySetInnerHTML={{ __html: script }} />;
        })}
        {bootstrap && <script type="module" src={`${baseUrl ?? ""}${clientFile}`} async />}
      </body>
    </html>
  );
};
