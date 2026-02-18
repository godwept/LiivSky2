# LiivSky2 – Chat Handoff Plan

_Last updated: 2026-02-17_

## 1) Purpose
This document is the single source of truth to resume work in a new chat without losing context.

## 2) Current Product State
- Frontend weather homepage prototype is in place (theme to be reused across PWA).
- We are moving from prototype/mock data to live data.
- Deployment target is Cloudflare Pages (frontend) + Cloudflare Worker(s) (API layer).

## 3) Confirmed Requirements
1. Add a **Location Picker** with:
   - Search-based location lookup.
   - Map-based location selection (tap/click pin or map center confirm).
2. When a new location is selected:
   - Update selected coordinates in state.
   - Update city name label on homepage.
   - Refresh forecast from live Worker data.
3. City label should support long names via truncation (ellipsis).
4. Implement a Cloudflare Worker endpoint for homepage forecast data.
5. Start with **Environment Canada** provider.
6. Keep architecture ready for provider switching (**Environment Canada** / **The Weather Network**).
7. Hook homepage to Worker live data.
8. Deploy to Cloudflare for testing.

## 4) Architecture Decisions (from reference docs)
- Frontend must not call 3rd-party weather APIs directly.
- Worker is the unified proxy/adapter layer.
- Worker normalizes provider-specific responses to a stable internal response shape.
- Caching is required where freshness allows.
- Provider logic must be adapter-based so adding providers does not change core app contracts.

## 5) Implementation Plan (execution order)

### Phase A — Worker MVP (Environment Canada first)
- Create Worker project under `/workers`.
- Implement endpoint:
  - `GET /api/v1/weather/home?lat={lat}&lon={lon}&provider=ec|twn&unit=C|F`
- Implement `ec` adapter and normalization to homepage data shape.
- Add `twn` adapter scaffold (stub/not-implemented but wired via interface).
- Add geocoding endpoints for location picker:
  - `GET /api/v1/geocode/search?q={query}`
  - `GET /api/v1/geocode/reverse?lat={lat}&lon={lon}`
- Add basic CORS, input validation, error envelope, and cache headers.

### Phase B — Frontend data integration
- Add a typed API client service for Worker calls.
- Add dashboard weather hook (fetch, loading, error, map response -> store).
- Extend Zustand weather store:
  - `provider`, `locationLabel`, `lat`, `lon`, `setProvider`, `setLocation`, `setCoords`, `setWeatherSnapshot`.
- Update homepage to consume store + hook live data.

### Phase C — Location Picker UX
- Implement modal/sheet with two modes:
  - **Search** mode (text query + results list).
  - **Map** mode (Leaflet map, move/select pin, confirm location).
- On confirmation:
  1. Save coords.
  2. Reverse geocode to label.
  3. Update location label.
  4. Trigger homepage refresh.

### Phase D — UI polish and constraints
- Truncate location label with ellipsis and max width.
- Keep existing theme and component style patterns.
- No extra UX scope beyond requested behavior.

### Phase E — Deployment and test
- Deploy frontend to Cloudflare Pages.
- Deploy Worker and set environment variables/secrets.
- Configure frontend `VITE_API_BASE_URL` to Worker URL.
- Smoke test:
  - Select location via search and map.
  - Verify label updates/truncates.
  - Verify live weather loads from Worker.

## 6) Proposed Worker Response Contract (homepage)
```json
{
  "provider": "ec",
  "location": {
    "name": "Halifax, NS",
    "lat": 44.6488,
    "lon": -63.5752
  },
  "current": {
    "temperature": 3,
    "feelsLike": -1,
    "condition": "Cloudy",
    "icon": "cloudy",
    "humidity": 75,
    "windKph": 18,
    "pressureKpa": 101.2,
    "visibilityKm": 10,
    "uvIndex": 1
  },
  "hourly": [],
  "daily": [],
  "alerts": [],
  "updatedAt": "2026-02-17T18:00:00Z"
}
```

## 7) Provider Strategy
- `provider=ec` (active): Environment Canada adapter.
- `provider=twn` (next): The Weather Network adapter.
- UI/store should treat provider as a setting, not branch business logic per component.

## 8) Cloudflare Setup Checklist
1. Create Cloudflare Worker project and deploy API.
2. Create Cloudflare Pages project for Vite frontend.
3. Add Pages env var: `VITE_API_BASE_URL`.
4. Add Worker secrets (if/when TWN key is required).
5. Set routes/custom domain if desired (`api.<domain>`).
6. Confirm CORS allows Pages origin.

## 9) Acceptance Criteria for this milestone
- Homepage reads data from Worker endpoint.
- Location Picker supports both search and map select.
- Selecting a new location updates city label and forecast.
- Long location names truncate with ellipsis, no layout break.
- Environment Canada provider works end-to-end in production test deployment.
- Provider switch mechanism exists in code path (TWN stub acceptable for this milestone).

## 10) Risks / Notes
- Environment Canada dataset/collection mapping may require iteration while validating exact collection IDs.
- Geocoding provider usage limits/policies should be respected with caching and polite request patterns.
- The Weather Network may require credentials; keep this behind Worker secrets.

## 11) New Chat Bootstrap Prompt (copy/paste)
Use this when starting a new chat:

"Read `CHAT_HANDOFF_PLAN.md`, `AI_AGENT_REFERENCE.md`, and `API_ENDPOINTS_REFERENCE.md`. Continue implementation from Phase A in `CHAT_HANDOFF_PLAN.md` and complete through Phase E unless blocked. Keep Worker-first API design, normalized response contracts, and provider adapters (`ec` active, `twn` scaffold). Implement Location Picker with search + map selection, update homepage city label and truncate long labels with ellipsis, connect homepage to live Worker weather endpoint, and prepare Cloudflare Pages/Worker deployment for testing."

## 12) Definition of Done (current initiative)
- Code complete for Phases A–D.
- Successful test deployment (Phase E).
- Manual verification of key flows completed.
- This handoff document updated with actual deployed URLs.
