# NOIR — Adult Video Discovery Demo

A React + TypeScript + Tailwind CSS portfolio project using the Eporner API v2 and the Pornhub Webmasters API (proxied through `/api/pornhub`).

## Features

- 18+ age confirmation screen (a basic UI gate, not legal age verification)
- Live API catalog, search, sorting and pagination
- Responsive video cards with thumbnails, duration, views and rating
- Third-party embed modal and source links
- Favorites persisted in `localStorage`
- Loading skeletons, empty states and API error handling
- Black & Orange angular interface (#070707, #FF6A00, #F2F2F2)
- English / Russian interface; the chosen language is stored in `localStorage` (`noir-lang-v1`)
- Settings page: language, theme (dark / light / system), thumbnail blur, tile images on/off, default sorting, clearing history / favorites / cached covers (`noir-settings-v1`)
- 60+ categories and 55+ actresses (Russian input like «блондинки» is mapped to the English search query)
- Categories tab, watch page with related videos, mobile drawer navigation and search suggestions

## Requirements

- Node.js 20.19+ or 22.12+ recommended
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build

```bash
npm run build
npm run preview
```

## API

The app calls the documented Eporner API v2 endpoint:

`https://www.eporner.com/api/v2/video/search/`

The API documentation demonstrates `query`, `per_page`, `page`, `thumbsize`, `order`, `gay`, `lq`, and `format` parameters. See [official documentation](https://www.eporner.com/api/v2/).

**Important:** a direct browser request may fail if the API changes its CORS policy or limits requests. If that happens, add a small server-side proxy (for example, a Vercel Function) and have the frontend call your own endpoint. Do not expose private API credentials in `VITE_*` variables.

## Content and compliance

This is an educational portfolio demo. Third-party content is controlled by its source provider. Check the provider's terms, content licensing, embed permissions, local law, and hosting provider policies before public deployment. The age confirmation screen is not a substitute for legal age verification. Do not redistribute downloaded media or bypass access controls.

## Suggested first commit

```bash
git add .
git commit -m "feat: build NOIR adult video discovery catalog"
```