import fs from 'node:fs';
import { councillorsPath, enrichedWardsPath, filteredWardsPath } from './paths.js';

const wards = JSON.parse(fs.readFileSync(filteredWardsPath, 'utf8'));
const councillors = JSON.parse(fs.readFileSync(councillorsPath, 'utf8'));
const records = councillors.records ?? [];
const byWard = new Map(records.map((record) => [Number(record.ward_number), record]));
const matchedWards = [];

const features = wards.features.map((feature) => {
  const wardNumber = Number(feature.properties.ward_number);
  const councillor = byWard.get(wardNumber) ?? null;
  if (councillor) matchedWards.push(wardNumber);

  return {
    ...feature,
    properties: {
      ...feature.properties,
      councillor_name: councillor?.councillor_name ?? null,
      councillor_party: councillor?.political_party ?? null,
      councillor_contact: councillor?.contact_number ?? null,
      councillor_source_url: councillor?.source_url ?? councillors.source_url ?? null,
      councillor_last_verified: councillor?.scraped_date ?? null
    }
  };
});

const wardNumbers = new Set(features.map((feature) => Number(feature.properties.ward_number)));
const unmatchedWards = features
  .filter((feature) => !byWard.has(Number(feature.properties.ward_number)))
  .map((feature) => feature.properties.ward_number);
const councillorsWithoutWard = records
  .filter((record) => !wardNumbers.has(Number(record.ward_number)))
  .map((record) => record.ward_number);

fs.writeFileSync(enrichedWardsPath, JSON.stringify({
  type: 'FeatureCollection',
  name: 'Polokwane Local Municipality wards with councillor details',
  generated_at: new Date().toISOString(),
  features
}, null, 2));

console.log(`Polokwane ward features: ${features.length}`);
console.log(`Councillor records: ${records.length}`);
console.log(`Matched wards: ${matchedWards.length}`);
console.log(`Unmatched wards: ${unmatchedWards.length ? unmatchedWards.join(', ') : 'none'}`);
console.log(`Councillor records with no matching ward: ${councillorsWithoutWard.length ? councillorsWithoutWard.join(', ') : 'none'}`);
console.log(`Output: ${enrichedWardsPath}`);
