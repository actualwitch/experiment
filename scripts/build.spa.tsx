import { $ } from "bun";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router/server";
import { Shell } from "../src/root";
import { assignToWindow } from "../src/utils/hydration";

await $`bun build ./src/entry/client.tsx --outdir ./spa`;

Bun.write(
  "./spa/index.html",
  renderToString(
    <StaticRouter location={`${process.env.BASE_URL ?? ""}/`} basename={process.env.BASE_URL}>
      <Shell
        bootstrap
        baseUrl={process.env.BASE_URL}
        additionalScripts={[
          assignToWindow("REALM", `"SPA"`),
          process.env.BASE_URL && assignToWindow("BASE_URL", `"${process.env.BASE_URL}"`),
        ]}
      />
    </StaticRouter>,
  ),
);
