const DATA_URL = '/data/limpopo/polokwane/polokwane-wards.enriched.geojson';
const SOURCE_URL = 'https://www.polokwane.gov.za/ward-councillors/';
const DESCRIPTION = 'MyWard Limpopo is an independent civic-awareness map by KhulaNode that helps residents explore ward boundaries and understand which areas fall within each ward.';
const DISCLAIMER = 'MyWard Limpopo is an independent civic-awareness project by KhulaNode. It is not affiliated with, endorsed by, or operated by Polokwane Municipality, the Municipal Demarcation Board, the Electoral Commission, any government body, or any political party. Information is compiled from public sources for civic awareness and educational purposes. Users should verify official matters with the relevant public body.';
const config = window.MYWARD_CONFIG || { baseUrl: 'https://limpopo.myward.khulanode.com', adsenseClientId: '' };

const state = {
  wards: null,
  selectedWard: null,
  map: null,
  layer: null
};

const routes = {
  '/': renderHome,
  '/map': renderMapPage,
  '/about': renderAbout,
  '/sources': renderSources,
  '/disclaimer': renderDisclaimer,
  '/privacy': renderPrivacy
};

function titleFor(path) {
  if (path.startsWith('/wards/')) return `Ward ${path.split('/').pop()} | MyWard Limpopo`;
  const titles = {
    '/': 'MyWard Limpopo | Polokwane ward map and boundaries',
    '/map': 'Polokwane ward map | MyWard Limpopo',
    '/about': 'About MyWard Limpopo',
    '/sources': 'Data sources | MyWard Limpopo',
    '/disclaimer': 'Disclaimer | MyWard Limpopo',
    '/privacy': 'Privacy policy | MyWard Limpopo'
  };
  return titles[path] || titles['/'];
}

function setSeo(path, description) {
  document.title = titleFor(path);
  const canonical = `${config.baseUrl}${path === '/' ? '/' : path}`;
  document.querySelector('link[rel="canonical"]').setAttribute('href', canonical);
  document.querySelector('meta[name="description"]').setAttribute('content', description);
  document.querySelector('meta[property="og:title"]').setAttribute('content', titleFor(path));
  document.querySelector('meta[property="og:description"]').setAttribute('content', description);
  document.querySelector('meta[property="og:url"]').setAttribute('content', canonical);
}

function html(strings, ...values) {
  return strings.reduce((result, string, index) => result + string + (values[index] ?? ''), '');
}

function escapeHtml(value) {
  if (value === null || value === undefined || value === '') return 'Not available';
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

function adSlot(label) {
  const enabled = Boolean(config.adsenseClientId);
  return html`
    <aside class="ad-slot" data-enabled="${enabled}" aria-label="${escapeHtml(label)}">
      ${enabled ? '<span>Advertisement</span>' : '<span>Ad space reserved</span>'}
    </aside>
  `;
}

function mountAds() {
  if (!config.adsenseClientId || document.querySelector('script[data-adsense]')) return;
  const script = document.createElement('script');
  script.async = true;
  script.dataset.adsense = 'true';
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(config.adsenseClientId)}`;
  document.head.appendChild(script);
  // Real AdSense units can be inserted inside .ad-slot elements once a publisher ID is configured.
}

async function loadWards() {
  if (state.wards) return state.wards;
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`Could not load Polokwane ward data: ${response.status}`);
  state.wards = await response.json();
  return state.wards;
}

function render(content, path, description = DESCRIPTION) {
  document.getElementById('main').innerHTML = content;
  setSeo(path, description);
  document.querySelectorAll('.site-menu a').forEach((link) => {
    link.toggleAttribute('aria-current', link.getAttribute('href') === path);
  });
  mountAds();
}

function renderHome(path) {
  render(html`
    <section class="hero">
      <div class="hero-inner">
        <div>
          <p class="eyebrow">Polokwane Local Municipality</p>
          <h1>MyWard Limpopo</h1>
          <p class="lead">Know your ward. Understand your area.</p>
          <p class="lead">Tseba ward ya gago.</p>
          <p>${DESCRIPTION}</p>
          <div class="actions">
            <a class="button" href="/map" data-link>Open Polokwane ward map</a>
            <a class="button secondary" href="/sources" data-link>View sources</a>
          </div>
        </div>
        <a class="map-preview" href="/map" data-link aria-label="Open the Polokwane ward map">
          <span class="preview-fallback" aria-hidden="true"></span>
          <svg viewBox="0 0 520 360" aria-hidden="true" focusable="false">
            <path class="preview-zone preview-zone-a" d="M70 62 205 35 326 86 448 58 474 176 410 303 284 278 156 326 54 230Z" />
            <path class="preview-zone preview-zone-b" d="M205 35 326 86 302 186 218 176Z" />
            <path class="preview-zone preview-zone-c" d="M326 86 448 58 474 176 384 184Z" />
            <path class="preview-zone preview-zone-d" d="M54 230 156 326 218 176 70 62Z" />
            <path class="preview-zone preview-zone-e" d="M218 176 302 186 284 278 156 326Z" />
            <path class="preview-zone preview-zone-f" d="M302 186 474 176 410 303 284 278Z" />
            <path class="preview-route" d="M94 239 C159 209 207 221 263 196 S356 132 434 151" />
            <circle class="preview-pin" cx="302" cy="186" r="13" />
          </svg>
          <span class="preview-label">45 Polokwane wards</span>
        </a>
      </div>
    </section>
    <section class="content">
      ${adSlot('Advertisement below hero')}
      <h2>Explore Polokwane ward boundaries</h2>
      <p class="lead">Use this Limpopo ward map to inspect Polokwane ward boundaries, compare nearby areas, and find ward councillor information compiled from public sources.</p>
      <div class="grid">
        <article class="card">
          <h3>Find my ward Polokwane</h3>
          <p>Open the interactive map, tap a polygon, and view the ward number, municipality, province, councillor details, source links, and verification dates.</p>
        </article>
        <article class="card">
          <h3>Municipal ward boundaries Limpopo</h3>
          <p>The first public scope is Polokwane Local Municipality, filtered from the national ward boundary dataset already held in this repository.</p>
        </article>
        <article class="card">
          <h3>Independent civic awareness</h3>
          <p>This is not an official government service. It is a public-interest map by KhulaNode for residents who want clearer ward geography.</p>
        </article>
      </div>
    </section>
  `, path, 'Polokwane ward map and boundaries for residents using MyWard Limpopo, an independent civic-awareness map by KhulaNode.');
}

async function renderMapPage(path, wardFromUrl = null) {
  render(html`
    <section class="map-layout">
      <div class="map-toolbar">
        <div>
          <p class="eyebrow">Polokwane ward map</p>
          <h1>Ward boundaries</h1>
          <p class="lead">Tap a ward polygon to view councillor and source information.</p>
        </div>
        <p class="disclaimer">${escapeHtml(DISCLAIMER)}</p>
      </div>
      <div class="map-shell"><div id="ward-map" role="application" aria-label="Interactive map of Polokwane ward boundaries"></div></div>
      <aside>
        <div class="info-panel" id="ward-panel">${wardPanel(null)}</div>
        ${adSlot('Advertisement beside map')}
      </aside>
    </section>
  `, path, 'Interactive Polokwane ward map showing ward boundaries, councillor details, sources, and last verified dates.');

  const wards = await loadWards();
  const selected = wardFromUrl ? wards.features.find((feature) => Number(feature.properties.ward_number) === Number(wardFromUrl)) : null;
  initMap(wards, selected ?? wards.features[0]);
}

function wardPanel(feature) {
  if (!feature) {
    return html`
      <h2>Select a ward</h2>
      <p>Click or tap any Polokwane ward boundary on the map to view details.</p>
    `;
  }
  const p = feature.properties;
  return html`
    <h2>Ward ${escapeHtml(p.ward_number)}</h2>
    <div class="facts">
      <div class="fact"><span>Municipality</span><strong>${escapeHtml(p.municipality)}</strong></div>
      <div class="fact"><span>Province</span><strong>${escapeHtml(p.province)}</strong></div>
      <div class="fact"><span>Councillor</span><strong>${escapeHtml(p.councillor_name)}</strong></div>
      <div class="fact"><span>Party</span><strong>${escapeHtml(p.councillor_party)}</strong></div>
      <div class="fact"><span>Contact</span><strong>${escapeHtml(p.councillor_contact)}</strong></div>
      <div class="fact"><span>Councillor source</span><strong><a href="${escapeHtml(p.councillor_source_url || SOURCE_URL)}" rel="nofollow noopener" target="_blank">Polokwane Municipality ward councillors page</a></strong></div>
      <div class="fact"><span>Councillor last verified</span><strong>${escapeHtml(p.councillor_last_verified)}</strong></div>
      <div class="fact"><span>Boundary source</span><strong>${escapeHtml(p.boundary_source)}</strong></div>
      <div class="fact"><span>Boundary last verified</span><strong>${escapeHtml(p.boundary_last_verified)}</strong></div>
    </div>
    <p class="disclaimer">${escapeHtml(DISCLAIMER)}</p>
    <div class="panel-actions">
      <a class="button secondary" href="/wards/${escapeHtml(p.ward_number)}" data-link>Open detail view</a>
    </div>
  `;
}

function initMap(wards, selectedFeature) {
  if (!window.L) {
    document.getElementById('ward-map').innerHTML = '<p class="content">The map library could not load. Please try again later.</p>';
    return;
  }
  state.selectedWard = selectedFeature;
  document.getElementById('ward-panel').innerHTML = wardPanel(selectedFeature);
  if (state.map) state.map.remove();

  state.map = L.map('ward-map', { zoomControl: true, scrollWheelZoom: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(state.map);

  state.layer = L.geoJSON(wards, {
    style: (feature) => styleFeature(feature, feature === selectedFeature),
    onEachFeature: (feature, layer) => {
      layer.on('click', () => selectWard(feature, layer));
      layer.bindTooltip(`Ward ${feature.properties.ward_number}`, { sticky: true });
    }
  }).addTo(state.map);
  state.map.fitBounds(state.layer.getBounds(), { padding: [18, 18] });
  if (selectedFeature) highlightSelected();
}

function styleFeature(feature, selected = false) {
  return {
    color: selected ? '#c58b2c' : '#155e63',
    fillColor: selected ? '#f3c15f' : '#6db4ad',
    fillOpacity: selected ? 0.48 : 0.28,
    weight: selected ? 3 : 1.4
  };
}

function highlightSelected() {
  state.layer.eachLayer((layer) => {
    const selected = Number(layer.feature.properties.ward_number) === Number(state.selectedWard.properties.ward_number);
    layer.setStyle(styleFeature(layer.feature, selected));
    if (selected) layer.bringToFront();
  });
}

function selectWard(feature) {
  state.selectedWard = feature;
  document.getElementById('ward-panel').innerHTML = wardPanel(feature);
  highlightSelected();
  history.replaceState({}, '', `/wards/${feature.properties.ward_number}`);
  setSeo(`/wards/${feature.properties.ward_number}`, `Ward ${feature.properties.ward_number} in Polokwane Local Municipality with boundary and councillor information from public sources.`);
}

async function renderWardDetail(path) {
  const wardNumber = Number(path.split('/').pop());
  const wards = await loadWards();
  const feature = wards.features.find((item) => Number(item.properties.ward_number) === wardNumber);
  if (!feature) {
    render(`<section class="content"><h1>Ward not found</h1><p>No Polokwane ward ${escapeHtml(wardNumber)} record was found.</p></section>`, path);
    return;
  }
  render(html`
    <section class="content">
      <p class="eyebrow">Polokwane Local Municipality</p>
      ${wardPanel(feature)}
      ${adSlot('Advertisement below ward detail')}
      <p><a href="/map" data-link>Back to the map</a></p>
    </section>
  `, path, `Ward ${wardNumber} in Polokwane Local Municipality with councillor details, source links, and ward boundary metadata.`);
}

function renderAbout(path) {
  render(html`
    <section class="content">
      <h1>About MyWard Limpopo</h1>
      <p class="lead">${DESCRIPTION}</p>
      <p>The first public scope is Polokwane Local Municipality. The project is designed for Google-search-friendly public access, low-end mobile devices, and slow connections.</p>
      <p>MyWard Limpopo focuses on civic awareness. It does not replace official municipal, MDB, IEC, or government records.</p>
    </section>
  `, path);
}

function renderSources(path) {
  render(html`
    <section class="content">
      <h1>Sources</h1>
      <div class="source-list">
        <article class="card">
          <h2>Ward boundaries</h2>
          <p>Municipal Demarcation Board ward boundary GeoJSON held in this repository: <strong>MDB_Wards_2020_-8644686055062113979.geojson</strong>.</p>
          <p>Metadata file: <strong>SA_Wards2020+1 Metadata.pdf</strong>.</p>
        </article>
        <article class="card">
          <h2>Ward councillors</h2>
          <p>Polokwane Municipality ward councillors page: <a href="${SOURCE_URL}" rel="nofollow noopener" target="_blank">${SOURCE_URL}</a>.</p>
        </article>
        <article class="card">
          <h2>Generated data</h2>
          <p>The Polokwane GeoJSON is generated from repeatable scripts in this repository. See <a href="/data/limpopo/polokwane/polokwane-wards.enriched.geojson">the enriched GeoJSON</a>.</p>
        </article>
      </div>
    </section>
  `, path, 'Data sources for MyWard Limpopo, including ward boundaries and the Polokwane Municipality ward councillors page.');
}

function renderDisclaimer(path) {
  render(html`
    <section class="content">
      <h1>Disclaimer</h1>
      <p class="lead">${escapeHtml(DISCLAIMER)}</p>
    </section>
  `, path);
}

function renderPrivacy(path) {
  render(html`
    <section class="content">
      <h1>Privacy policy</h1>
      <p>MyWard Limpopo does not provide user accounts, logins, or user-submitted personal profiles.</p>
      <p>Basic analytics may be added later to understand aggregate usage. Google AdSense may use cookies or similar technologies to serve and measure advertising where ads are enabled.</p>
      <p>Users can control cookies through their browser settings. MyWard Limpopo does not sell user-submitted personal data.</p>
    </section>
  `, path, 'Privacy policy for MyWard Limpopo covering analytics, Google AdSense, cookies, and the absence of user accounts.');
}

function navigate(path) {
  const cleanPath = path.replace(/\/$/, '') || '/';
  if (cleanPath.startsWith('/wards/')) {
    renderMapPage(cleanPath, cleanPath.split('/').pop()).catch(showError);
    return;
  }
  const renderer = routes[cleanPath] || renderHome;
  const result = renderer(cleanPath);
  if (result?.catch) result.catch(showError);
}

function showError(error) {
  console.error(error);
  render(`<section class="content"><h1>Something went wrong</h1><p>${escapeHtml(error.message)}</p></section>`, location.pathname);
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-link]');
  if (!link) return;
  event.preventDefault();
  const path = new URL(link.href).pathname;
  history.pushState({}, '', path);
  document.getElementById('site-menu').classList.remove('open');
  document.querySelector('.menu-button').setAttribute('aria-expanded', 'false');
  navigate(path);
});

document.querySelector('.menu-button').addEventListener('click', () => {
  const menu = document.getElementById('site-menu');
  const open = menu.classList.toggle('open');
  document.querySelector('.menu-button').setAttribute('aria-expanded', String(open));
});

window.addEventListener('popstate', () => navigate(location.pathname));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js'));
}

navigate(location.pathname);
