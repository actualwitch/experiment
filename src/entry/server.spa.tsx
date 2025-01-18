import type { Serve } from "bun";
import { clientFile, hostname, port } from "../const";
import { FIXTURES, isFixture } from "./_fixtures";
import { assignToWindow, createHydrationScript } from "../utils/hydration";
import { getStaticHtml } from "./_handlers";
import { setRealm } from "../utils/realm";
import { store } from "../store";
import { clientScriptAtom } from "../atoms/server";

export default {
  development: true,
  hostname,
  port,
  fetch: async (req) => {
    const url = new URL(req.url);
    console.log(url.pathname, clientFile);
    if (url.pathname === clientFile) {
      const clientScript = await store.get(clientScriptAtom);
      return clientScript.match({
        Just: (script) => new Response(script, { headers: { "Content-Type": "application/javascript" } }),
        Nothing: () => new Response("KO", { status: 500 }),
      });
    }
    const fixture = url.searchParams.get("fixture");
    setRealm(isFixture(fixture) ? "testing" : "spa");
    const html = await getStaticHtml(
      url.pathname,
      isFixture(fixture) ?
        [createHydrationScript(FIXTURES[fixture]), assignToWindow("REALM", `"TESTING"`)]
      : [assignToWindow("REALM", `"SPA"`)],
    )
    return new Response(
      html,
      {
        headers: { "Content-Type": "text/html" },
      },
    );
  },
} satisfies Serve;
