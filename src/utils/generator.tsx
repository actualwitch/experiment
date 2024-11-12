export function* SampleComponent() {
  yield <div>Check this out!</div>;
  yield <div>A generator component!</div>;
}

export function createGeneratorComponent<
  P extends { children: string },
  G extends (props: P) => Generator<JSX.Element | null, void, unknown>,
>(generator: G) {
  return function GeneratorComponent(props: P) {
    const values = [...generator(props)].map((value, index) => ({
      ...value,
      key: index,
    }));

    return <>{values}</>;
  };
}

export const SampleGeneratorComponent = createGeneratorComponent(SampleComponent);
