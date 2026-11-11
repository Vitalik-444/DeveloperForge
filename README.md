# DeveloperForge

**Your toolkit for everyday development.** DeveloperForge is a collection of 15 practical developer utilities that run entirely in the browser: no backend, no accounts, and no data sent to a server.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)
![Local-first](https://img.shields.io/badge/privacy-local--first-10b981)

## Table of Contents

- [Features](#features)
- [Tools](#tools)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Privacy and Security](#privacy-and-security)
- [Adding a New Tool](#adding-a-new-tool)
- [Limitations](#limitations)

## Features

- 15 tools in six categories with a consistent interface
- Global search by name, description, and keywords
- Favorites and a list of recently opened tools
- Light and dark themes
- Responsive layout with a collapsible sidebar
- Load an example, copy the result, download it as a file, or reuse the output as new input
- Keyboard shortcuts for running, copying, and searching
- Prettier is loaded on demand, which keeps the initial load fast

## Tools

| Category | Tool | Description |
| --- | --- | --- |
| JSON Tools | JSON Formatter & Validator | Format, minify, and validate JSON |
| JSON Tools | JSON to TypeScript | Generate TypeScript interfaces from JSON |
| Code Tools | Regex Tester | Test patterns with flags, matches, and positions |
| Code Tools | HTML Formatter | Format or minify HTML |
| Code Tools | CSS Formatter & Minifier | Format or minify CSS |
| Code Tools | JavaScript Formatter | Format JavaScript with Prettier |
| Encoders & Decoders | Base64 Encoder & Decoder | Encode and decode Base64 with UTF-8 and base64url support |
| Encoders & Decoders | URL Encoder & Decoder | Encode and decode URL components |
| Encoders & Decoders | JWT Decoder | Inspect token header and payload, with expiration status |
| Encoders & Decoders | HTML Entity Encoder & Decoder | Escape and unescape HTML entities |
| Generators | UUID Generator | Generate UUID v4 values, up to 1,000 at a time |
| Generators | Hash Generator | SHA-1, SHA-256, SHA-384, and SHA-512 via Web Crypto |
| Text Utilities | Markdown Preview | Live preview with sanitization |
| Web Utilities | Color Converter | HEX, RGB, RGBA, HSL, and HSLA, accepted as input and output |
| Web Utilities | Timestamp Converter | Unix time in seconds and milliseconds, and date to timestamp |

## Tech Stack

| Purpose | Technology |
| --- | --- |
| UI | React 18 |
| Language | TypeScript 5.7 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 4 and custom CSS |
| Routing | React Router 6 |
| Icons | Lucide React |
| Code formatting | Prettier 3 |
| Markdown | Marked 15 |
| HTML sanitization | DOMPurify 3 |

## Getting Started

Node.js 20 or newer is required.

```bash
npm install
npm run dev
```

The app will be available at the address printed by Vite, usually `http://localhost:5173`.

Production build:

```bash
npm run build
npm run preview
```

## Scripts

| Command | Action |
| --- | --- |
| `npm run dev` | Starts the development server with hot module replacement |
| `npm run build` | Type-checks (`tsc -b`) and builds the project into `dist/` |
| `npm run preview` | Serves the production build locally |

## Project Structure

```text
DeveloperForge/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── data.ts
    └── index.css
```

| File | Purpose |
| --- | --- |
| `src/main.tsx` | Entry point: mounts the app and `BrowserRouter` |
| `src/App.tsx` | Layout, routes, pages, and the logic of every tool |
| `src/data.ts` | Tool registry and category list |
| `src/index.css` | Design system, themes, and responsive styles |

### Routes

| Path | Page |
| --- | --- |
| `/` | Home: popular, recent, and favorite tools |
| `/tools` | Catalog of all tools grouped by category |
| `/tools/:toolId` | A specific tool |
| `/favorites` | Favorite tools |
| `/about` | About the project |

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl` / `⌘` + `Enter` | Run the current tool |
| `Ctrl` / `⌘` + `Shift` + `C` | Copy the output |
| `Ctrl` / `⌘` + `K` | Focus global search |
| `Esc` | Clear the search query |
| `Enter` in search | Open the first matching tool |

## Privacy and Security

- Every tool runs locally in the browser. No backend, accounts, or paid APIs are used.
- `localStorage` holds only the theme (`df-theme`), favorites (`df-favorites`), and recent tool identifiers (`df-recent`). Tool input is never persisted.
- Markdown output is sanitized with DOMPurify before rendering.
- User-provided JavaScript and HTML are never executed.
- The regex tester limits pattern length and applies a heuristic check against catastrophic backtracking.

## Adding a New Tool

1. Add an entry to the `tools` array in `src/data.ts`: `id`, `name`, `category`, `description`, `keywords`, `icon`, and optionally `popular`.
2. Add a sample input to the `samples` object in `src/App.tsx`.
3. Implement the logic in the `transform` function or, for tools with a custom interface, in the `ToolView` component.
4. If a new category is needed, add it to the `categories` array in `src/data.ts`.

## Limitations

- JWT decoding is not signature verification and does not authenticate a token.
- Hashing is not encryption. SHA-1 is offered for compatibility only.
- JavaScript minification is not supported, only formatting.
- `crypto.subtle` and `crypto.randomUUID` require a secure context: HTTPS or `localhost`. UUID generation has a fallback; hashing does not.
- Very complex regular expressions, especially from untrusted sources, can still be expensive to run.
