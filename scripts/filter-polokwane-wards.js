import fs from 'node:fs';
import {
  boundaryMetadataFile,
  boundarySourceName,
  filteredWardsPath,
  sourceWardGeojsonPath
} from './paths.js';

const targetMunicipality = 'Polokwane Local Municipality';
const targetMunicipalityCode = 'LIM354';
const generatedDate = new Date().toISOString().slice(0, 10);

if (!fs.existsSync(sourceWardGeojsonPath)) {
  throw new Error(
    'Missing national ward source file: MDB_Wards_2020_-8644686055062113979.geojson. ' +
    'This 127 MB source file is intentionally not committed to git; place it in the repo root before running data:filter-polokwane.'
  );
}

function normaliseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString().slice(0, 10);
}

function getWardNumber(properties) {
  // MDB ward data currently uses WardNo. Keep fallbacks for future field renames.
  const value = properties.WardNo ?? properties.ward_number ?? properties.WARD_NO ?? properties.wardNo;
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? number : null;
}

function isPolokwane(properties) {
  const municipality = properties.Municipali ?? properties.municipality ?? properties.LocalMunicipality;
  const code = properties.CAT_B ?? properties.municipality_code ?? properties.MunicipalityCode;
  return municipality === targetMunicipality || code === targetMunicipalityCode;
}

function mapProperties(properties) {
  const wardNumber = getWardNumber(properties);
  return {
    ward_number: wardNumber,
    municipality: properties.Municipali ?? targetMunicipality,
    province: properties.Province ?? 'Limpopo',
    district_municipality: properties.District ?? null,
    district_code: properties.DistrictCo ?? null,
    municipality_code: properties.CAT_B ?? targetMunicipalityCode,
    ward_id: properties.WardID ?? null,
    ward_label: properties.WardLabel ?? (wardNumber ? `${targetMunicipalityCode}_${wardNumber}` : null),
    boundary_source: boundarySourceName,
    boundary_source_file: 'MDB_Wards_2020_-8644686055062113979.geojson',
    boundary_metadata_file: boundaryMetadataFile,
    boundary_source_date: normaliseDate(properties.Date),
    boundary_last_verified: generatedDate,
    source_properties: properties
  };
}

const source = JSON.parse(fs.readFileSync(sourceWardGeojsonPath, 'utf8'));
if (source.type !== 'FeatureCollection' || !Array.isArray(source.features)) {
  throw new Error('Expected national ward source to be a GeoJSON FeatureCollection.');
}

const features = source.features
  .filter((feature) => isPolokwane(feature.properties ?? {}))
  .map((feature) => ({
    type: 'Feature',
    properties: mapProperties(feature.properties ?? {}),
    geometry: feature.geometry
  }))
  .sort((a, b) => (a.properties.ward_number ?? 0) - (b.properties.ward_number ?? 0));

if (features.length === 0) {
  throw new Error('No Polokwane ward features found in the national ward dataset.');
}

const missingWardNumbers = features.filter((feature) => feature.properties.ward_number === null);
if (missingWardNumbers.length > 0) {
  console.warn(`Warning: ${missingWardNumbers.length} Polokwane features are missing ward numbers.`);
}

fs.mkdirSync(new URL('../public/data/limpopo/polokwane/', import.meta.url), { recursive: true });
fs.writeFileSync(
  filteredWardsPath,
  JSON.stringify({
    type: 'FeatureCollection',
    name: 'Polokwane Local Municipality wards',
    generated_at: new Date().toISOString(),
    features
  }, null, 2)
);

console.log(`Polokwane ward features: ${features.length}`);
console.log(`Output: ${filteredWardsPath}`);
