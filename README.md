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

**Experiment** is a feature-rich chat interface for Large Language Models (LLMs) like Anthropic, OpenAI, and Mistral. It offers advanced debugging tools for prompt engineering and tool integration, allowing developers to visualize and manage tool interactions seamlessly.

## Features

- Supports completion requests via Anthropic, OpenAI, and Mistral APIs.
- Advanced tool use debugging with JSON schema visualization.
- Import and explore previous completions from CSV files.
- Universal app: runs in both browser and as a self-contained binary.
- Full featured mobile version, installable as Progressive Web App (PWA).
- Free as in MIT: all code is open source and permissively licensed.
- Perfect for OLED: dark mode uses pure black for energy efficiency.
- No telemetry or tracking.
- Your data is yours: completions are saved to LocalStorage/File system.
- Securely store your tokens in 1Password (Binary version only).

<a href="docs/tool-debugging.md">Read more about tool debugging →</a>

## Architecture

This project uses a custom React-based solution with full SSR and minimal dependencies.

<a href="docs/architecture.md">Read more about architecture →</a>

## Installation

Experiment is an universal/isomorphic app that runs in browser or as a self-contained binary that requires no dependencies. All variants are functionally equivalent with the exception of 1Password support which is only available in the binary edition. State is stored in LocalStorage/Filesystem respectively.

<a href="https://github.com/actualwitch/experiment/releases/latest">Download the latest release →</a>

<hr>

Banner by <a href="https://unsplash.com/@jessbaileydesigns?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Jess Bailey</a> on <a href="https://unsplash.com/photos/pen-near-black-lined-paper-and-eyeglasses-q10VITrVYUM?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>