# Architecture

<ins>**Experiment**</ins> is an exploration of how next-generation web app architecture could look like, guided by best practices *borrowed*[^1] from the worlds of academic and functional programming.

**JavaScript** is a *functional* language at its core:
* Functions are first-class citizens
* Promises are basically monads
* Workers are basically actors
* There's a group of "[fantasy land](https://github.com/fantasyland/fantasy-land)" themed libraries filling the gaps in api

And that is why unlike many people on the internet, I am not ashamed to say I am... okay with it! It's quite alright. Admittedly, since it was initially designed by some rather... brave people, it has some fundamental flaws, but after multiple generations of improvements and coupled with a powerful type system of **TypeScript**, it makes for a pretty appealing platform: it is truly isomorphic with exact same code running on server and client, it has an extensive community, and is quite flexible in its strictness. <ins>**Experiment**</ins> makes use of [`ts-pattern`](https://github.com/gvergnaud/ts-pattern) for *pattern matching*, and [`true-myth`](https://github.com/true-myth/true-myth) for *monadic error handling*. 

**React**—at its core—is just a [state machine](https://en.wikipedia.org/wiki/Finite-state_machine), and using them is widely regarded[^2] as a great way to reduce logic errors throughout the app. [`jōtai`](https://jotai.org/) is a functional programming inspired, signals-based state management library that I extend with a new primitive—*entangled atoms*—themselves inspired by [`GenServer`](https://www.erlang.org/doc/system/gen_server_concepts.html) actors. *Entangled atoms* allow to effortlessly sync state across different JavaScript [realms](https://262.ecma-international.org/#realm). 

For code organization, <ins>**Experiment**</ins> follows principles of [Feature-Driven](https://en.wikipedia.org/wiki/Feature-driven_development) and [Append only](https://www.youtube.com/watch?v=cXuvCMG21Ss) development. The latter mostly refers to the way of code organization, but I find the code part of the presentation coincidentally looks a lot like [`Redux`](https://redux-toolkit.js.org/) + [`Saga`](https://github.com/agiledigital/typed-redux-saga) stack, which IMO is probably the most scalable and productive architecture for more enterprise-grade web-only projects.

This architecture draws on my extensive experience building web apps targeting a variety of platforms—and it allows unmatched agility, flexibility and velocity in building and maintaining sophisticated software-defined experiences spanning across realms.

# Platform

<ins>**Experiment**</ins> takes a minimalist approach to modern frontend development, carefully crafting the dependency tree decision by decision rather than using conventional frameworks. Instead of Next.js or Remix, it implements a custom streaming Server-Side Rendering (SSR) server with Static Site Generation (SSG) capability. Rather than implementing API routes for data exchange, it uses *entangled atoms* with Server-Sent Events (SSE) to synchronize state behind the scenes.

TypeScript provides type safety for this isomorphic cross-platform application, with [Bun](https://bun.sh/) serving as both runtime and bundler. This approach avoids Babel, which presents challenges for dependencies requiring Babel plugins, but these challenges are not insurmountable.

## State Management with Jōtai

Projects using dedicated state management libraries often end up incorporating React hooks as they grow in scope, creating an impedance mismatch between these two forms of state management. Jōtai solves this by offering a drop-in replacement for `useState` that allows seamless switching between local and global state depending on your needs.

## Styling with Emotion

<ins>**Experiment**</ins> uses [Emotion](https://emotion.sh) for styling, a JSS framework similar to Styled-Components. This approach allows for programmatic style definition with excellent flexibility and SSR support, avoiding the limitations of utility frameworks like Tailwind or separate templating/DSL approaches.

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

[^1]: he-he
[^2]: https://shopify.engineering/17488160-why-developers-should-be-force-fed-state-machines