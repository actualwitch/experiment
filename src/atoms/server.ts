import { atom } from "jotai";
import { getRealm } from "../utils/realm";
import { nopeAtom } from "./common";
import { entangledAtom } from "../utils/entanglement";

export const pwdAtom = entangledAtom("pwd", getRealm() === "server" ? atom(Bun.env.PWD) : nopeAtom);
