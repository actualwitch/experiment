import { json } from "@remix-run/node";

export function loader() {
  return json({ it: "works" });
}

export function action() {
  return json({ it: "works" });
}
