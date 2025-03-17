<a href="https://actualwitch.github.io/experiment/">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/screenshots/browser-dark.png">
    <img alt="Experiment screenshot" src=".github/screenshots/browser-light.png">
  </picture>
</a>

<p align="center">
  <a href="https://actualwitch.github.io/experiment/">
    Web
  </a>
  ▴
  <a href="https://github.com/actualwitch/experiment/releases/latest">
    Mac
  </a>
  ▴
  <a href="https://github.com/actualwitch/experiment/releases/latest">
    Linux
  </a>
  ▴
  <a href="https://github.com/actualwitch/experiment/releases/latest">
    Windows
  </a>
</p>

# 🔬 Let's start the <ins>Experiment</ins>

[![Tests](https://github.com/actualwitch/experiment/actions/workflows/test.yml/badge.svg)](https://github.com/actualwitch/experiment/actions/workflows/test.yml)

**Experiment** is a professional-grade chat interface for Large Language Models (LLMs) designed for developers, prompt engineers, and AI researchers. It provides a streamlined environment for working with Anthropic, OpenAI, and Mistral models, with powerful debugging tools for prompt engineering and tool integration.

## Features

- 💬 **Multi-Provider Support**: Connect to Anthropic, OpenAI, and Mistral APIs with a unified interface
- 🧰 **Advanced Tool Debugging**: Visualize and manage tool interactions with JSON schema visualization
- 🔍 **Prompt Engineering**: Easily create, test, and iterate on prompts with real-time feedback
- 📊 **Import CSV**: Analyze previous completions from CSV files
- 🌐 **Universal Platform**: Available as both a web app and self-contained desktop application
- 📱 **Mobile Optimized**: Full-featured mobile version with Progressive Web App (PWA) support
- 🔐 **Secure by Design**: Store API tokens securely with optional 1Password integration (binary edition)
- 🖥️ **OLED-Friendly**: Dark mode uses true black for energy efficiency on OLED displays
- 🔒 **Free as in MIT**: All code is open source and permissively licensed
- 🔒 **Privacy First**: Your data stays local with no telemetry or tracking

## Getting Started

Experiment is available in binary and non-binary editions. Binary edition requires no dependencies and includes additional features like 1Password integration for secure token storage.

### Non-binary edition (Web/SPA)

Try the web version instantly at [actualwitch.github.io/experiment](https://actualwitch.github.io/experiment/)

### Binary edition

Download the latest release for your platform:

- [macOS](https://github.com/actualwitch/experiment/releases/latest)
- [Windows](https://github.com/actualwitch/experiment/releases/latest)
- [Linux](https://github.com/actualwitch/experiment/releases/latest)

> [!NOTE]
> macOS and Linux users need to make the downloaded file executable:
> ```shell
> chmod +x ./experiment-*
> ```
> macOS users also need to remove quarantine:
> ```shell
> xattr -d com.apple.quarantine ./experiment-*
> ```

## Tool Debugging

Experiment provides comprehensive visualization for LLM tool use. Add tools by pasting a JSON schema into chat in OpenAI and Anthropic formats. The schema will be visualized with properties sorted by name and depth for easy navigation. Click on property names to collapse sections.

<a href="docs/tool-debugging.md">Read more about tool debugging →</a>

## Architecture

Experiment uses a custom architecture called "entangled atoms" which extends [jōtai](https://jotai.org/) to synchronize state across different JavaScript realms. This enables seamless state management between server and client.

<a href="docs/architecture.md">Read more about the architecture →</a>

## Development

```shell
# Start development server
bun dev

# Build binary edition
bun run build:bin

# Build static site
bun run build:spa

<hr>

Banner by <a href="https://unsplash.com/@jessbaileydesigns?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Jess Bailey</a> on <a href="https://unsplash.com/photos/pen-near-black-lined-paper-and-eyeglasses-q10VITrVYUM?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>