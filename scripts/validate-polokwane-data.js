import fs from 'node:fs';
import { councillorsPath, enrichedWardsPath, validationReportPath } from './paths.js';

const wards = JSON.parse(fs.readFileSync(enrichedWardsPath, 'utf8'));
const councillors = JSON.parse(fs.readFileSync(councillorsPath, 'utf8'));
const records = councillors.records ?? [];
const wardNumbers = new Set(wards.features.map((feature) => Number(feature.properties.ward_number)));
const councillorWardNumbers = new Set(records.map((record) => Number(record.ward_number)));

const unmatchedWards = [...wardNumbers].filter((wardNumber) => !councillorWardNumbers.has(wardNumber)).sort((a, b) => a - b);
const councillorsWithoutWard = [...councillorWardNumbers].filter((wardNumber) => !wardNumbers.has(wardNumber)).sort((a, b) => a - b);
const matched = [...wardNumbers].filter((wardNumber) => councillorWardNumbers.has(wardNumber)).length;

const report = {
  generated_at: new Date().toISOString(),
  polokwane_ward_features: wards.features.length,
  councillor_records: records.length,
  matched_wards: matched,
  unmatched_wards: unmatchedWards,
  councillor_records_with_no_matching_ward: councillorsWithoutWard
};

fs.writeFileSync(validationReportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (wards.features.length === 0) throw new Error('Validation failed: no ward features found.');
if (records.length === 0) throw new Error('Validation failed: no councillor records found.');
