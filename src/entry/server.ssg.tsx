import type { Serve } from "bun";
import { clientCss, clientFile, hostname, port } from "../const";
import { FIXTURES, isFixture } from "./_fixtures";
import { assignToWindow, createHydrationScript } from "../utils/hydration";
import { getStaticHtml } from "./_handlers";
import { setRealm } from "../utils/realm";
import { getClientAsString } from "./_macro" with { type: "macro" };

export default {
  development: true,
  hostname,
  port,
  fetch: async (req) => {
    const url = new URL(req.url);
    console.log(url.pathname, clientFile);
    const [clientFileContent, css, ...others] = await getClientAsString();
    if (url.pathname === clientFile) {
      return new Response(clientFileContent.text, { headers: { "Content-Type": "application/javascript" } });
    }
    if (url.pathname === clientCss) {
      return new Response(css.text, { headers: { "Content-Type": "text/css" } });
    }
    const fixture = url.searchParams.get("fixture");
    setRealm(isFixture(fixture) ? "testing" : "ssg");
    const html = await getStaticHtml(
      url.pathname,
      isFixture(fixture)
        ? [createHydrationScript(FIXTURES[fixture]), assignToWindow("REALM", `"TESTING"`)]
        : [assignToWindow("REALM", `"SSG"`)],
    );
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  },
} satisfies Serve;
