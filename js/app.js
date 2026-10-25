/**
 * AapdaSetu - Main Application Controller
 * Connects UI, Leaflet Map, Priority Engine, and Ingestion Data Store
 */

window.AapdaApp = (function () {
  'use strict';

  let incidents = [];
  let selectedIncidentId = 'inc-001';
  let activeFilter = 'all';
  let searchQuery = '';
  let activeRegion = 'Assam';
  let currentView = 'map'; // 'map' or 'rumor'

  // DOM Elements
  let elements = {};

  function init() {
    cacheDomElements();
    loadData();
    initMap();
    bindEvents();
    renderAll();
  }

  function cacheDomElements() {
    elements = {
      // Ingestion feed
      streamList: document.getElementById('ingestion-stream-list'),
      pinCountBadge: document.getElementById('active-pin-count'),
      sectorLabel: document.getElementById('active-sector-label'),
      filterTabs: document.querySelectorAll('.filter-pill'),

      // Search & Jump
      searchInput: document.getElementById('search-input'),
      btnSearchGo: document.getElementById('btn-search-go'),
      quickJumps: document.querySelectorAll('.quick-jump-tag'),

      // Telemetry & Co-Pilot
      telemetryPanel: document.getElementById('telemetry-details-container'),

      // Buttons & Modals
      btnInjectSos: document.getElementById('btn-inject-sos'),
      btnTriggerScan: document.getElementById('btn-trigger-scan'),
      btnOfflineSms: document.getElementById('btn-offline-sms'),
      btnResetData: document.getElementById('btn-reset-data'),
      btnExplainAi: document.getElementById('btn-explain-ai'),

      // Modals
      sosModal: document.getElementById('sos-modal'),
      closeSosModal: document.getElementById('close-sos-modal'),
      sosForm: document.getElementById('sos-form'),
      smsModal: document.getElementById('sms-modal'),
      closeSmsModal: document.getElementById('close-sms-modal'),
      explainModal: document.getElementById('explain-modal'),
      closeExplainModal: document.getElementById('close-explain-modal'),

      // Form Preview elements
      previewScore: document.getElementById('preview-ai-score'),
      previewTier: document.getElementById('preview-ai-tier'),
      previewBreakdown: document.getElementById('preview-ai-breakdown'),

      // Toast notification container
      toastContainer: document.getElementById('toast-container')
    };
  }

  function loadData() {
    incidents = IncidentDataStore.getAll();
    if (!incidents.find(i => i.id === selectedIncidentId) && incidents.length > 0) {
      selectedIncidentId = incidents[0].id;
    }
  }

  function initMap() {
    AapdaMap.init('osm-map-container', {
      onPinSelect: function (id) {
        selectIncident(id);
      },
      onMapClick: function (coords) {
        // If SOS form is open or clicked, fill in coordinates
        const latInput = document.getElementById('sos-lat');
        const lngInput = document.getElementById('sos-lng');
        if (latInput && lngInput) {
          latInput.value = coords.lat;
          lngInput.value = coords.lng;
          showToast(`Map location picked: ${coords.lat}°, ${coords.lng}°`, 'info');
          updateLiveFormAiPreview();
        }
      }
    });
  }

  function bindEvents() {
    // Filter pill tabs
    if (elements.filterTabs) {
      elements.filterTabs.forEach(tab => {
        tab.addEventListener('click', function () {
          elements.filterTabs.forEach(t => t.classList.remove('active'));
          this.classList.add('active');
          activeFilter = this.getAttribute('data-filter') || 'all';
          renderIngestionStream();
          renderMapMarkers();
        });
      });
    }

    // Search bar
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', function (e) {
        searchQuery = (e.target.value || '').toLowerCase().trim();
        renderIngestionStream();
        renderMapMarkers();
      });

      elements.searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSearchJump(this.value);
        }
      });
    }

    // Search Go Button
    if (elements.btnSearchGo) {
      elements.btnSearchGo.addEventListener('click', function () {
        if (elements.searchInput) {
          handleSearchJump(elements.searchInput.value);
        }
      });
    }

    // Quick Jump Buttons
    if (elements.quickJumps) {
      elements.quickJumps.forEach(btn => {
        btn.addEventListener('click', function () {
          const region = this.getAttribute('data-region');
          jumpToRegion(region);
        });
      });
    }

    // Modal triggers
    if (elements.btnInjectSos) {
      elements.btnInjectSos.addEventListener('click', () => openModal(elements.sosModal));
    }
    if (elements.closeSosModal) {
      elements.closeSosModal.addEventListener('click', () => closeModal(elements.sosModal));
    }

    if (elements.btnOfflineSms) {
      elements.btnOfflineSms.addEventListener('click', () => openModal(elements.smsModal));
    }
    if (elements.closeSmsModal) {
      elements.closeSmsModal.addEventListener('click', () => closeModal(elements.smsModal));
    }

    if (elements.btnExplainAi) {
      elements.btnExplainAi.addEventListener('click', () => openModal(elements.explainModal));
    }
    if (elements.closeExplainModal) {
      elements.closeExplainModal.addEventListener('click', () => closeModal(elements.explainModal));
    }

    // Background click to close modals
    [elements.sosModal, elements.smsModal, elements.explainModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', function (e) {
          if (e.target === this) closeModal(this);
        });
      }
    });

    // Reset Data
    if (elements.btnResetData) {
      elements.btnResetData.addEventListener('click', function () {
        if (confirm('Reset to standard simulated demo incidents?')) {
          incidents = IncidentDataStore.resetToDefaults();
          selectedIncidentId = incidents[0].id;
          renderAll();
          showToast('Database reset to standard simulated demo state.', 'info');
        }
      });
    }

    // Trigger Simulation Scan
    if (elements.btnTriggerScan) {
      elements.btnTriggerScan.addEventListener('click', function () {
        const btn = this;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-inline"></span> Scanning Sensors...`;
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = `⚡ Trigger Simulation Scan`;
          showToast('[Telemetry Scan] 14 ground river gauges & SDRF mesh channels synced. No new high-level anomalies.', 'success');
        }, 1200);
      });
    }

    // Live AI calculation on SOS form changes
    if (elements.sosForm) {
      elements.sosForm.addEventListener('input', updateLiveFormAiPreview);
      elements.sosForm.addEventListener('change', updateLiveFormAiPreview);
      elements.sosForm.addEventListener('submit', handleSosFormSubmit);
    }
  }

  function jumpToRegion(region) {
    activeRegion = region;
    if (elements.searchInput) elements.searchInput.value = region;

    // Highlight the active quick jump button
    if (elements.quickJumps) {
      elements.quickJumps.forEach(btn => {
        const btnReg = btn.getAttribute('data-region') || '';
        if (btnReg.toLowerCase() === region.toLowerCase()) {
          btn.classList.add('active-jump');
        } else {
          btn.classList.remove('active-jump');
        }
      });
    }

    // Find the primary incident representing this region
    const regionIncident = incidents.find(i => 
      (i.region && i.region.toLowerCase() === region.toLowerCase()) ||
      (i.sector && i.sector.toLowerCase().includes(region.toLowerCase()))
    );

    if (regionIncident) {
      selectedIncidentId = regionIncident.id;
      if (elements.sectorLabel) {
        elements.sectorLabel.textContent = `Sector: ${regionIncident.sector}`;
      }
    } else {
      if (elements.sectorLabel) {
        elements.sectorLabel.textContent = `Sector: ${region} Operations Zone`;
      }
    }

    // Fly camera on Leaflet map
    AapdaMap.flyToRegion(region);

    // Re-render ALL panels so telemetry and feed immediately update!
    renderAll();

    showToast(`Navigated to ${region} Disaster Sector (Telemetry synced)`, 'info');
  }

  async function handleSearchJump(query) {
    if (!query || !query.trim()) return;
    const raw = query.trim();
    const q = raw.toLowerCase();

    // 1. Direct match in built-in Indian geography dictionary
    for (const key of Object.keys(AapdaMap.REGION_PRESETS)) {
      if (key !== 'all' && (q === key || q.includes(key) || key.includes(q))) {
        jumpToRegion(key.charAt(0).toUpperCase() + key.slice(1));
        return;
      }
    }

    // 2. Match in local incidents dataset
    const found = incidents.find(i => 
      (i.title && i.title.toLowerCase().includes(q)) || 
      (i.sector && i.sector.toLowerCase().includes(q)) || 
      (i.region && i.region.toLowerCase().includes(q))
    );
    if (found) {
      selectedIncidentId = found.id;
      activeRegion = found.region || 'Assam';
      AapdaMap.flyToIncident(found);
      renderAll();
      showToast(`Found disaster sector: ${found.title}`, 'info');
      return;
    }

    // 3. Dynamic OpenStreetMap Nominatim Geocoding API for ANY Place in India
    try {
      showToast(`Searching OpenStreetMap for "${raw}"...`, 'info');
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=1&q=${encodeURIComponent(raw)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          activeRegion = raw;

          if (elements.sectorLabel) {
            elements.sectorLabel.textContent = `Sector: ${item.display_name.split(',')[0]} (OSM Geocoded)`;
          }

          if (window.AapdaMap && window.AapdaMap.map) {
            window.AapdaMap.map.flyTo([lat, lon], 12, { duration: 1.4 });

            // Drop a search marker
            const searchIcon = L.divIcon({
              html: `<div style="width:24px;height:24px;background:#2563eb;border:2px solid #fff;border-radius:50%;box-shadow:0 0 14px #2563eb;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;">📍</div>`,
              className: 'search-pin-active',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });
            L.marker([lat, lon], { icon: searchIcon })
              .addTo(window.AapdaMap.map)
              .bindPopup(`<strong>Searched Place:</strong><br>${item.display_name}`)
              .openPopup();
          }

          showToast(`[OSM Search] Focused map on "${raw}" (${lat.toFixed(3)}°, ${lon.toFixed(3)}°)`, 'success');
          return;
        }
      }
    } catch (err) {
      console.warn('OSM Geocoding fetch error:', err);
    }

    showToast(`Could not locate "${raw}". Try major regions like Mumbai, Wayanad, Odisha, or Delhi.`, 'info');
  }

  function getFilteredIncidents() {
    const list = incidents.filter(inc => {
      // Category / Status Filter
      if (activeFilter === 'hazard' && inc.category !== 'hazard') return false;
      if (activeFilter === 'shelter' && inc.category !== 'shelter') return false;
      if (activeFilter === 'verified' && inc.status !== 'Verified') return false;
      if (activeFilter === 'pending' && inc.status !== 'Reported') return false;
      if (activeFilter === 'resolved' && inc.status !== 'Resolved') return false;
      if (activeFilter === 'critical' && inc.priorityTier !== 'CRITICAL') return false;

      // Text search
      if (searchQuery) {
        const hay = `${inc.title} ${inc.sector} ${inc.region} ${inc.type} ${inc.rawExtract}`.toLowerCase();
        if (!hay.includes(searchQuery)) return false;
      }

      return true;
    });

    // If a region is active, prioritize its incidents at the top
    if (activeRegion && activeRegion.toLowerCase() !== 'all') {
      const regLow = activeRegion.toLowerCase();
      list.sort((a, b) => {
        const aMatches = (a.region && a.region.toLowerCase() === regLow) || (a.sector && a.sector.toLowerCase().includes(regLow));
        const bMatches = (b.region && b.region.toLowerCase() === regLow) || (b.sector && b.sector.toLowerCase().includes(regLow));
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    }

    return list;
  }

  function switchView(viewName) {
    currentView = viewName;
    const mapGrid = document.querySelector('.command-grid-layout');
    const rumorWorkspace = document.getElementById('rumor-detector-workspace');
    const tabMap = document.getElementById('view-tab-map');
    const tabRumor = document.getElementById('view-tab-rumor');

    if (viewName === 'rumor') {
      if (mapGrid) mapGrid.style.display = 'none';
      if (rumorWorkspace) rumorWorkspace.style.display = 'flex';
      if (tabMap) tabMap.classList.remove('active');
      if (tabRumor) tabRumor.classList.add('active');

      if (window.RumorDetector && typeof window.RumorDetector.render === 'function') {
        window.RumorDetector.render();
      }
      showToast('Switched to Rumor & Duplicate Alert Detector Workspace', 'info');
    } else {
      if (rumorWorkspace) rumorWorkspace.style.display = 'none';
      if (mapGrid) mapGrid.style.display = 'grid';
      if (tabRumor) tabRumor.classList.remove('active');
      if (tabMap) tabMap.classList.add('active');

      renderAll();
      showToast('Switched to Operational Incident Command Map', 'info');
    }
  }

  function renderAll() {
    renderIngestionStream();
    renderMapMarkers();
    renderTelemetryDetails();
  }

  /**
   * Render Left Column: 1. INGESTION STREAM
   */
  function renderIngestionStream() {
    if (!elements.streamList) return;

    const filtered = getFilteredIncidents();
    if (elements.pinCountBadge) {
      elements.pinCountBadge.textContent = `${filtered.length} Pins`;
    }
    const statusPinEl = document.getElementById('status-pin-count');
    if (statusPinEl) {
      statusPinEl.textContent = filtered.length;
    }

    if (filtered.length === 0) {
      elements.streamList.innerHTML = `
        <div class="empty-stream-state">
          <p>No incidents match the active filter <em>"${activeFilter}"</em>.</p>
          <button class="btn-text-action" onclick="window.AapdaApp.resetFilter()">Clear Filters</button>
        </div>
      `;
      return;
    }

    let html = '';
    filtered.forEach(inc => {
      const isSelected = inc.id === selectedIncidentId;
      const isHazard = inc.category === 'hazard';

      // Status pill styling
      let statusIcon = '⏳';
      let statusLabel = 'Reported';
      let statusClass = 'status-reported';
      if (inc.status === 'Verified') {
        statusIcon = '✓';
        statusLabel = 'Verified';
        statusClass = 'status-verified';
      } else if (inc.status === 'Resolved') {
        statusIcon = '✓';
        statusLabel = 'Resolved';
        statusClass = 'status-resolved';
      }

      html += `
        <article class="ingestion-card ${isSelected ? 'active-card' : ''}" 
                 onclick="window.AapdaApp.selectIncident('${inc.id}')">
          <div class="card-top-bar">
            <span class="badge-category ${isHazard ? 'cat-hazard' : 'cat-shelter'}">
              ${isHazard ? 'HAZARD' : 'SHELTER'}
            </span>
            <span class="card-conf ${inc.badgeClass || ''}">
              ${inc.priorityTier || 'NORMAL'} • ${inc.aiScore || inc.confidence || 90}%
            </span>
          </div>

          <h3 class="card-title">${escapeHtml(inc.title)}</h3>
          <p class="card-snippet">${escapeHtml(inc.rawExtract || inc.aiAnalysis || '')}</p>

          <div class="card-footer">
            <span class="card-location">📍 ${escapeHtml(inc.sector || inc.region)}</span>
            <span class="card-status-pill ${statusClass}">${statusIcon} ${statusLabel}</span>
          </div>
        </article>
      `;
    });

    elements.streamList.innerHTML = html;
  }

  /**
   * Render Center Leaflet Map Pins
   */
  function renderMapMarkers() {
    const filtered = getFilteredIncidents();
    AapdaMap.renderMarkers(filtered, selectedIncidentId);
  }

  /**
   * Render Right Column: 2. GRANULAR TELEMETRY & CO-PILOT
   */
  function renderTelemetryDetails() {
    if (!elements.telemetryPanel) return;

    const inc = incidents.find(i => i.id === selectedIncidentId);
    if (!inc) {
      elements.telemetryPanel.innerHTML = `
        <div class="telemetry-empty-state">
          <p>Select any pin or stream card to inspect live telemetry and AI Co-Pilot overrides.</p>
        </div>
      `;
      return;
    }

    const isHazard = inc.category === 'hazard';
    const breakdown = inc.breakdown || {};

    let html = `
      <div class="telemetry-content-wrapper">
        <!-- Top Priority Header -->
        <div class="copilot-priority-header">
          <div class="priority-badges-row">
            <span class="copilot-urgency-badge ${inc.badgeClass || 'badge-moderate'}">
              ${inc.priorityTier || 'MODERATE'}
            </span>
            <span class="copilot-conf-score">
              AI Urgency: <strong>${inc.aiScore || 85}%</strong> (Conf: ${inc.confidence || 95}%)
            </span>
          </div>
          <h2 class="copilot-incident-title">${escapeHtml(inc.title)}</h2>
          <div class="copilot-location-bar">
            <span>📍 ${escapeHtml(inc.sector)}</span>
            <span class="copilot-status-badge status-${(inc.status || '').toLowerCase()}">
              Status: ${inc.status}
            </span>
          </div>
        </div>

        <!-- Section: Affected Hazard Telemetry -->
        <section class="telemetry-block telemetry-metrics-box">
          <h3 class="telemetry-heading">
            ${isHazard ? '⚠️ AFFECTED HAZARD TELEMETRY' : '🏕️ RELIEF CAMP TELEMETRY & RESOURCES'}
          </h3>

          <div class="telemetry-grid">
            ${isHazard ? `
              <div class="metric-cell">
                <span class="metric-label">Water / Hazard Level</span>
                <span class="metric-value highlight-danger">${inc.telemetry.waterLevel || '+2.4m Over Danger'}</span>
              </div>
              <div class="metric-cell">
                <span class="metric-label">Flow / Slope Rate</span>
                <span class="metric-value">${inc.telemetry.flowRate || 'Rapid / High Risk'}</span>
              </div>
              <div class="metric-cell">
                <span class="metric-label">NDRF / SDRF Unit</span>
                <span class="metric-value">${inc.telemetry.ndrfTeam || 'Deployed (Boat Unit)'}</span>
              </div>
              <div class="metric-cell">
                <span class="metric-label">Traffic Impact</span>
                <span class="metric-value highlight-warning">${inc.telemetry.trafficImpact || 'Fully Blocked'}</span>
              </div>
            ` : `
              <div class="metric-cell">
                <span class="metric-label">Camp Capacity</span>
                <span class="metric-value highlight-safe">${inc.telemetry.shelterCapacity || '650 / 800 Occupants'}</span>
              </div>
              <div class="metric-cell">
                <span class="metric-label">Medical Staff</span>
                <span class="metric-value">${inc.telemetry.medicalStaff || '3 Doctors, 6 Nurses'}</span>
              </div>
              <div class="metric-cell">
                <span class="metric-label">Rations Inventory</span>
                <span class="metric-value">${inc.telemetry.rationSupply || '4 Days Stock'}</span>
              </div>
              <div class="metric-cell">
                <span class="metric-label">Power & Clean Water</span>
                <span class="metric-value">${inc.telemetry.backupPower || 'Solar Inverter Active'}</span>
              </div>
            `}
          </div>

          <!-- Overall Severity / Urgency Progress Bar -->
          <div class="severity-progress-section">
            <div class="progress-labels">
              <span>Urgency Index: <strong>${inc.priorityTier} (${inc.aiScore}%)</strong></span>
              <span>People Affected: <strong>${inc.peopleAffected}</strong></span>
            </div>
            <div class="severity-track">
              <div class="severity-fill ${inc.badgeClass || ''}" style="width: ${inc.aiScore}%;"></div>
            </div>
          </div>
        </section>

        <!-- Section: Explainable AI Rescue Priority Breakdown -->
        <section class="telemetry-block xai-engine-box">
          <div class="xai-header">
            <h3 class="telemetry-heading">🧠 AI RESCUE PRIORITY ENGINE (EXPLAINABLE)</h3>
            <button class="btn-micro-info" onclick="window.AapdaApp.openExplainModal()" title="View formula math">Formula ℹ️</button>
          </div>

          <div class="xai-factors-grid">
            <div class="xai-factor-card">
              <div class="xai-factor-info">
                <span>Disaster Severity (35% wt)</span>
                <strong>${breakdown.severity ? breakdown.severity.contribution : '26.2'} pts</strong>
              </div>
              <div class="mini-bar-track">
                <div class="mini-bar-fill fill-sev" style="width: ${breakdown.severity ? breakdown.severity.raw : 75}%"></div>
              </div>
            </div>

            <div class="xai-factor-card">
              <div class="xai-factor-info">
                <span>Population at Risk (30% wt)</span>
                <strong>${breakdown.population ? breakdown.population.contribution : '27.0'} pts</strong>
              </div>
              <div class="mini-bar-track">
                <div class="mini-bar-fill fill-pop" style="width: ${breakdown.population ? breakdown.population.raw : 90}%"></div>
              </div>
            </div>

            <div class="xai-factor-card">
              <div class="xai-factor-info">
                <span>Medical Access (20% wt)</span>
                <strong>${breakdown.medical ? breakdown.medical.contribution : '20.0'} pts</strong>
              </div>
              <div class="mini-bar-track">
                <div class="mini-bar-fill fill-med" style="width: ${breakdown.medical ? breakdown.medical.raw : 100}%"></div>
              </div>
            </div>

            <div class="xai-factor-card">
              <div class="xai-factor-info">
                <span>Source Trust (15% wt)</span>
                <strong>${breakdown.source ? breakdown.source.contribution : '15.0'} pts</strong>
              </div>
              <div class="mini-bar-track">
                <div class="mini-bar-fill fill-src" style="width: ${breakdown.source ? breakdown.source.raw : 100}%"></div>
              </div>
            </div>
          </div>

          <p class="xai-formula-text">
            <code>${escapeHtml(inc.formulaExplanation || 'UrgencyScore = (35%×Severity) + (30%×Population) + (20%×Medical) + (15%×Source)')}</code>
          </p>
        </section>

        <!-- Section: TinyFish Raw Extract (Screenshot Yellow Box) -->
        <section class="telemetry-block extract-box-yellow">
          <span class="box-tag-label">TINYFISH RAW EXTRACT</span>
          <p class="extract-text">"${escapeHtml(inc.rawExtract)}"</p>
        </section>

        <!-- Section: Gemini + OSM Intelligence (Screenshot Cyan Box) -->
        <section class="telemetry-block intelligence-box-cyan">
          <span class="box-tag-label">GEMINI + OSM INTELLIGENCE CO-PILOT</span>
          <p class="intelligence-text">${escapeHtml(inc.aiAnalysis || inc.tacticalRecommendation || 'NDRF unit actively staging perimeter containment.')}</p>
          <div class="intelligence-coords">
            LAT: <strong>${inc.lat ? inc.lat.toFixed(3) : '26.219'}°</strong> | LNG: <strong>${inc.lng ? inc.lng.toFixed(3) : '92.956'}°</strong>
          </div>
        </section>

        <!-- Section: SDMA Co-Pilot Action Controls -->
        <section class="telemetry-block actions-block">
          <span class="box-tag-label">SDMA CO-PILOT CONTROLS</span>
          <div class="action-buttons-grid">
            ${inc.status !== 'Verified' ? `
              <button class="btn-copilot btn-verify" onclick="window.AapdaApp.changeStatus('${inc.id}', 'Verified')">
                ✓ Verify Pin
              </button>
            ` : `
              <button class="btn-copilot btn-verified-badge" disabled>
                ✓ Verified by SDMA
              </button>
            `}

            ${inc.status !== 'Resolved' ? `
              <button class="btn-copilot btn-resolve" onclick="window.AapdaApp.changeStatus('${inc.id}', 'Resolved')">
                ✕ Mark Resolved
              </button>
            ` : `
              <button class="btn-copilot btn-reopen" onclick="window.AapdaApp.changeStatus('${inc.id}', 'Reported')">
                ↺ Reopen Incident
              </button>
            `}
          </div>

          <div class="action-secondary-row">
            <button class="btn-secondary-action" onclick="window.AapdaApp.panToSelected('${inc.id}')">
              📍 Center on Map
            </button>
            <button class="btn-secondary-action" onclick="window.AapdaApp.copySitRep('${inc.id}')">
              📋 Copy SitRep Summary
            </button>
          </div>
        </section>
      </div>
    `;

    elements.telemetryPanel.innerHTML = html;
  }

  function selectIncident(id) {
    selectedIncidentId = id;
    renderIngestionStream();
    renderTelemetryDetails();

    const inc = incidents.find(i => i.id === id);
    if (inc) {
      AapdaMap.flyToIncident(inc);
    }
  }

  function changeStatus(id, newStatus) {
    const inc = incidents.find(i => i.id === id);
    if (!inc) return;

    inc.status = newStatus;
    IncidentDataStore.saveAll(incidents);

    renderIngestionStream();
    renderMapMarkers();
    renderTelemetryDetails();

    showToast(`Incident "${inc.title}" marked as ${newStatus}.`, 'success');
  }

  function panToSelected(id) {
    const inc = incidents.find(i => i.id === id);
    if (inc) {
      AapdaMap.flyToIncident(inc);
      showToast(`Camera centered on ${inc.sector}`, 'info');
    }
  }

  function copySitRep(id) {
    const inc = incidents.find(i => i.id === id);
    if (!inc) return;

    const text = `[AapdaSetu SITREP]
Incident: ${inc.title}
Sector: ${inc.sector} (LAT: ${inc.lat}, LNG: ${inc.lng})
Priority: ${inc.priorityTier} (${inc.aiScore}%)
Status: ${inc.status}
Affected Population: ${inc.peopleAffected}
Action: ${inc.aiAnalysis || inc.tacticalRecommendation}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('SitRep copied to clipboard!', 'success');
      }).catch(() => {
        fallbackCopyText(text);
      });
    } else {
      fallbackCopyText(text);
    }
  }

  function fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('SitRep copied to clipboard!', 'success');
    } catch (e) {
      alert(text);
    }
    document.body.removeChild(ta);
  }

  /**
   * Real-time calculation as user fills out the SOS Incident form
   */
  function updateLiveFormAiPreview() {
    if (!elements.sosForm) return;

    const severity = elements.sosForm.querySelector('#sos-severity').value;
    const people = parseInt(elements.sosForm.querySelector('#sos-people').value, 10) || 0;
    const medical = elements.sosForm.querySelector('#sos-medical').value;
    const source = elements.sosForm.querySelector('#sos-source').value;

    const calc = PriorityEngine.calculate({
      severity: severity,
      peopleAffected: people,
      medicalAccess: medical,
      sourceReliability: source
    });

    if (elements.previewScore) elements.previewScore.textContent = `${calc.score}%`;
    if (elements.previewTier) {
      elements.previewTier.textContent = calc.tier;
      elements.previewTier.className = `preview-tier-badge ${calc.badgeClass}`;
    }
    if (elements.previewBreakdown) {
      elements.previewBreakdown.textContent = calc.formulaExplanation;
    }
  }

  /**
   * Handle SOS Form Submit
   */
  function handleSosFormSubmit(e) {
    e.preventDefault();

    const form = elements.sosForm;
    const title = form.querySelector('#sos-title').value.trim();
    const sector = form.querySelector('#sos-sector').value.trim();
    const region = form.querySelector('#sos-region').value;
    const type = form.querySelector('#sos-type').value;
    const category = form.querySelector('#sos-category').value;
    const severity = form.querySelector('#sos-severity').value;
    const people = parseInt(form.querySelector('#sos-people').value, 10) || 10;
    const medical = form.querySelector('#sos-medical').value;
    const source = form.querySelector('#sos-source').value;
    const lat = parseFloat(form.querySelector('#sos-lat').value) || 26.200;
    const lng = parseFloat(form.querySelector('#sos-lng').value) || 92.930;
    const description = form.querySelector('#sos-desc').value.trim();

    const newId = 'inc-' + Date.now().toString().slice(-4);

    const newIncident = {
      id: newId,
      title: title || 'Field Emergency Report',
      type: type,
      category: category,
      sector: sector || `${region} Field Sector`,
      region: region,
      lat: lat,
      lng: lng,
      severity: severity,
      peopleAffected: people,
      medicalAccess: medical,
      sourceReliability: source,
      confidence: 91,
      status: 'Reported',
      reportedAt: 'Just now',
      telemetry: {
        waterLevel: severity === 'critical' ? '+2.8m Surging' : '+1.2m Monitored',
        flowRate: severity === 'critical' ? 'High Risk' : 'Moderate',
        ndrfTeam: 'Alert Sent to Control Room',
        trafficImpact: 'Under Assessment'
      },
      rawExtract: description || `Field report logged via Field SOS module: ${type} impacting ~${people} people.`,
      aiAnalysis: `Calculated priority triage for ${sector}. Medical urgency level: ${medical}. Verification required by District Magistrate.`
    };

    const enriched = IncidentDataStore.enrichWithAiScore(newIncident);
    incidents.unshift(enriched);
    IncidentDataStore.saveAll(incidents);

    selectedIncidentId = newId;
    closeModal(elements.sosModal);
    form.reset();

    renderAll();
    AapdaMap.flyToIncident(enriched);

    showToast(`SOS Incident "${enriched.title}" successfully injected into the stream!`, 'success');
  }

  function resetFilter() {
    activeFilter = 'all';
    searchQuery = '';
    if (elements.searchInput) elements.searchInput.value = '';
    if (elements.filterTabs) {
      elements.filterTabs.forEach(t => t.classList.remove('active'));
      elements.filterTabs[0].classList.add('active');
    }
    renderIngestionStream();
    renderMapMarkers();
  }

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('modal-visible');
    document.body.style.overflow = 'hidden';

    // If opening SOS modal, trigger initial calculation
    if (modal === elements.sosModal) {
      updateLiveFormAiPreview();
    }
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('modal-visible');
    document.body.style.overflow = '';
  }

  function showToast(message, type) {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast-pill toast-${type || 'info'}`;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 400);
    }, 3800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Public API
  return {
    init: init,
    selectIncident: selectIncident,
    changeStatus: changeStatus,
    panToSelected: panToSelected,
    copySitRep: copySitRep,
    resetFilter: resetFilter,
    switchView: switchView,
    showToast: showToast,
    openExplainModal: () => openModal(elements.explainModal)
  };
})();

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', function () {
  window.AapdaApp.init();
});
