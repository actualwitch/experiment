![Experiment screenshot](https://raw.githubusercontent.com/actualwitch/experiment/main/.github/Screenshot.png)

## Let's start the experiment

**Experiment** is a simple tool to facilitate prompt engineering. You can use it to make chat completion requests, debug function calling and explore completions saved as CSV.

### Development

This project uses custom architecture I refer to as "entangled atoms" which extends `jotai` atoms to synchronize their state across different [realms](https://262.ecma-international.org/#realm). As a result, this allows me to achieve end-to-end isomorphic state management where even server manages state using same frontend primitives. Unconventional nature of this approach led me to design my own boilerplate heavily reliant on [Bun](https://bun.sh/) so you will need it installed to develop Experiment. Boilerplate includes full streaming Server-Side Rendering(SSR) with transparent bundling, hydration and Server-Sent Events(SSE) for state sync.

Shall you want to run this repo locally, you can do so by running bootstrap script from your favorite shell, or Bun directly:

```sh
bun ./bootstrap.sh
```