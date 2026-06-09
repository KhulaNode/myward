# MyWard Limpopo Project Tracker

Last updated: 2026-06-09

## Product Direction

MyWard Limpopo is a public civic information product for finding ward boundaries, councillors, party affiliation, and source context by place, settlement, ward, municipality, or councillor.

The product should not behave like a bare map-layer viewer. The core user job is:

1. Search for an area, settlement, ward, councillor, party, or municipality.
2. See the matching ward boundary.
3. See the ward councillor and affiliated party.
4. Understand which source produced the record and how current it is.

## Frontend Direction

Decision: move the engagement map experience toward TerriaJS.

Rationale:

- Better fit for public-data exploration than a custom Leaflet-only map.
- Built-in concepts around catalog, feature info, search, sharing, stories, and data engagement.
- Ads can live in app chrome, detail panels, and content areas without covering map controls.

Implementation rule: keep attribution, source notices, and map controls unobstructed. Do not place ads over the map canvas or core controls.

Current framework spike decision: use the existing Polokwane enriched GeoJSON only while proving the new UX and architecture. Do not expand the data pipeline during this slice.

Target architecture:

- Tailwind-oriented MyWard shell for navigation, SEO pages, ad slots, ward detail pages, and search-first civic UX.
- TerriaMap-compatible config/init files for the map explorer.
- Existing Polokwane GeoJSON as the only dataset until the six-municipality data slice starts.

## Pilot Scope

The first expanded Limpopo pilot covers 6 municipalities across all 5 Limpopo district municipalities.

| District | Municipality | Code | Wards | Source Strategy | Status |
|---|---|---:|---:|---|---|
| Capricorn | Polokwane Local Municipality | LIM354 | 45 | Live municipal page: ward, councillor, party, phone | Existing Polokwane slice built |
| Vhembe | Makhado Local Municipality | LIM344 | 38 | Live municipal page: ward, councillor, party, phone | Planned |
| Mopani | Greater Tzaneen Local Municipality | LIM333 | 35 | Municipal page for councillor and phone, 2021 Gazette join for party | Planned |
| Waterberg | Mogalakwena Local Municipality | LIM367 | 32 | Municipal page plus Gazette repair/augmentation | Planned |
| Waterberg | Modimolle-Mookgophong Local Municipality | LIM368 | 14 | 2025/26 IDP ward table: councillor, party, settlement aliases | Planned |
| Sekhukhune | Fetakgomo Tubatse Local Municipality | LIM476 | 39 | 2024/25 annual report plus by-election overlay checks | Planned |

Pilot total: 203 wards.

## Source Notes

### Baseline Boundary Source

- MDB ward GeoJSON: `MDB_Wards_2020_-8644686055062113979.geojson`
- Metadata: `SA_Wards2020+1 Metadata.pdf`
- The national GeoJSON is intentionally not committed because it is large.

### Baseline Councillor Source

- IEC/Government Gazette 2021 councillor list: `/home/moloko/45447gen653.pdf`
- Use as baseline for councillor party joins and missing municipal rows.
- Do not treat it as automatically current in 2026.

### Current Municipal Sources

Current municipal pages and reports should override or augment the 2021 Gazette where they are clear.

Known source quality:

- Polokwane: clean current municipal HTML, already parsed.
- Makhado: clean current municipal HTML.
- Greater Tzaneen: clean current names/phones, party should come from Gazette join.
- Mogalakwena: municipal page is usable but incomplete; Ward 26 has `AND` typo for `ANC`, Ward 32 is missing and needs Gazette fill.
- Modimolle-Mookgophong: strong IDP ward table, including useful settlement aliases for search.
- Fetakgomo Tubatse: report/PDF-driven and needs by-election checks, especially for 2025 activity.

## Data Model Target

Each enriched ward feature should carry:

- `ward_number`
- `ward_id`
- `ward_label`
- `municipality`
- `municipality_code`
- `district_municipality`
- `district_code`
- `province`
- `councillor_name`
- `councillor_party`
- `councillor_contact`
- `main_settlements`
- `search_aliases`
- `boundary_source`
- `boundary_last_verified`
- `councillor_source_url`
- `councillor_source_type`
- `councillor_last_verified`
- `party_source_url`
- `party_source_type`
- `data_confidence`
- `review_notes`

## Search UX Target

Search should support:

- Settlement or area name, for example `Alma`, `Vaalwater`, or farm/settlement names from ward tables.
- Municipality name.
- Ward number.
- Ward ID or ward label.
- Councillor name.
- Political party.

Important UX rule: a user should not need to know their IEC registration status, ID number, or obscure ward ID to find a ward. MyWard should support curiosity and non-home searches.

## Milestones

### Milestone 1: Freeze Pilot Data Spec

Status: in progress

- Confirm the 6 pilot municipalities.
- Record source URL/PDF for each municipality.
- Decide exact source precedence rules.
- Decide field names for enriched ward records.

### Milestone 2: Build Multi-Municipality Data Pipeline

Status: pending

- Generalize Polokwane-only scripts into municipality-aware scripts.
- Filter MDB boundaries for the 6 pilot municipality codes.
- Add curated councillor source records for each pilot municipality.
- Add Gazette join/repair records where needed.
- Generate a single Limpopo pilot enriched GeoJSON.
- Validate expected ward counts and source coverage.

### Milestone 3: Settlement Search Index

Status: pending

- Add `main_settlements` and `search_aliases` to supported wards.
- Start with Modimolle-Mookgophong because its ward table exposes strong settlement data.
- Generate a search index separate from the heavy GeoJSON if needed.

### Milestone 4: TerriaJS Feasibility Spike

Status: pending

- Confirm TerriaJS can load the pilot GeoJSON/catalog cleanly.
- Test feature info templates for councillor, party, source, and settlement fields.
- Check static deploy/runtime shape for Dokploy.
- Identify where MyWard chrome and ad slots should live.

### Milestone 5: UI/UX Rebuild

Status: pending

- Replace the current Leaflet-first experience with a TerriaJS-backed public explorer.
- Add prominent search-first flow.
- Add ward detail/source confidence panels.
- Keep mobile map controls usable and ads unobtrusive.

## Open Questions

- Should the production domain remain `limpopo.myward.khulanode.com` while pilot coverage is partial, or should the UI clearly label itself as a pilot?
- Do we expose Gazette-only records publicly, or hide them until municipality/current-source verification exists?
- How aggressively should by-election overlays be researched before first release?
- Should settlement aliases be manually curated first, or extracted from municipal IDP/annual-report tables where possible?
