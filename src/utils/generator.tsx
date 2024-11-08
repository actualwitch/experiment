export function* SampleComponent() {
  yield <div>Check this out!</div>;
  yield <div>A generator component!</div>;
}

export const createGeneratorComponent = (generator: () => Generator<JSX.Element, void, unknown>) => {
  return function GeneratorComponent() {
    const values = [...generator()].map((value, index) => ({ ...value, key: index }));

    return <>{values}</>;
  };
};

export const SampleGeneratorComponent = createGeneratorComponent(SampleComponent);
