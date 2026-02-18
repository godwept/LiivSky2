# LiivSky2 Workers

Cloudflare Worker API for geocoding and weather provider aggregation.

## Endpoints

- `GET /api/v1/geocode/search?q=...`
- `GET /api/v1/geocode/reverse?lat=...&lon=...`
- `GET /api/v1/weather/home?lat=...&lon=...&provider=ec|twn&unit=C|F`

## Development

```bash
cd workers
npm install
npm run dev
```

## Deploy

```bash
cd workers
npm run deploy
```
