import { atom } from "jotai";
import { Result } from "true-myth";

import { author, newLine } from "../const";
import { getStoragePath, resolve, spawn } from "../utils";
import { getRealm } from "../utils/realm";

export const hasOpensslAtom = atom(async () => {
  const result = await spawn("which", ["openssl"]);
  return result.isOk && result.value !== "";
});

export const localCertAndKeyAtom = atom(async () => {
  if (getRealm() !== "server") return Result.err(new Error("Cannot generate certificates in the browser"));
  const fs = await resolve("fs/promises");
  if (fs.isErr) {
    return Result.err(new Error("Cannot generate certificates in the browser"));
  }
  const exists = fs.value.exists;
  const writeFile = fs.value.writeFile;
  const opensslBinary = await spawn("which", ["openssl"]);
  if (opensslBinary.isErr) {
    return Result.err(new Error("OpenSSL is not installed"));
  }
  const hasKey = await exists(`${getStoragePath()}/cert.key`);
  if (!hasKey) {
    const result = await spawn(opensslBinary.value, ["genrsa", "4096"]);
    if (result.isErr) {
      return Result.err(new Error("Failed to generate private key"));
    }
    await writeFile(`${getStoragePath()}/cert.key`, result.value + newLine);
  }
  const hasCert = await exists(`${getStoragePath()}/key.cert`);
  if (!hasCert) {
    const result = await spawn(opensslBinary.value, [
      "req",
      "-new",
      "-x509",
      "-noenc",
      "-sha256",
      "-days",
      "365",
      "-key",
      `${getStoragePath()}/cert.key`,
      "-out",
      `${getStoragePath()}/key.cert`,
      "-subj",
      `/C=NL/ST=Noord-Holland/L=Amsterdam/O=${author}/CN=actualwitch.me/emailAddress=noreply@actualwitch.me`,
    ]);
    if (result.isErr) {
      return Result.err(new Error("Failed to generate certificate"));
    }
  }
  return Result.ok({ key: `${getStoragePath()}/cert.key`, cert: `${getStoragePath()}/key.cert` });
});
