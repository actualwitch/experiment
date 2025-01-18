import { expect, it, test } from "bun:test";
import { getStaticHtml } from "./_handlers";

test("ssr", () => {
  it("should render static html", async () => {
    const html = await getStaticHtml("/");
    expect(html).toMatchSnapshot();
  }
  )
});
