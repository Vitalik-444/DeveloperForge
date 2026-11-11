# DeveloperForge

A local-first collection of essential developer utilities built with React, TypeScript, Vite, Tailwind CSS, React Router, Lucide React, Prettier, Marked, and DOMPurify.

## Features

- JSON formatter, minifier, and validator
- JSON to TypeScript interface generator
- UTF-8-safe Base64 encoder/decoder
- URL component encoder/decoder
- JWT header/payload decoder (does not verify signatures)
- UUID v4 generator
- SHA-1 / SHA-256 / SHA-384 / SHA-512 hash generator
- Regular-expression tester with flags and match positions
- HTML and CSS formatter/minifier
- JavaScript formatter powered by Prettier
- Sanitized Markdown preview
- HTML entity encoder/decoder
- HEX / RGB / RGBA / HSL / HSLA color converter
- Unix timestamp and date converter
- Global search, favorites, recent tools, responsive sidebar, light/dark theme

## Getting started

Requirements: Node.js 20+ recommended.

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Privacy

Tools run locally in the browser. No backend, account, or paid API is used. Theme, favorites, and recent tool identifiers are stored in localStorage; tool input is not persisted. Markdown output is sanitized before rendering. User-provided JavaScript and HTML are never executed.

## Notes

- JWT decoding is not signature verification or authentication.
- Hashing is not encryption; SHA-1 is offered for compatibility only.
- Regex execution includes basic safeguards, but avoid testing complex expressions from untrusted sources.
