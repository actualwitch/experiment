import { $ } from "bun";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { Shell } from "../src/root";
import { assignToWindow } from "../src/utils/hydration";

// why does this work but running it from Bun.build fails? #justbunthings
await $`bun build ./src/entry/client.tsx --outdir ./spa`;
// const buildResult = await Bun.build({
//   entrypoints: ["./src/entry/client.tsx"],
//   outdir: "./spa",
// });
// if (!buildResult.success) {
//   throw new AggregateError(buildResult.logs, "Build failed");
// }

await Bun.write(
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
