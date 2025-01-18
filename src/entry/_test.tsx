import { describe, expect, it } from "bun:test";
import { getStaticHtml } from "./_handlers";

describe("ssr", () => {
  it("should render static html", async () => {
    const html = await getStaticHtml("/");
    expect(html).toMatchSnapshot();
  });
});
