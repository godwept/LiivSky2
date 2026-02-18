# Weather PWA – API Endpoints Reference (Draft)

This document lists the likely endpoint categories and placeholders for providers and URLs. Fill in actual providers, base URLs, auth requirements, and response notes as they are confirmed.

---

## 1. Geocoding and Location Search

| Purpose | Provider | Base URL | Endpoints | Auth | Notes |
|---|---|---|---|---|---|
| Forward geocoding (name -> lat/lon) | OpenStreetMap Nominatim | https://nominatim.openstreetmap.org | `/search?q={query}&format=json` | None | Free, open data. See [API docs](https://nominatim.org/release-docs/develop/api/Overview/). |
| Reverse geocoding (lat/lon -> name) | OpenStreetMap Nominatim | https://nominatim.openstreetmap.org | `/reverse?lat={lat}&lon={lon}&format=json` | None | Free, open data. |
| Autocomplete / suggestions | OpenStreetMap Nominatim | https://nominatim.openstreetmap.org | `/search?q={query}&format=json` | None | Use search endpoint for suggestions. |

---

## 2. Current Conditions

| Provider | Base URL | Endpoints | Auth | Notes |
|---|---|---|---|---|
| Environment Canada (MSC GeoMet OGC API) | https://api.weather.gc.ca | `/collections` (discover collections), `/collections/{collectionId}/items` (feature data) | None listed | Use collection discovery to locate realtime observations (stations/observations). Supports `bbox`, `datetime`, `limit`, `sortby`, and `f=json`/`f=csv`. |
| The Weather Network | https://weatherapi.pelmorex.com | `/api/v1/observation?locale={locale}&lat={lat}&long={long}&unit={unit}` | May require API key | Returns current conditions for specified location. |
| Other (TBD) | TBD | TBD | TBD | TBD |

---

## 3. Forecasts (Hourly / Daily / Long-Range)

| Provider | Base URL | Endpoints | Auth | Notes |
|---|---|---|---|---|
| Environment Canada (MSC GeoMet OGC API) | https://api.weather.gc.ca | `/collections` (discover collections), `/collections/{collectionId}/items` (feature data) | None listed | Use collection discovery to locate realtime observations (stations/observations). Supports `bbox`, `datetime`, `limit`, `sortby`, and `f=json`/`f=csv`. |
| The Weather Network | https://weatherapi.pelmorex.com | `/api/v1/shortterm?locale={locale}&lat={lat}&long={long}&unit={unit}&count={count}` (short term), `/api/v1/longterm?locale={locale}&lat={lat}&long={long}&unit={unit}&count={count}&offset={offset}` (long term) | May require API key | Short term and long term forecasts for specified location. |
| Other (TBD) | TBD | TBD | TBD | TBD |

---

## 4. Alerts and Warnings

| Provider | Base URL | Endpoints | Auth | Notes |
|---|---|---|---|---|
|Environment Canada (MSC GeoMet OGC API) | https://api.weather.gc.ca | `/collections` (discover collections), `/collections/{collectionId}/items` (feature data) | None listed | Use collection discovery to locate realtime observations (stations/observations). Supports `bbox`, `datetime`, `limit`, `sortby`, and `f=json`/`f=csv`. |

---

## 5. Radar Imagery
O
| Provider | Base URL | Endpoints | Auth | Notes |
|---|---|---|---|---|
| Environment Canada (MSC GeoMet OGC API) | https://api.weather.gc.ca | `/collections` (discover coverages), `/collections/{coverageId}` (metadata), `/collections/{coverageId}/coverage` | None listed | OGC API - Coverages; use `bbox`, `datetime`, and `f=` (e.g., `GTiff`, `NetCDF`, `json`) per collection. |
| Global/International radar source | TBD | TBD | TBD | TBD |
| NOAA AWS Open Data (Future Radar) | https://noaa-hrrr-pds.s3.amazonaws.com | S3 bucket access, file URLs for HRRR radar/reflectivity | None | For future radar feature: access HRRR model reflectivity files. See [AWS Open Data Registry](https://registry.opendata.aws/noaa-hrrr-pds/). |

---

## 6. Satellite Imagery

| Provider | Base URL | Endpoints | Auth | Notes |
|---|---|---|---|---|
| Environment Canada (MSC GeoMet OGC API) | https://api.weather.gc.ca | `/collections` (discover coverages), `/collections/{coverageId}/coverage` | None listed | Satellite coverages are listed as collections; query via OGC API - Coverages filters. |
| GOES / NOAA | TBD | TBD | TBD | TBD |
| RAMMB SLIDER | https://rammb-slider.cira.colostate.edu | `/data/` and web map tile endpoints | None | Real-time satellite imagery and animations from multiple satellites. See [SLIDER](https://rammb-slider.cira.colostate.edu/) for details. |
| EUMETSAT / international | TBD | TBD | TBD | TBD |
| Other (TBD) | TBD | TBD | TBD | TBD |

---

## 7. Hurricane / Tropical Storm Data

| Provider | Base URL | Endpoints | Auth | Notes |
|---|---|---|---|---|
| NOAA NHC | https://www.nhc.noaa.gov | `/CurrentStorms.json` | None | Provides current storm data in JSON format. |

---

## 8. Forecast Models (Model Data & Grids)

| Provider | Base URL | Endpoints | Auth | Notes |
|---|---|---|---|---|
| Environment Canada (MSC GeoMet OGC API) | https://api.weather.gc.ca | `/collections` (discover coverages), `/collections/{coverageId}/coverage` | None | Model grids available as coverages; use `bbox`, `datetime`, `properties`, and `subset` filters per collection schema. |
| NAM | https://nomads.ncep.noaa.gov | `/dods/nam` (OPeNDAP), `/pub/data/nccf/com/nam/prod/` (HTTPS), GRIB filter service | None | NOAA NOMADS server; 12km resolution; updates 4x/day (00z, 06z, 12z, 18z); OPeNDAP, HTTPS, or GRIB filter access |
| HRDPS | https://dd.weather.gc.ca | `/model_hrdps/continental/` (Datamart), WMS: `https://geo.weather.gc.ca/geomet` | None | Environment Canada; 2.5km resolution; GRIB2 format; updates 4x/day; also via MSC GeoMet WMS/WCS |
| RDPS | https://dd.weather.gc.ca | `/model_gem_regional/` (Datamart), WMS: `https://geo.weather.gc.ca/geomet` | None | Regional Deterministic Prediction System (Canada); 10km resolution; GRIB2; updates 4x/day |
| GFS | https://nomads.ncep.noaa.gov | `/dods/gfs_0p25` (OPeNDAP), `/pub/data/nccf/com/gfs/prod/` (HTTPS), GRIB filter | None | Global Forecast System; 0.25° resolution; updates 4x/day; 16-day forecasts; OPeNDAP or HTTPS download |
| ECMWF | https://data.ecmwf.int | `/forecasts/{date}/{time}z/ifs/{resolution}/oper/` (open data), Python: `ecmwf-opendata` package | None | IFS open data: 0.25° GRIB2; AIFS (AI model) also available; updates 4x/day; 10-day forecasts; also on AWS/Azure/GCP |
| GDPS | https://dd.weather.gc.ca | `/model_gem_global/` (Datamart), WMS: `https://geo.weather.gc.ca/geomet` | None | Global Deterministic Prediction System (Canada); 15km resolution; GRIB2; updates 2x/day |
| Open-Meteo (Unified API) | https://api.open-meteo.com | `/v1/forecast`, `/v1/gfs`, `/v1/gem`, `/v1/ecmwf` | None | **BEST OPTION** - Unified JSON API for ALL models above! No auth, CORS enabled, <10ms response, combines GFS+NAM+HRRR+HRDPS+RDPS+GDPS+ECMWF seamlessly |

---

## 9. Air Quality (Optional)

| Provider | Base URL | Endpoints | Auth | Notes |
|---|---|---|---|---|
| Canada AQHI | TBD | TBD | TBD | TBD |
| US AQI | TBD | TBD | TBD | TBD |

---

## 10. Astronomy (Optional)

| Provider | Base URL | Endpoints | Auth | Notes |
|---|---|---|---|---|
| 7timer.info (Dark Sky Forecast) | http://www.7timer.info | `/bin/api.pl` | None | Supports astronomy, stargazing, and aurora forecasts. See [API documentation](https://www.7timer.info/doc.php?lang=en#api) for parameters. |

---

## 11. Common Worker Proxy Conventions

- Normalize provider responses into internal types before returning to the frontend.
- Document any provider quirks, rate limits, or special parameters here.
- Note caching and freshness requirements per endpoint.
