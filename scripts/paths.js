import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const sourceWardGeojsonPath = path.join(repoRoot, 'MDB_Wards_2020_-8644686055062113979.geojson');
export const polokwaneDataDir = path.join(repoRoot, 'public', 'data', 'limpopo', 'polokwane');
export const privatePolokwaneDataDir = path.join(repoRoot, 'data', 'limpopo', 'polokwane');
export const filteredWardsPath = path.join(polokwaneDataDir, 'wards.geojson');
export const councillorsPath = path.join(privatePolokwaneDataDir, 'ward-councillors.json');
export const enrichedWardsPath = path.join(polokwaneDataDir, 'polokwane-wards.enriched.geojson');
export const validationReportPath = path.join(privatePolokwaneDataDir, 'validation-report.json');

export const councillorSourceUrl = 'https://www.polokwane.gov.za/ward-councillors/';
export const boundarySourceName = 'Municipal Demarcation Board Wards 2020 GeoJSON';
export const boundaryMetadataFile = 'SA_Wards2020+1 Metadata.pdf';
