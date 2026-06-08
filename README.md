# MyWard Limpopo

MyWard Limpopo is an independent civic-awareness map by KhulaNode that helps residents explore ward boundaries and understand which areas fall within each ward.

Initial scope: Polokwane Local Municipality, Limpopo.

Public URL: `https://limpopo.myward.khulanode.com`

## Data Sources

- Ward boundaries: Municipal Demarcation Board ward GeoJSON already held in this repo (`MDB_Wards_2020_-8644686055062113979.geojson`) with metadata in `SA_Wards2020+1 Metadata.pdf`.
- Ward councillors: Polokwane Municipality ward councillors page, `https://www.polokwane.gov.za/ward-councillors/`.

## Run Locally

```bash
npm run data:build
npm run dev
```

Open `http://localhost:8080`.

## Rebuild Data

```bash
npm run data:filter-polokwane
npm run data:scrape-councillors
npm run data:join-polokwane
npm run data:validate
```

Generated public data is written to `public/data/limpopo/polokwane/`.

The full national boundary source file, `MDB_Wards_2020_-8644686055062113979.geojson`, is larger than GitHub's normal file limit and is intentionally ignored. Keep it locally in the repo root only when rebuilding the filtered Polokwane data.

## Build

```bash
npm run build
```

Optional configuration:

```bash
VITE_APP_BASE_URL=http://localhost:8080
VITE_GOOGLE_ADSENSE_CLIENT_ID=
```

Local defaults live in `.env`. Set `VITE_APP_BASE_URL=https://limpopo.myward.khulanode.com` for production builds.

## Docker Compose

```bash
docker compose up --build
```

Open `http://localhost:8080`.

MyWard Limpopo is not an official government, municipal, MDB, IEC, or political-party platform. Information is compiled from public sources for civic awareness and educational purposes.
