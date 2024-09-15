export function Debugger({ children }: { children: unknown }) {
  return <code>{JSON.stringify(children, null, 2)}</code>;
}
