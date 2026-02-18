# Weather PWA – AI Agent Reference Outline

## 1. Project Purpose and Vision

- **Objective:** Build a modern, professional, extensible Progressive Web App (PWA) for weather information, leveraging multiple high-quality data sources.
- **Hosting:** Static frontend on **Cloudflare Pages**; API aggregation and proxying on **Cloudflare Workers**.
- **Design Philosophy:** Modular, scalable, maintainable, and secure. All code must follow industry best practices, be clearly commented, and be production-ready.

---

## 2. Technology Stack

| Layer            | Technology         | Notes                                      |
|------------------|--------------------|---------------------------------------------|
| Frontend         | **React**          | Component-based SPA with PWA capabilities   |
| Mapping          | **Leaflet**        | Interactive radar, satellite, hurricane maps |
| State Management | **Zustand**        | Lightweight global state across components   |
| Language         | **TypeScript**     | Strict mode, all frontend and worker code    |
| Hosting          | **Cloudflare Pages** | Static frontend assets                     |
| API Layer        | **Cloudflare Workers** | All outbound API calls, caching, secrets  |

---

## 3. Data Sources

> Full endpoint details will live in a separate **API_ENDPOINTS_REFERENCE.md** file.

- **Local Forecasts:**
  - Environment Canada
  - The Weather Network
  - Architecture must be pluggable — adding a new forecast provider should require only a new adapter module and registration, not changes to core logic.

- **Radar and Satellite Imagery:**
  - Multiple sources (TBD)
  - Support for both Canadian and international feeds

- **Hurricane Data:**
  - Dedicated section for tropical storm and hurricane tracking
  - Trusted providers (e.g., NOAA/NHC, Environment Canada, regional equivalents)

- **Forecast Models:**
  - Short-range models (e.g., NAM, HRDPS, RDPS)
  - Long-range models (e.g., GFS, ECMWF, GDPS)

---

## 4. Architecture

### Frontend (Cloudflare Pages)

- **React** single-page application with component-based architecture
- **Leaflet** for all map-based features (radar, satellite, hurricane tracking, model visualization)
- **Zustand** stores for global state (selected location, active layers, user preferences, fetched data)
- Service Worker for offline support, caching, and PWA install prompt
- Accessibility (WCAG 2.1 AA minimum) and internationalization-ready from day one
- Theming support (light/dark at minimum)
- **Responsive design:** The PWA should fit mobile and desktop and look great on both.

### Workers (Cloudflare Workers)

- **All** outbound API calls are made from Workers — the frontend never calls third-party APIs directly
- Normalize response data into consistent internal formats before returning to the frontend
- Cache aggressively where data freshness allows (use Cloudflare Cache API and/or KV)
- Rate-limit and throttle external API usage to stay within provider limits
- Centralized error handling: every Worker response must use a unified error envelope
- API keys and secrets managed via Cloudflare Secrets — never exposed in frontend bundles or build logs

---

## 5. Key Features

| Feature | Description |
|---|---|
| **Home Dashboard** | Current conditions (location-aware, no PII stored server-side), quick-glance forecast (multi-source aggregated), severe weather alerts |
| **Forecasts** | Hourly, daily (3–7 day), long-range/seasonal outlooks. User can select source or view a blended display |
| **Radar & Satellite** | Leaflet-powered interactive map layers, looping animations, resolution toggles, regional and national views |
| **Future Radar** | Experimental feature: forecast radar imagery using HRRR model reflectivity from NOAA AWS Open Data |
| **Hurricane Center** | Active storm map, bulletins, forecast tracks and cones, historical storm archive |
| **Weather Models** | Side-by-side model run comparison, user-selectable models and parameters |
| **Favorites** | Save locations to client-side storage via Zustand persisted store. Optional per-location notification settings |
| **Dark Sky Forecast** | Dedicated section for forecasting dark skies (astronomy, stargazing, aurora) using 7timer.info and other sources |

---

## 6. Code Style and File Conventions

These rules are **mandatory** for all AI agents and contributors:

### Separation of Concerns
- **UI components** handle rendering and user interaction only.
- **Services** handle API communication and data fetching only.
- **Zustand stores** manage application state only — no API calls or rendering logic inside stores.
- **Utilities** are pure, side-effect-free helper functions.
- **Types** are defined in dedicated type files — do not inline complex types.
- A single file must express a **single responsibility**. If a file is doing two distinct things, split it.

### File Length
- Keep individual files as **short as practical** without sacrificing clarity or completeness.
- Short, focused files are easier for AI agents to ingest, understand, and modify accurately.
- When a file grows beyond ~150–200 lines, evaluate whether it should be split.
- Prefer many small, well-named files over fewer large ones.

### Naming and Exports
- Use clear, descriptive file and directory names that reflect content (e.g., `useGeolocation.ts`, `radarLayerUtils.ts`).
- Use **barrel files** (`index.ts`) at directory level to provide clean public APIs for each module.
- Barrel files must only re-export — no logic.

### Comments and Documentation
- Every exported function, type, and component must have a JSDoc/TSDoc comment describing its purpose.
- Non-obvious logic must include inline comments explaining *why*, not just *what*.
- Do not over-comment self-evident code.

### TypeScript
- Use TypeScript for **all** frontend and Worker code.
- Enable `strict` mode in `tsconfig.json`.
- Define strong types for all API responses, internal data models, and component props.
- Avoid `any`; use `unknown` with type guards when the type is genuinely uncertain.

---

## 7. Directory Structure

```
/
├── /frontend
│   ├── /components       # Reusable React UI components (one component per file)
│   ├── /pages            # Top-level route/page components
│   ├── /services         # API client modules (one per data domain)
│   ├── /hooks            # Custom React hooks
│   ├── /store            # Zustand store slices (one per domain/feature)
│   ├── /types            # Shared TypeScript type definitions
│   ├── /utils            # Pure helper/utility functions
│   ├── /assets           # Static images, icons, fonts
│   ├── /styles           # Global and shared styles/themes
│   └── /map              # Leaflet map setup, layer definitions, map utilities
│
├── /workers
│   ├── /endpoints        # One module per provider or data domain
│   ├── /middleware        # Shared concerns (CORS, auth, error handling)
│   ├── /utils            # Worker-specific helpers (caching, rate limiting, logging)
│   ├── /types            # Worker-specific type definitions
│   └── index.ts          # Main entry: request router
│
├── AI_AGENT_REFERENCE.md
├── API_ENDPOINTS_REFERENCE.md   # (to be created)
└── README.md
```

---

## 8. Testing and CI/CD

- **Unit tests** for all services, utilities, Zustand stores, and hooks
- **Component tests** for React UI components (React Testing Library)
- **Integration tests** for Worker endpoints
- **End-to-end tests** for critical user flows
- CI/CD via **GitHub Actions** deploying to Cloudflare Pages and Workers
- All PRs must pass linting, type checking, and tests before merge

---

## 9. Additional Guidance

- Favor open standards and open data sources when available.
- Document any workaround or idiosyncrasy related to a third-party data source in comments and in `API_ENDPOINTS_REFERENCE.md`.
- Use Cloudflare environment variables and Secrets for all sensitive configuration.
- Deployment pipelines must never leak secrets into build output or static assets.
- All new features require tests and component-level documentation.

---

## 10. Non-Goals / Out of Scope

The following are explicitly **not** part of this project unless stated otherwise in the future:

- User accounts, authentication, or server-side user data storage
- Monetization, ads, or premium tiers
- Native mobile app builds (this is a PWA only)
- Running a custom backend server — all server-side logic runs on Cloudflare Workers

---

## 11. API Documentation

_See **API_ENDPOINTS_REFERENCE.md** — to be built as data sources and endpoints are discovered and validated._

---

_Last updated: 2026-02-14_