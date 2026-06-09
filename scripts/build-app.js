import fs from 'node:fs';
import path from 'node:path';
import { loadDotEnv } from './load-env.js';
import { repoRoot } from './paths.js';

loadDotEnv();

const publicDir = path.join(repoRoot, 'public');
const distDir = path.join(repoRoot, 'dist');
const baseUrl = process.env.VITE_APP_BASE_URL || 'https://limpopo.myward.khulanode.com';
const adsenseClientId = process.env.VITE_GOOGLE_ADSENSE_CLIENT_ID || '';
const googleMapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || '';
const enrichedDataPath = path.join(publicDir, 'data', 'limpopo', 'polokwane', 'polokwane-wards.enriched.geojson');

function copyDir(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) copyDir(sourcePath, destinationPath);
    else fs.copyFileSync(sourcePath, destinationPath);
  }
}

fs.rmSync(distDir, { recursive: true, force: true });
copyDir(publicDir, distDir);
fs.writeFileSync(path.join(distDir, 'app-config.js'), `window.MYWARD_CONFIG = ${JSON.stringify({ baseUrl, adsenseClientId, googleMapsApiKey })};\n`);

if (fs.existsSync(enrichedDataPath)) {
  const wards = JSON.parse(fs.readFileSync(enrichedDataPath, 'utf8'));
  const staticPaths = ['/', '/map', '/about', '/sources', '/disclaimer', '/privacy'];
  const wardPaths = wards.features.map((feature) => `/wards/${feature.properties.ward_number}`);
  const urls = [...staticPaths, ...wardPaths].map((urlPath) => {
    const loc = `${baseUrl}${urlPath === '/' ? '/' : urlPath}`;
    return `  <url><loc>${loc}</loc></url>`;
  });
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
}

console.log(`Built static app to ${distDir}`);
