import type { Serve } from "bun";
import { clientFile, hostname, port } from "../const";
import { FIXTURES, isFixture } from "./_fixtures";
import { assignToWindow, createHydrationScript } from "../utils/hydration";
import { getHtml } from "./_handlers";
import { getClientAsString } from "./_macro" with { type: "macro" };
import { setRealm } from "../utils/realm";

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
    setRealm(isFixture(fixture) ? "testing" : "spa");
    return new Response(
      getHtml(
        url.pathname,
        isFixture(fixture) ?
          [createHydrationScript(FIXTURES[fixture]), assignToWindow("REALM", `"TESTING"`)]
        : [assignToWindow("REALM", `"SPA"`)],
      ),
      {
        headers: { "Content-Type": "text/html" },
      },
    );
  },
} satisfies Serve;
