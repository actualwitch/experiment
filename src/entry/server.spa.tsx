import type { Serve } from "bun";
import { FIXTURES, isFixture } from "../fixtures";
import { assignToWindow, createHydrationScript } from "../utils/hydration";
import { getClientAsString } from "./_macro" with { type: "macro" };

function getHtml(base?: string) {
  return `<!DOCTYPE html>
<html lang="en">
<body>
  <script type="module" src="${base ? base : ""}"></script>
</body>`;
}

const clientFile = "/client.js";

export default {
  fetch: async req => {
    const url = new URL(req.url);
    console.log(req.url, req.headers);
    if (url.pathname === clientFile) {
      return new Response(await getClientAsString("src/entry/client.spa.tsx"), {
        headers: { "Content-Type": "application/javascript" },
      });
    }
    let html = getHtml(clientFile);
    const fixture = url.searchParams.get("fixture");
    if (isFixture(fixture)) {
      html = html.replace(
        "<body>",
        () => `<body><script>${createHydrationScript(FIXTURES[fixture])}${assignToWindow("REALM", `"TESTING"`)}</script>`,
      );
    } else {

      html = html.replace(
        "<body>",
        () => `<body><script>${assignToWindow("REALM", `"TESTING"`)}</script>`,
      );
    }
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  },
} satisfies Serve;
