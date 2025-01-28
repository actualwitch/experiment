# Architecture

This project uses custom architecture I refer to as `entangled atoms` which extends [jōtai](https://jotai.org/) atoms to synchronize state across different [realms](https://262.ecma-international.org/#realm). This allows for end-to-end isomorphic state management where same primitives are used to manage state everywhere. 

# Platform

For this project, I decided to explore what modern frontend project can look like if you discard conventional approach and carefully craft the dependency tree decision by decision. Instead of using Next.js or Remix, I simply implemented streaming Server-Side Rendering (SSR) server and static HTML render. Instead of implementing api routes to exchange information, I used `entangled atoms` which use Server-Sent Events (SSE) to sync state behind the scenes.

The choice of TypeScript seems natural for an isomorphic crosplatform app, and I picked [Bun](https://bun.sh/) as a runtime and bundler. Not using Babel presents challenges for dependencies that require Babel plugins to work properly, however this is not an unsolvable problem.

# Jōtai

In my experience, projects making use of dedicated state management libraries invariably also use hooks given enough time and scope. Impedance mismatch between these two forms may end up inflicting significant story point damage on the project in the long term. Jōtai solves this by offering a drop-in replacement for `useState`, giving you freedom to switch between them depending on your needs.

# Emotion

This is an area where I have particularly strong opinions on: seeing codebases using utility frameworks like Tailwind makes my eyes bleed, and implementing a separate templating/DSL to generate CSS out of it seems wasteful and backwards. In Experiment, I went with my go-to choice of [Emotion](https://emotion.sh) which is a JSS framework like Styled-Components. It allows incredible flexibility in defining styles programmatically and handles SSR with ease.

# React

Is ethically compromised and best avoided. I architected Experiment to allow for easy switching off it, and plan to transition the codebase to Preact/Solid in near future.

# Principles

1. **Less is more.** Going just 20% of the path is fine if it gets the job done.
2. **Agile and Lean.** Optimize for flexibility and reduce waste.
3. **Isomorphic.** Run exact same code wherever possible.
4. **Low level.** Skip unnecessary abstractions and acknowledge the underlying platform.
5. **Visually consistent.** System fonts and server side rendering for instant loading and no flickering.
6. **Bleeding edge.** To prevent stale dependency hell, dev mode always upgrades dependencies to the latest version.
