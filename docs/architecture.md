# Architecture

This project uses custom architecture I refer to as `entangled atoms` which extends [jōtai](https://jotai.org/) atoms to synchronize state across different [realms](https://262.ecma-international.org/#realm). This allows for end-to-end isomorphic state management where same primitives are used to manage state everywhere. Unconventional nature of this approach led me to design my own boilerplate; after trying out different runtimes I decided to make use of [Bun](https://bun.sh/) which is very fast and offers neat features like macros and programmatically accessible bundler.

There is no Next.js, Remix, Vite, Webpack or Babel here; my aim is simplicity and minimalism in terms of requirements and general architecture. Currently, boilerplate implements full streaming Server-Side Rendering(SSR) with transparent bundling, hydration and Server-Sent Events(SSE) for state sync.

There are some disadvatages to this approach. For example, `emotion` uses babel transform to allow referencing other components in styles, which is not possible until I rewrite it as Bun bundler plugin. Assets like images/css are also not implemented yet which breaks `monaco`.