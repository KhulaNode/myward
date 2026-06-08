import fs from 'node:fs';
import https from 'node:https';
import { councillorSourceUrl, councillorsPath, privatePolokwaneDataDir } from './paths.js';

const userAgent = 'MyWardLimpopoDataBot/0.1 (+https://limpopo.myward.khulanode.com; civic-awareness data refresh)';
const cachePath = new URL('../data/limpopo/polokwane/ward-councillors-page.html', import.meta.url);
const scrapedDate = new Date().toISOString().slice(0, 10);
const cacheMaxAgeMs = 12 * 60 * 60 * 1000;

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function textLinesFromHtml(html) {
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function normalisePhone(value) {
  const match = value.match(/(?:\+27|0)\s?\d[\d\s-]{7,}/);
  return match ? match[0].replace(/\s+/g, ' ').trim() : null;
}

function parseCouncillors(html) {
  const lines = textLinesFromHtml(html);
  const records = [];
  const seen = new Set();

  for (let index = 0; index < lines.length; index += 1) {
    const wardMatch = lines[index].match(/^([A-Z]{2,10})\s+Wards?\s+(\d{1,3})$/i);
    if (!wardMatch) continue;

    const party = wardMatch[1].toUpperCase();
    const wardNumber = Number.parseInt(wardMatch[2], 10);
    const nameLine = lines.slice(index + 1).find((line) => /^Cllr\b/i.test(line));
    const phoneLine = lines.slice(index + 1, index + 5).map(normalisePhone).find(Boolean);
    const name = nameLine ? nameLine.replace(/^Cllr\.?\s*/i, 'Cllr ').trim() : null;

    if (!wardNumber) console.warn(`Warning: missing ward number near line "${lines[index]}".`);
    if (!party) console.warn(`Warning: missing party for ward ${wardNumber}.`);
    if (!name) console.warn(`Warning: missing councillor name for ward ${wardNumber}.`);
    if (!phoneLine) console.warn(`Warning: missing contact number for ward ${wardNumber}.`);

    const key = `${wardNumber}:${party}:${name ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);

    records.push({
      ward_number: wardNumber,
      councillor_name: name,
      political_party: party || null,
      contact_number: phoneLine ?? null,
      source_url: councillorSourceUrl,
      scraped_date: scrapedDate
    });
  }

  return records.sort((a, b) => a.ward_number - b.ward_number);
}

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': userAgent } }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Request failed with status ${response.statusCode}`));
        response.resume();
        return;
      }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

async function loadHtml() {
  fs.mkdirSync(privatePolokwaneDataDir, { recursive: true });
  if (fs.existsSync(cachePath)) {
    const age = Date.now() - fs.statSync(cachePath).mtimeMs;
    if (age < cacheMaxAgeMs) {
      console.log(`Using cached councillor page: ${cachePath.pathname}`);
      return fs.readFileSync(cachePath, 'utf8');
    }
  }

  console.log(`Fetching ${councillorSourceUrl}`);
  const html = await fetchHtml(councillorSourceUrl);
  fs.writeFileSync(cachePath, html);
  return html;
}

const html = await loadHtml();
const councillors = parseCouncillors(html);

if (councillors.length === 0) {
  throw new Error('No councillor records found. The Polokwane ward councillors page layout may have changed.');
}

fs.writeFileSync(councillorsPath, JSON.stringify({
  source_url: councillorSourceUrl,
  scraped_at: new Date().toISOString(),
  records: councillors
}, null, 2));

console.log(`Councillor records scraped: ${councillors.length}`);
console.log(`Output: ${councillorsPath}`);
