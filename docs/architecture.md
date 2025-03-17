# Architecture

Experiment uses a custom architecture called "entangled atoms" which extends [jōtai](https://jotai.org/) atoms to synchronize state across different JavaScript [realms](https://262.ecma-international.org/#realm). This enables end-to-end isomorphic state management where the same primitives are used to manage state everywhere.

# Platform

Experiment takes a minimalist approach to modern frontend development, carefully crafting the dependency tree decision by decision rather than using conventional frameworks. Instead of Next.js or Remix, it implements a custom streaming Server-Side Rendering (SSR) server with Static Site Generation (SSG) capability. Rather than implementing API routes for data exchange, it uses "entangled atoms" with Server-Sent Events (SSE) to synchronize state behind the scenes.

TypeScript provides type safety for this isomorphic cross-platform application, with [Bun](https://bun.sh/) serving as both runtime and bundler. This approach avoids Babel, which presents challenges for dependencies requiring Babel plugins, but these challenges are not insurmountable.

## State Management with Jōtai

Projects using dedicated state management libraries often end up incorporating React hooks as they grow in scope, creating an impedance mismatch between these two forms of state management. Jōtai solves this by offering a drop-in replacement for `useState` that allows seamless switching between local and global state depending on your needs.

## Styling with Emotion

Experiment uses [Emotion](https://emotion.sh) for styling, a JSS framework similar to Styled-Components. This approach allows for programmatic style definition with excellent flexibility and SSR support, avoiding the limitations of utility frameworks like Tailwind or separate templating/DSL approaches.

## Framework Considerations

The codebase is currently built with React but has been architected to allow for easy migration to alternatives like Preact or Solid in the future.

# Principles

1. **Less is more.** Going just 20% of the path is fine if it gets the job done.
2. **Agile and Lean.** Optimize for flexibility and reduce waste.
3. **Isomorphic.** Run exact same code wherever possible.
4. **Low level.** Skip unnecessary abstractions and acknowledge the underlying platform.
5. **Visually consistent.** System fonts and server side rendering for instant loading and no flickering.
6. **Bleeding edge.** To prevent stale dependency hell, dev mode always upgrades dependencies to the latest version.
7. **Privacy-focused.** No telemetry, tracking, or data collection.
