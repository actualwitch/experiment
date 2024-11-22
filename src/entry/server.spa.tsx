import type { Serve } from "bun";
import { FIXTURES, isFixture } from "../fixtures";
import { assignToWindow, createHydrationScript } from "../utils/hydration";
import { getClientAsString } from "./_macro" with { type: "macro" };
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { Shell } from "../root";
import { clientFile, hostname, port } from "../const";

export function getHtml(path: string, additionalScripts: string[] = []) {
  return `<!DOCTYPE html>
<html lang="en">
<body>
  ${additionalScripts
    .filter(Boolean)
    .map((script) => `<script>${script}</script>`)
    .join("\n")}
  <script type="module" src="${path}"></script>
</body>`;
}

export default {
  development: true,
  hostname,
  port,
  fetch: async (req) => {
    const url = new URL(req.url);
    console.log(url.pathname, clientFile);
    if (url.pathname === clientFile) {
      return new Response(await getClientAsString(), {
        headers: { "Content-Type": "application/javascript" },
      });
    }
    const fixture = url.searchParams.get("fixture");
    const html = renderToString(
      <StaticRouter location={url.pathname}>
        <Shell
          bootstrap
          additionalScripts={
            isFixture(fixture) ?
              [createHydrationScript(FIXTURES[fixture]), assignToWindow("REALM", `"TESTING"`)]
            : [assignToWindow("REALM", `"SPA"`)]
          }
        />
      </StaticRouter>,
    );
    return new Response("<!DOCTYPE html>" + html, {
      headers: { "Content-Type": "text/html" },
    });
  },
} satisfies Serve;
