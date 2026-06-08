import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { loadDotEnv } from './load-env.js';
import { repoRoot } from './paths.js';

loadDotEnv();

const rootArg = process.argv[2] || 'public';
const port = Number(process.argv[3] || process.env.PORT || 8080);
const root = path.resolve(repoRoot, rootArg);
const mimeTypes = {
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.geojson': 'application/geo+json',
  '.html': 'text/html',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.xml': 'application/xml'
};

function send(response, status, body, type = 'text/plain') {
  response.writeHead(status, { 'Content-Type': type });
  response.end(body);
}

http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  let filePath = path.join(root, decodeURIComponent(url.pathname));
  if (url.pathname === '/app-config.js' && !fs.existsSync(filePath)) {
    const config = {
      baseUrl: process.env.VITE_APP_BASE_URL || 'https://limpopo.myward.khulanode.com',
      adsenseClientId: process.env.VITE_GOOGLE_ADSENSE_CLIENT_ID || ''
    };
    send(response, 200, `window.MYWARD_CONFIG = ${JSON.stringify(config)};\n`, 'text/javascript');
    return;
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
  if (!fs.existsSync(filePath)) filePath = path.join(root, 'index.html');
  const ext = path.extname(filePath);
  send(response, 200, fs.readFileSync(filePath), mimeTypes[ext] || 'application/octet-stream');
}).listen(port, () => {
  console.log(`MyWard Limpopo server running at http://localhost:${port}`);
  console.log(`Serving ${root}`);
});
