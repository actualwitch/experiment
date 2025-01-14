import { $ } from "bun";
import { store } from "../src/store";
import { localCertAndKeyAtom } from "../src/atoms/common";
import { isMac } from "../src/utils/platform";
import { hostname, port } from "../src/const";

const certAndKey = await store.get(localCertAndKeyAtom);

if (Bun.env.OPEN_ON_START && isMac()) {
  const url = `${certAndKey.match({
    Ok: () => "https",
    Err: () => "http",
  })}://${hostname}:${port}`;
  await $`open "${url}"`.quiet();
}
await $`bun --watch run src/entry/server.tsx`;