export function Debugger({ children }: { children: unknown }) {
  return <pre>{JSON.stringify(children, null, 2)}</pre>;
}
