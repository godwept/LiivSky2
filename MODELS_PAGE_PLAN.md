# Models Page — Major Overhaul Game Plan

## Vision

Replace the current basic two-tab layout with a professional, map-first model viewer
inspired by sites like Pivotal Weather. The page should feel like a dedicated forecast
model tool: animated WMS maps front-and-centre, a wide selection of models and products,
flexible region support, and a hero section that immediately communicates the current
model run status.

Charts remain available but are secondary — tucked into a collapsible panel or a
separate sub-section below the map.

---

## Phase 1 — New Page Layout & Hero Section

### 1-A Hero Section

Concept: a compact "model run status" bar pinned at the top — similar to the hero
sections on the Dashboard and Dark Sky pages but adapted for model data.

**Contents:**
- Active model name + run time (e.g. "GFS · 12Z Run · 6 h ago")
- Forecast hour indicator ("Showing F+24 h")
- Primary product name (e.g. "Surface — 2 m Temperature")
- Region name (e.g. "North America")
- A subtle animated gradient background that fades into the map below
- On first load, auto-selects the most recently completed GFS run

### 1-B Page Structure (top to bottom)

```
┌─────────────────────────────────────────────────┐
│  HERO — model run info + current product label  │
├─────────────────────────────────────────────────┤
│  MODEL SELECTOR (horizontal scrollable pills)   │
│  GFS  NAM  HRRR  ECMWF  HRDPS  RDPS  GDPS  CFS │
├─────────────────────────────────────────────────┤
│  REGION SELECTOR (horizontal pills)             │
│  N.America  Canada  CONUS  NE  SE  Prairies …   │
├─────────────────────────────────────────────────┤
│  PRODUCT CATEGORY TABS                          │
│  Surface | Precip | Upper Air | Moisture |      │
│  Severe  | Winter | Skew-T                      │
├─────────────────────────────────────────────────┤
│  PRODUCT CHIPS (within selected category)       │
│  e.g. Surface: MSLP · 2m Temp · Wind · Refl.   │
├─────────────────────────────────────────────────┤
│  MAP (Leaflet, full-width, ~55vh)               │
│  [  ← Prev ]  [ ▶ Play ]  [ Next → ]  scrubber  │
│  F+00  F+06  F+12 … timestamp label             │
├─────────────────────────────────────────────────┤
│  ▼ CHARTS (collapsible — same parameter)        │
│  Line chart comparing all active/cached models  │
└─────────────────────────────────────────────────┘
```

---

## Phase 2 — Model Expansion

### Models to Add

| ID | Name | Provider | Resolution | Coverage |
|----|------|----------|------------|----------|
| `gfs` | GFS | NOAA | 0.25° | Global — already in charts |
| `gfs_025` | GFS (0.25°) | NOAA | 0.25° | Global — map WMS |
| `nam` | NAM | NOAA | 12 km | CONUS + surrounds |
| `hrrr` | HRRR | NOAA | 3 km | CONUS |
| `rap` | RAP | NOAA | 13 km | N. America |
| `ecmwf` | ECMWF IFS | ECMWF | 0.25° | Global — already in charts |
| `hrdps` | HRDPS | ECCC | 2.5 km | Canada — map WMS (have) |
| `rdps` | RDPS | ECCC | 10 km | Canada — map WMS (have) |
| `gdps` | GDPS | ECCC | 15 km | Canada — map WMS (have) |
| `gem_global` | GEM Global | ECCC | 25 km | Global |
| `nbm` | NBM | NOAA | ~2.5 km | CONUS |
| `cfs` | CFS | NOAA | 1° | Global, seasonal |

**Priority for Phase 2:** GFS + NAM + HRRR WMS maps. EC models already work.

---

## Phase 3 — Product Categories & Parameters

### Category: Surface
| ID | Label | Notes |
|----|-------|-------|
| `sfct` | 2 m Temperature | °C |
| `mslp` | MSLP + Thickness | Contours + shading |
| `sfcwind` | 10 m Wind | Speed + barbs/arrows |
| `refl` | Simulated Reflectivity | dBZ |
| `sfcprecip` | Total Precip (Accumulated) | mm |

### Category: Precipitation
| ID | Label |
|----|-------|
| `qpf` | Total QPF (6h / 12h / 24h) |
| `snow` | Snow Accumulation |
| `frzrain` | Freezing Rain |
| `sleet` | Sleet |
| `preciptype` | Precipitation Type |

### Category: Upper Air
| ID | Label |
|----|-------|
| `500mb` | 500 mb Heights + Vorticity |
| `700mb` | 700 mb Temp + RH |
| `850mb` | 850 mb Temp + Wind |
| `925mb` | 925 mb Temp + Wind |
| `250mb` | 250 mb Jet Stream |
| `ua_temp` | Upper Air Temperature Profile |

### Category: Moisture / Dynamics
| ID | Label |
|----|-------|
| `pwat` | Precipitable Water |
| `kidx` | K-Index |
| `li` | Lifted Index |
| `vort500` | 500 mb Absolute Vorticity |
| `div250` | 250 mb Divergence |

### Category: Severe Weather
| ID | Label |
|----|-------|
| `cape` | CAPE + CIN |
| `shear` | 0–6 km Bulk Shear |
| `srh` | Storm-Relative Helicity |
| `stp` | Significant Tornado Parameter |
| `scp` | Supercell Composite |

### Category: Winter Weather
| ID | Label |
|----|-------|
| `snowqpf` | Snow QPF |
| `slr` | Snow-to-Liquid Ratio |
| `iceaccum` | Ice Accumulation |
| `sfctemp_ww` | Surface + 850 mb Temps (winter) |

---

## Phase 4 — Region Presets

Regions are simply bbox + zoom level presets passed to the Leaflet map view.

| ID | Label | Lat range | Lon range | Zoom |
|----|-------|-----------|-----------|------|
| `north_america` | N. America | 20–75 N | 50–170 W | 3 |
| `canada` | Canada | 42–83 N | 52–141 W | 4 |
| `conus` | CONUS | 24–50 N | 66–126 W | 4 |
| `tropics` | Tropics | 0–35 N | 20–110 W | 3 |
| `northeast` | Northeast | 37–48 N | 66–82 W | 6 |
| `southeast` | Southeast | 24–38 N | 74–92 W | 6 |
| `great_lakes` | Great Lakes | 40–50 N | 74–93 W | 6 |
| `prairies` | Prairies | 48–56 N | 95–115 W | 6 |
| `bc_pacific` | BC / Pacific | 48–60 N | 110–140 W | 6 |
| `local` | Near Me | user lat/lon | user lat/lon | 8 |

---

## Phase 5 — Architecture Changes

### New Services Needed

1. **`modelMapLayers.ts`** (extend / replace current `ecGeometLayers.ts`)
   - Unified catalog of all WMS sources (EC GeoMet, IEM, NOAA/NCEP if available)
   - Each product entry declares: wmsUrl, layerName, availableModels, colorScale, unit

2. **`modelRegions.ts`** — region presets (bbox + zoom)

3. **`modelProducts.ts`** — product category + parameter catalog

4. **`useModelMap.ts`** hook (extend / replace `useModelMapAnimation.ts`)
   - Manages selected model, region, product category, and parameter
   - Handles time dimension fetching per layer
   - Exposes animation controls

5. **`ModelHero.tsx`** — new hero component (run time, forecast hour, location)

6. **`ModelProductPicker.tsx`** — category tabs + product chips

7. **`ModelRegionPicker.tsx`** — region selector pills

8. **Charts panel** — keep existing `ModelChart` logic wrapped in a collapsible
   `<details>` element or a slide-out panel

---

## Phase 6 — API Endpoints (Research Complete)

### ✅ Already Available and Wired

| Source | URL | Products |
|--------|-----|---------|
| **EC GeoMet WMS** | `https://geo.weather.gc.ca/geomet` | HRDPS / RDPS / GDPS — 6 params (in use). Supports `TIME` + `DIM_REFERENCE_TIME`. Full WMS 1.3.0 + GetLegendGraphic. |
| **Open-Meteo** | `https://api.open-meteo.com` | Charts for all models via JSON API |
| **IEM HRRR Reflectivity** | `https://mesonet.agron.iastate.edu/cgi-bin/wms/hrrr/refd.cgi` | HRRR simulated reflectivity + precip type, F+0 to F+18 h |

---

### ✅ CONFIRMED NEW — UCAR THREDDS ncWMS (GFS / NAM / HRRR)

**This is the main unlock.** Unidata THREDDS exposes live ncWMS for GFS, NAM, and HRRR.
All three are up to date (confirmed current runs on 2026-02-19). No auth required.

| Model | WMS Base URL | Coverage | Update Freq |
|-------|-------------|----------|-------------|
| **GFS 0.25°** | `https://thredds.ucar.edu/thredds/wms/grib/NCEP/GFS/Global_0p25deg/Best` | Global | 4×/day |
| **NAM 12km** | `https://thredds.ucar.edu/thredds/wms/grib/NCEP/NAM/CONUS_12km/Best` | CONUS | 4×/day |
| **HRRR 2.5km** | `https://thredds.ucar.edu/thredds/wms/grib/NCEP/HRRR/CONUS_2p5km/Best` | CONUS | Hourly |

**How to use:** Standard WMS 1.1.1 with TIME parameter. Layer names come from the
GRIB variable names in the dataset. Run a GetCapabilities on each "Best" URL to get
the full layer list. Key layers expected:

- `Temperature_height_above_ground` — 2m temperature
- `Pressure_reduced_to_MSL_msl` — MSLP
- `u-component_of_wind_height_above_ground` / `v-component_of_wind_height_above_ground` — 10m winds
- `Geopotential_height_isobaric` — 500mb / 850mb heights
- `Temperature_isobaric` — upper air temps
- `Total_precipitation_surface_*` — accumulated precip
- `Composite_reflectivity_entire_atmosphere` — simulated reflectivity (HRRR)
- `Convective_available_potential_energy_surface` — CAPE

**⚠️ Note:** THREDDS ncWMS layer names can be verbose GRIB variable names.
Need to run GetCapabilities and map them to friendly display names during
implementation. Also verify THREDDS terms of use for production use — Unidata
generally allows educational/research use; may want to proxy via our Worker.

---

### ✅ CONFIRMED NEW — NOAA NWS MapServices WMS

All services at `mapservices.weather.noaa.gov` expose WMS 1.3.0 interfaces.
Time-enabled layers support the `TIME` parameter for animation.

#### NDFD Temperature (Raster WMS)
```
https://mapservices.weather.noaa.gov/raster/services/NDFD/NDFD_temp/MapServer/WMSServer
```
- Updates every 30 min (at :20 and :50 past the hour)
- Layers: 2m Temperature (hourly steps, F+0 to F+168), Apparent Temp, Relative Humidity, Max/Min Temp (daily)
- TIME-enabled (3-hourly steps)
- CONUS coverage

#### WPC QPF (Vector WMS)
```
https://mapservices.weather.noaa.gov/vector/services/precip/wpc_qpf/MapServer/WMSServer
```
- Updates 2×/day (06Z, 18Z)
- Layers: QPF 6h (00-06, 06-12, …72-78 hr), QPF 24h Day 1/2/3, QPF 48h Day 4-5/6-7, Cumulative 48/72/120/168h
- NOT time-enabled (layers are discrete forecast periods, not TIME-animated)
- CONUS coverage

#### WPC Winter Precip Probability (Vector WMS)
```
https://mapservices.weather.noaa.gov/vector/services/precip/wpc_prob_winter_precip/MapServer/WMSServer
```
- Probabilistic snow/sleet/freezing rain
- CONUS coverage

#### NOHRSC Snow Analysis (Raster WMS)
```
https://mapservices.weather.noaa.gov/raster/services/snow/NOHRSC_Snow_Analysis/MapServer/WMSServer
```
- Updates 4×/day
- Layers: Snow Depth, Snow Water Equivalent (SWE)
- 1 km resolution, CONUS
- NOT time-enabled (current analysis only)

#### CPC / WPC Hazards (Vector WMS)
```
https://mapservices.weather.noaa.gov/vector/services/hazards/cpc_weather_hazards/MapServer/WMSServer
https://mapservices.weather.noaa.gov/vector/services/hazards/wpc_precip_hazards/MapServer/WMSServer
```
- Good for severe weather and hazard overlays

---

### ❌ Not Useful for Model Maps

| Source | Why Not |
|--------|---------|
| **NOAA NOMADS** | GRIB2 + OPeNDAP only — no WMS, no tile service |
| **IEM WMS** | HRRR reflectivity only for model data; no GFS/NAM surfaces/upper air WMS |
| **ECMWF maps** | No free WMS tile source found. Charts-only via Open-Meteo. |

---

### 🔲 EC GeoMet — Extended Layer Inventory Needed

The EC GeoMet GetCapabilities returns XML too large to fetch via tool. Must
query per-layer to discover what additional HRDPS/RDPS/GDPS parameters are available.

**Known to exist beyond our current 6 params (from EC open data docs):**
- `HRDPS.CONTINENTAL_GZ500` — 500 mb geopotential height
- `HRDPS.CONTINENTAL_GZ850` — 850 mb geopotential height
- `HRDPS.CONTINENTAL_UU10` — 10m wind U-component
- `HRDPS.CONTINENTAL_VV10` — 10m wind V-component
- `HRDPS.CONTINENTAL_AL` — Albedo
- `RDPS.ETA_GZ500` — 500 mb heights (RDPS)
- `RDPS.ETA_GZ850` — 850 mb heights (RDPS)
- `GDPS.ETA_GZ500` — 500 mb heights (GDPS)

**To do:** Run per-layer GetCapabilities during Phase 3 to validate these names
before coding them into `ecGeometLayers.ts`.

---

### Summary — What We Can Build Now vs Later

| Feature | Source | Status |
|---------|--------|--------|
| EC model maps (HRDPS/RDPS/GDPS), 6 params | EC GeoMet | ✅ Live |
| GFS global map (temp, pressure, winds, precip, upper air) | UCAR THREDDS | ✅ Confirmed live, needs layer name mapping |
| NAM CONUS map (same params) | UCAR THREDDS | ✅ Confirmed live, needs layer name mapping |
| HRRR CONUS map (surface + upper air + reflectivity) | UCAR THREDDS + IEM | ✅ Confirmed live |
| NDFD temperature map (CONUS, animated) | NOAA NWS MapServices | ✅ Confirmed live |
| WPC QPF map (CONUS, 6h intervals) | NOAA NWS MapServices | ✅ Confirmed live |
| WPC Winter precip probability | NOAA NWS MapServices | ✅ Confirmed live |
| Snow depth / SWE analysis | NOAA NOHRSC | ✅ Confirmed live |
| ECMWF model maps | None found | ❌ Charts only |
| EC model upper air layers | EC GeoMet | 🔲 Need layer name verification |

---

## Implementation Order

```
Phase 1 — Layout skeleton + hero section (no new APIs needed)
  └─ ModelHero.tsx
  └─ Updated ModelsPage layout with region/category/product UI shells
  └─ ModelsPage.css refactor

Phase 2 — Region + product catalog files
  └─ modelRegions.ts
  └─ modelProducts.ts
  └─ Wire region selector to map view

Phase 3 — Expand EC model products (no new APIs, just extend ecGeometLayers.ts)
  └─ Add upper air, precip type, precip layers for HRDPS/RDPS/GDPS from GetCapabilities
  └─ Add category tags to each layer def

Phase 4 — Add GFS/NAM/HRRR WMS maps (requires new API endpoints from above)
  └─ Extend modelMapLayers.ts with new sources
  └─ Handle different WMS auth/param patterns per source

Phase 5 — Charts panel (collapsible, reuse existing ModelChart)
  └─ Wrap in collapsible component
  └─ Ensure it updates when product/model selection changes

Phase 6 — Polish, animations, mobile
  └─ Smooth hero transitions
  └─ Mobile-optimised controls
  └─ Keyboard nav for scrubber
  └─ Pre-caching improvements
```

---

## Open Questions / Decisions Needed

1. **Side-by-side comparison mode?** (two maps in split view) — worth doing eventually,
   but post-MVP.

2. **Skew-T sounding plots?** — Would need a sounding data API (e.g. University of Wyoming
   or NOAA's Raob data). Flag for future phase.

3. **Mobile layout for map controls?** — Suggest a bottom drawer for product/model/region
   pickers on small screens.

4. **Caching strategy** — current pre-caching works well for EC GeoMet. Other WMS sources
   may have rate limits; need to check IEM / THREDDS policies.

---

_Created: 2026-02-19_
