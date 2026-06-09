const DATA_URL = '/data/limpopo/polokwane/polokwane-wards.enriched.geojson';
const TERRIA_INIT_URL = '/terria/init/myward-polokwane.json';
const SOURCE_URL = 'https://www.polokwane.gov.za/ward-councillors/';
const DESCRIPTION = 'Search Polokwane wards by place, ward number, councillor, party, or municipality with MyWard Limpopo.';
const DISCLAIMER = 'MyWard Limpopo is an independent civic-awareness project by KhulaNode. It is not affiliated with, endorsed by, or operated by Polokwane Municipality, the Municipal Demarcation Board, the Electoral Commission, any government body, or any political party.';
const config = window.MYWARD_CONFIG || {
  baseUrl: 'https://limpopo.myward.khulanode.com',
  adsenseClientId: '',
  googleMapsApiKey: ''
};

const state = {
  wards: null,
  query: '',
  party: 'all',
  municipalityCode: 'LIM354',
  selectedWard: null,
  map: null,
  layer: null,
  view: 'explorer',
  googleTileSession: null
};

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

function normalise(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function titleFor(path) {
  if (path.startsWith('/wards/')) return `Ward ${path.split('/').pop()} | MyWard Limpopo`;
  const titles = {
    '/': 'MyWard Limpopo | Ward search and councillor explorer',
    '/map': 'Polokwane ward explorer | MyWard Limpopo',
    '/about': 'About MyWard Limpopo',
    '/sources': 'Data sources | MyWard Limpopo',
    '/disclaimer': 'Disclaimer | MyWard Limpopo',
    '/privacy': 'Privacy policy | MyWard Limpopo'
  };
  return titles[path] || titles['/'];
}

function setSeo(path, description = DESCRIPTION) {
  document.title = titleFor(path);
  const canonical = `${config.baseUrl}${path === '/' ? '/' : path}`;
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', titleFor(path));
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical);
}

function adSlot(label, compact = false) {
  const enabled = Boolean(config.adsenseClientId);
  return html`
    <aside class="ad-slot ${compact ? 'ad-slot-compact' : ''}" data-enabled="${enabled}" aria-label="${escapeHtml(label)}">
      <span>${enabled ? 'Advertisement' : 'Ad space reserved'}</span>
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
}

async function loadWards() {
  if (state.wards) return state.wards;
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`Could not load Polokwane ward data: ${response.status}`);
  state.wards = await response.json();
  state.selectedWard = state.wards.features[0];
  return state.wards;
}

function uniqueParties(features) {
  return [...new Set(features.map((feature) => feature.properties.councillor_party).filter(Boolean))].sort();
}

function searchText(feature) {
  const p = feature.properties;
  return normalise([
    p.ward_number,
    p.municipality,
    p.municipality_code,
    p.district_municipality,
    p.councillor_name,
    p.councillor_party,
    p.boundary_source
  ].join(' '));
}

function filteredFeatures() {
  if (!state.wards) return [];
  const query = normalise(state.query);
  return state.wards.features.filter((feature) => {
    const p = feature.properties;
    if (state.party !== 'all' && p.councillor_party !== state.party) return false;
    if (!query) return true;
    return searchText(feature).includes(query);
  });
}

function appFrame(content, currentPath = '/') {
  return html`
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav class="mx-auto flex min-h-[68px] w-[min(1440px,calc(100%-24px))] items-center justify-between gap-3">
        <a class="flex items-center gap-3 text-ink no-underline" href="/" data-link>
          <span class="brand-logo-mark"><img src="/img/mywardlogo.png" alt="" /></span>
          <span class="min-w-0">
            <span class="block text-sm font-black leading-tight sm:text-base">MyWard Limpopo</span>
            <span class="hidden text-xs font-bold text-slate-500 sm:block">Polokwane pilot explorer</span>
          </span>
        </a>
        <button class="menu-button" type="button" aria-expanded="false" aria-controls="site-menu">Menu</button>
        <div class="site-menu" id="site-menu">
          ${navLink('/', 'Explorer', currentPath)}
          ${navLink('/map', 'Map', currentPath)}
          ${navLink('/sources', 'Sources', currentPath)}
          ${navLink('/about', 'About', currentPath)}
          ${navLink('/disclaimer', 'Disclaimer', currentPath)}
        </div>
      </nav>
    </header>
    <main id="main">${content}</main>
    <footer class="border-t border-slate-200 bg-white">
      <div class="mx-auto flex w-[min(1440px,calc(100%-24px))] flex-col gap-2 py-5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>Independent civic-awareness project by <a class="font-bold text-civic" href="https://khulanode.com/" target="_blank" rel="noopener">KhulaNode</a>.</p>
        <p><a class="font-bold text-civic" href="/privacy" data-link>Privacy</a></p>
      </div>
    </footer>
  `;
}

function navLink(path, label, currentPath) {
  const active = currentPath === path || (path === '/' && currentPath === '/map');
  return `<a href="${path}" data-link ${active ? 'aria-current="page"' : ''}>${label}</a>`;
}

function render(content, path, description = DESCRIPTION) {
  document.getElementById('app').innerHTML = appFrame(content, path);
  setSeo(path, description);
  bindShellEvents();
  mountAds();
}

function bindShellEvents() {
  document.querySelector('.menu-button')?.addEventListener('click', () => {
    const menu = document.getElementById('site-menu');
    const open = menu.classList.toggle('open');
    document.querySelector('.menu-button')?.setAttribute('aria-expanded', String(open));
  });
}

async function renderExplorer(path = '/') {
  const wards = await loadWards();
  const features = filteredFeatures();
  if (!features.includes(state.selectedWard)) state.selectedWard = features[0] ?? wards.features[0];

  render(explorerTemplate(wards, features), path, 'Search Polokwane ward boundaries, councillors, parties, and source records in a public civic explorer.');
  bindExplorerEvents();
  initMap(wards, features);
}

function explorerTemplate(wards, features) {
  const parties = uniqueParties(wards.features);
  const selected = state.selectedWard;
  return html`
    <section class="explorer-shell">
      <div class="explorer-top">
        <div class="min-w-0">
          <p class="eyebrow">TerriaMap direction / Polokwane pilot data</p>
          <h1>Find a ward without needing a ward ID.</h1>
          <p class="lead">Search by ward number, councillor, party, municipality, or source text. Settlement search lands in the next data slice.</p>
        </div>
        <div class="brand-card">
          <img src="/img/mywardtext.png" alt="MyWard" />
          <div class="brand-card-meta">
            <span class="source-status">Current pilot</span>
            <strong>45 Polokwane wards</strong>
            <span>1 municipality now. Six-municipality structure next.</span>
          </div>
        </div>
      </div>

      <section class="explorer-grid">
        <aside class="control-panel" aria-label="Ward search controls">
          <label class="search-label" for="ward-search">Search MyWard</label>
          <div class="search-box">
            <input
              id="ward-search"
              type="search"
              value="${escapeHtml(state.query)}"
              placeholder="Try ward 42, Matonzi, DA, Polokwane"
              autocomplete="off"
            />
            <button class="icon-button" type="button" id="clear-search" aria-label="Clear search">x</button>
          </div>

          <div class="field-group">
            <label for="municipality-filter">Municipality</label>
            <select id="municipality-filter">
              <option value="LIM354" selected>Polokwane Local Municipality</option>
              <option disabled>Makhado - planned</option>
              <option disabled>Greater Tzaneen - planned</option>
              <option disabled>Mogalakwena - planned</option>
              <option disabled>Modimolle-Mookgophong - planned</option>
              <option disabled>Fetakgomo Tubatse - planned</option>
            </select>
          </div>

          <div class="field-group">
            <span>Party</span>
            <div class="chip-row" role="group" aria-label="Filter by party">
              <button class="chip ${state.party === 'all' ? 'active' : ''}" data-party="all" type="button">All</button>
              ${parties.map((party) => `<button class="chip ${state.party === party ? 'active' : ''}" data-party="${escapeHtml(party)}" type="button">${escapeHtml(party)}</button>`).join('')}
            </div>
          </div>

          <div class="stats-grid">
            <div><span>Results</span><strong>${features.length}</strong></div>
            <div><span>Wards</span><strong>${wards.features.length}</strong></div>
            <div><span>Parties</span><strong>${parties.length}</strong></div>
          </div>

          <div class="results-list" id="results-list" aria-label="Ward search results">
            ${features.length ? features.map(resultCard).join('') : emptyResults()}
          </div>
        </aside>

        <section class="map-workspace" aria-label="Interactive ward workspace">
          <div class="map-actions">
            <div>
              <span class="workspace-label">Map workspace</span>
              <strong>Boundary and councillor context</strong>
            </div>
            <a class="button ghost" href="${TERRIA_INIT_URL}" target="_blank" rel="noopener">Terria init JSON</a>
          </div>
          <div class="map-shell"><div id="ward-map" role="application" aria-label="Interactive map of Polokwane ward boundaries"></div></div>
        </section>

        <aside class="detail-panel" id="detail-panel" aria-label="Selected ward detail">
          ${wardDetail(selected)}
          ${adSlot('Advertisement in ward detail panel', true)}
        </aside>
      </section>
    </section>
  `;
}

function resultCard(feature) {
  const p = feature.properties;
  const selected = Number(state.selectedWard?.properties.ward_number) === Number(p.ward_number);
  return html`
    <button class="result-card ${selected ? 'selected' : ''}" type="button" data-ward="${escapeHtml(p.ward_number)}">
      <span class="ward-badge">Ward ${escapeHtml(p.ward_number)}</span>
      <strong>${escapeHtml(p.councillor_name)}</strong>
      <span>${escapeHtml(p.councillor_party)} - ${escapeHtml(p.municipality)}</span>
    </button>
  `;
}

function emptyResults() {
  return html`
    <div class="empty-state">
      <strong>No matching wards</strong>
      <span>Try a ward number, party, councillor surname, or municipality.</span>
    </div>
  `;
}

function wardDetail(feature) {
  if (!feature) {
    return html`
      <h2>Select a ward</h2>
      <p>Search or select a ward polygon to inspect councillor and source information.</p>
    `;
  }

  const p = feature.properties;
  return html`
    <div class="detail-heading">
      <span class="ward-badge large">Ward ${escapeHtml(p.ward_number)}</span>
      <h2>${escapeHtml(p.municipality)}</h2>
      <p>${escapeHtml(p.district_municipality)} District, ${escapeHtml(p.province)}</p>
    </div>
    <div class="detail-facts">
      ${fact('Councillor', p.councillor_name)}
      ${fact('Party', p.councillor_party)}
      ${fact('Boundary verified', p.boundary_last_verified)}
      ${fact('Councillor verified', p.councillor_last_verified)}
    </div>
    <div class="source-note">
      <strong>Source confidence</strong>
      <p>Municipal councillor page joined to MDB ward boundary data. Later slices will add Gazette joins, settlement aliases, and explicit confidence tiers.</p>
      <a href="${escapeHtml(p.councillor_source_url || SOURCE_URL)}" rel="nofollow noopener" target="_blank">Open councillor source</a>
    </div>
    <div class="panel-actions">
      <a class="button" href="/wards/${escapeHtml(p.ward_number)}" data-link>Open ward page</a>
    </div>
  `;
}

function wardProfileCard(feature) {
  const p = feature.properties;
  return html`
    <article class="ward-profile-card">
      <div class="ward-profile-header">
        <span class="ward-badge large">Ward ${escapeHtml(p.ward_number)}</span>
        <div>
          <p class="eyebrow">Polokwane Local Municipality</p>
          <h1>Ward ${escapeHtml(p.ward_number)} councillor and boundary</h1>
          <p class="lead">${escapeHtml(p.district_municipality)} District, ${escapeHtml(p.province)}</p>
        </div>
      </div>

      <div class="ward-profile-grid">
        <section class="ward-profile-section">
          <h2>Councillor</h2>
          <div class="detail-facts">
            ${fact('Name', p.councillor_name)}
            ${fact('Party', p.councillor_party)}
            ${fact('Municipality', p.municipality)}
          </div>
        </section>

        <section class="ward-profile-section">
          <h2>Source Status</h2>
          <div class="detail-facts">
            ${fact('Boundary source', p.boundary_source)}
            ${fact('Boundary verified', p.boundary_last_verified)}
            ${fact('Councillor verified', p.councillor_last_verified)}
          </div>
        </section>
      </div>

      <div class="source-note">
        <strong>Independent civic-awareness record</strong>
        <p>This ward card is generated from the same ward feature used in the explorer. Settlement aliases, Gazette joins, and richer source confidence will populate this card as the Limpopo data model expands.</p>
        <a href="${escapeHtml(p.councillor_source_url || SOURCE_URL)}" rel="nofollow noopener" target="_blank">Open councillor source</a>
      </div>

      <div class="panel-actions">
        <a class="button" href="/map" data-link>Open interactive explorer</a>
        <a class="button secondary" href="/sources" data-link>View sources</a>
      </div>
    </article>
  `;
}

function fact(label, value) {
  return `<div class="fact"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function bindExplorerEvents() {
  document.getElementById('ward-search')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    updateExplorer();
  });

  document.getElementById('clear-search')?.addEventListener('click', () => {
    state.query = '';
    updateExplorer();
  });

  document.querySelectorAll('[data-party]').forEach((button) => {
    button.addEventListener('click', () => {
      state.party = button.dataset.party;
      updateExplorer();
    });
  });

  document.querySelectorAll('[data-ward]').forEach((button) => {
    button.addEventListener('click', () => {
      selectWard(Number(button.dataset.ward), false, true);
    });
  });

}

async function createGoogleMapTilesLayer(mapType = 'roadmap') {
  const apiKey = config.googleMapsApiKey;
  if (!apiKey) return null;

  const cacheKey = `${mapType}:ZA`;
  if (!state.googleTileSession || state.googleTileSession.cacheKey !== cacheKey) {
    const response = await fetch(`https://tile.googleapis.com/v1/createSession?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mapType,
        language: 'en-US',
        region: 'ZA',
        scale: 'scaleFactor1x'
      })
    });
    if (!response.ok) throw new Error(`Google Map Tiles session failed: ${response.status}`);
    state.googleTileSession = { cacheKey, ...(await response.json()) };
  }

  const session = encodeURIComponent(state.googleTileSession.session);
  const key = encodeURIComponent(apiKey);
  return L.tileLayer(`https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${session}&key=${key}`, {
    maxZoom: 22,
    attribution: 'Map data &copy; Google'
  });
}

function updateExplorer() {
  renderExplorer(location.pathname).catch(showError);
}

async function initMap(wards, visibleFeatures = wards.features) {
  if (!window.L) {
    document.getElementById('ward-map').innerHTML = '<p class="map-error">The map library could not load. Please try again later.</p>';
    return;
  }

  if (state.map) state.map.remove();
  state.map = L.map('ward-map', { zoomControl: true, scrollWheelZoom: true });
  const basemaps = {
    'Clean civic': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }),
    'Street context': L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }),
    'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    })
  };

  try {
    const googleRoadmap = await createGoogleMapTilesLayer('roadmap');
    if (googleRoadmap) basemaps['Google road map'] = googleRoadmap;
  } catch (error) {
    console.warn(error);
  }

  (basemaps['Google road map'] || basemaps['Clean civic']).addTo(state.map);
  L.control.layers(basemaps, null, { position: 'topright', collapsed: true }).addTo(state.map);

  state.layer = L.geoJSON({ type: 'FeatureCollection', features: visibleFeatures }, {
    style: (feature) => styleFeature(feature),
    onEachFeature: (feature, layer) => {
      layer.on('click', () => selectWard(Number(feature.properties.ward_number), false, true));
      layer.bindTooltip(`Ward ${feature.properties.ward_number} - ${feature.properties.councillor_party}`, { sticky: true });
    }
  }).addTo(state.map);

  if (visibleFeatures.length) {
    state.map.fitBounds(state.layer.getBounds(), { padding: [18, 18] });
    highlightSelected();
  }
}

function styleFeature(feature) {
  const selected = Number(feature.properties.ward_number) === Number(state.selectedWard?.properties.ward_number);
  const colors = {
    ANC: '#004f49',
    DA: '#2563eb',
    EFF: '#b91c1c',
    ABC: '#f7bd16'
  };
  const partyColor = colors[feature.properties.councillor_party] || '#64748b';
  return {
    color: selected ? '#101818' : partyColor,
    fillColor: partyColor,
    fillOpacity: selected ? 0.46 : 0.22,
    weight: selected ? 3.2 : 1.45
  };
}

function highlightSelected() {
  if (!state.layer) return;
  state.layer.eachLayer((layer) => {
    layer.setStyle(styleFeature(layer.feature));
    if (Number(layer.feature.properties.ward_number) === Number(state.selectedWard?.properties.ward_number)) layer.bringToFront();
  });
}

function selectWard(wardNumber, updateUrl = false, zoom = false) {
  const feature = state.wards.features.find((item) => Number(item.properties.ward_number) === Number(wardNumber));
  if (!feature) return;
  state.selectedWard = feature;
  document.getElementById('detail-panel').innerHTML = `${wardDetail(feature)}${adSlot('Advertisement in ward detail panel', true)}`;
  document.querySelectorAll('[data-ward]').forEach((button) => {
    button.classList.toggle('selected', Number(button.dataset.ward) === Number(wardNumber));
  });
  highlightSelected();
  if (updateUrl) {
    history.replaceState({}, '', `/wards/${wardNumber}`);
    setSeo(`/wards/${wardNumber}`, `Ward ${wardNumber} in Polokwane Local Municipality with councillor and source information.`);
  }
  if (zoom) zoomToSelected();
}

function zoomToSelected() {
  if (!state.layer || !state.selectedWard || !state.map) return;
  state.layer.eachLayer((layer) => {
    if (Number(layer.feature.properties.ward_number) === Number(state.selectedWard.properties.ward_number)) {
      state.map.fitBounds(layer.getBounds(), { padding: [32, 32], maxZoom: 14 });
    }
  });
}

function simplePage(path, title, body, description = DESCRIPTION) {
  render(html`
    <section class="content-page">
      <p class="eyebrow">MyWard Limpopo</p>
      <h1>${escapeHtml(title)}</h1>
      <div class="prose-block">${body}</div>
    </section>
  `, path, description);
}

function renderSources(path) {
  simplePage(path, 'Sources', html`
    <p>Ward boundaries are filtered from the Municipal Demarcation Board ward GeoJSON held for this project.</p>
    <p>Current Polokwane councillor records are scraped from <a href="${SOURCE_URL}" rel="nofollow noopener" target="_blank">Polokwane Municipality's ward councillors page</a>.</p>
    <p>The TerriaMap pilot init file is available at <a href="${TERRIA_INIT_URL}">${TERRIA_INIT_URL}</a>.</p>
  `, 'Data sources for MyWard Limpopo ward boundaries, councillors, and TerriaMap catalog configuration.');
}

function renderAbout(path) {
  simplePage(path, 'About', html`
    <p>${escapeHtml(DESCRIPTION)}</p>
    <p>This frontend slice uses the existing Polokwane dataset while the broader Limpopo data pipeline is prepared separately.</p>
  `);
}

function renderDisclaimer(path) {
  simplePage(path, 'Disclaimer', `<p>${escapeHtml(DISCLAIMER)} Users should verify official matters with the relevant public body.</p>`);
}

function renderPrivacy(path) {
  simplePage(path, 'Privacy policy', html`
    <p>MyWard Limpopo does not provide user accounts or collect user-submitted civic profiles.</p>
    <p>Advertising and analytics may be added in aggregate form. Browser controls can be used to manage cookies.</p>
  `);
}

async function renderWardPage(path) {
  const wardNumber = Number(path.split('/').pop());
  const wards = await loadWards();
  const feature = wards.features.find((item) => Number(item.properties.ward_number) === wardNumber);

  if (!feature) {
    simplePage(path, 'Ward not found', `<p>No Polokwane Ward ${escapeHtml(wardNumber)} record was found.</p>`);
    return;
  }

  state.selectedWard = feature;
  render(html`
    <section class="ward-page">
      ${wardProfileCard(feature)}
      ${adSlot('Advertisement below ward profile')}
    </section>
  `, path, `Ward ${wardNumber} in Polokwane Local Municipality with councillor, party, boundary source, and verification information.`);
}

async function navigate(path) {
  const cleanPath = path.replace(/\/$/, '') || '/';
  if (cleanPath === '/' || cleanPath === '/map') {
    await renderExplorer(cleanPath);
    return;
  }
  if (cleanPath.startsWith('/wards/')) {
    await renderWardPage(cleanPath);
    return;
  }
  const routes = {
    '/sources': renderSources,
    '/about': renderAbout,
    '/disclaimer': renderDisclaimer,
    '/privacy': renderPrivacy
  };
  (routes[cleanPath] || renderAbout)(cleanPath);
}

function showError(error) {
  console.error(error);
  render(`<section class="content-page"><h1>Something went wrong</h1><p>${escapeHtml(error.message)}</p></section>`, location.pathname);
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-link]');
  if (!link) return;
  event.preventDefault();
  const path = new URL(link.href).pathname;
  history.pushState({}, '', path);
  document.getElementById('site-menu')?.classList.remove('open');
  document.querySelector('.menu-button')?.setAttribute('aria-expanded', 'false');
  navigate(path).catch(showError);
});

window.addEventListener('popstate', () => navigate(location.pathname).catch(showError));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js'));
}

navigate(location.pathname).catch(showError);
