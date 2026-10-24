/**
 * AapdaSetu - Tactical Leaflet Map Controller
 * 
 * Renders live OpenStreetMap tiles with custom SVG hazard & shelter markers,
 * pulse animations, coordinate geolocation, region quick-jumps,
 * and an offline SVG-tactical fallback if CDN or tiles are unreachable.
 */

const AapdaMap = (function () {
  'use strict';

  let mapInstance = null;
  let markersLayer = null;
  let currentMarkers = {};
  let onSelectCallback = null;
  let onMapClickCallback = null;
  let tempClickMarker = null;

  // Regional coordinates center & zoom presets across India
  const REGION_PRESETS = {
    'all': { center: [22.9734, 78.6569], zoom: 5 },
    'assam': { center: [26.2006, 92.9376], zoom: 8 },
    'odisha': { center: [20.4625, 85.8828], zoom: 8 },
    'himachal': { center: [31.6700, 77.0540], zoom: 8 },
    'kerala': { center: [11.5360, 76.1320], zoom: 9 },
    'delhi ncr': { center: [28.6670, 77.2340], zoom: 11 }
  };

  /**
   * Create custom SVG Leaflet icon
   */
  function createCustomIcon(category, priorityTier, isSelected) {
    const isHazard = (category || '').toLowerCase() === 'hazard';
    const bgClass = isHazard ? 'marker-hazard' : 'marker-shelter';
    const activeClass = isSelected ? 'marker-selected' : '';
    const pulseClass = (priorityTier === 'CRITICAL' && isHazard) ? 'marker-pulsing' : '';

    const iconHtml = `
      <div class="custom-map-pin ${bgClass} ${activeClass} ${pulseClass}">
        ${isHazard
          ? `<svg viewBox="0 0 24 24" class="pin-svg"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 7v6M12 16.5v.5" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`
          : `<svg viewBox="0 0 24 24" class="pin-svg"><path d="M12 3L2 12h3v8h14v-8h3L12 3z" fill="currentColor"/><path d="M10 13h4M12 11v4" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`
        }
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'leaflet-custom-div-icon',
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -18]
    });
  }

  /**
   * Initialize Leaflet map
   */
  function init(containerId, options) {
    options = options || {};
    onSelectCallback = options.onPinSelect || null;
    onMapClickCallback = options.onMapClick || null;

    const container = document.getElementById(containerId);
    if (!container) return;

    // Check if Leaflet L is loaded
    if (typeof L === 'undefined') {
      renderTacticalFallback(container);
      return;
    }

    try {
      // Default view centered on Assam (matching the screenshot reference)
      mapInstance = L.map(containerId, {
        zoomControl: true,
        attributionControl: true
      }).setView([26.2006, 92.9376], 8);

      // Add high-clarity OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors | AapdaSetu OS 2.0'
      }).addTo(mapInstance);

      markersLayer = L.layerGroup().addTo(mapInstance);

      // Listen for map clicks (for adding field SOS coordinates)
      mapInstance.on('click', function (e) {
        const lat = +e.latlng.lat.toFixed(4);
        const lng = +e.latlng.lng.toFixed(4);

        if (tempClickMarker) {
          mapInstance.removeLayer(tempClickMarker);
        }

        tempClickMarker = L.circleMarker([lat, lng], {
          radius: 8,
          color: '#38bdf8',
          fillColor: '#0284c7',
          fillOpacity: 0.9,
          weight: 2
        }).addTo(mapInstance);

        tempClickMarker.bindPopup(`<strong>Pinned Location</strong><br>LAT: ${lat}° | LNG: ${lng}°<br><small>Ready to inject in SOS Form</small>`).openPopup();

        if (typeof onMapClickCallback === 'function') {
          onMapClickCallback({ lat: lat, lng: lng });
        }
      });

    } catch (err) {
      console.error('Error initializing Leaflet:', err);
      renderTacticalFallback(container);
    }
  }

  /**
   * Render markers on the map
   */
  function renderMarkers(incidents, selectedId) {
    if (!mapInstance || !markersLayer) {
      // Fallback offline renderer
      const fallbackContainer = document.getElementById('tactical-grid-pins');
      if (fallbackContainer) {
        fallbackContainer.innerHTML = incidents.map(inc => `
          <div class="tactical-grid-card ${inc.id === selectedId ? 'tactical-selected' : ''}" 
               onclick="window.AapdaApp.selectIncident('${inc.id}')">
            <span class="fallback-dot ${inc.category === 'hazard' ? 'dot-hazard' : 'dot-shelter'}"></span>
            <div class="fallback-card-info">
              <strong>${inc.title}</strong>
              <small>📍 ${inc.sector} | LAT: ${inc.lat}° LNG: ${inc.lng}°</small>
            </div>
            <span class="fallback-badge-tier ${inc.badgeClass || ''}">${inc.priorityTier || 'NORMAL'}</span>
          </div>
        `).join('');
      }
      return;
    }

    markersLayer.clearLayers();
    currentMarkers = {};

    incidents.forEach(function (inc) {
      if (!inc.lat || !inc.lng) return;

      const isSelected = inc.id === selectedId;
      const icon = createCustomIcon(inc.category, inc.priorityTier, isSelected);

      const marker = L.marker([inc.lat, inc.lng], { icon: icon });

      const popupContent = `
        <div class="map-popup-card">
          <div class="popup-header">
            <span class="popup-tag ${inc.category === 'hazard' ? 'tag-hazard' : 'tag-shelter'}">${inc.type}</span>
            <span class="popup-urgency ${inc.badgeClass || ''}">${inc.priorityTier || 'NORMAL'} (${inc.aiScore || 0}%)</span>
          </div>
          <h4 class="popup-title">${inc.title}</h4>
          <p class="popup-sector">📍 ${inc.sector}</p>
          <div class="popup-meta">
            <span>Status: <strong>${inc.status}</strong></span>
            <span>Affected: <strong>${inc.peopleAffected}</strong></span>
          </div>
          <button class="popup-inspect-btn" onclick="window.AapdaApp.selectIncident('${inc.id}')">Inspect Telemetry →</button>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280, className: 'aapdasetu-popup' });

      marker.on('click', function () {
        if (typeof onSelectCallback === 'function') {
          onSelectCallback(inc.id);
        }
      });

      marker.addTo(markersLayer);
      currentMarkers[inc.id] = marker;
    });
  }

  /**
   * Smooth fly/pan to specific coordinates
   */
  function flyToIncident(inc) {
    if (!mapInstance || !inc.lat || !inc.lng) return;
    mapInstance.flyTo([inc.lat, inc.lng], Math.max(mapInstance.getZoom(), 10), {
      duration: 1.2
    });

    if (currentMarkers[inc.id]) {
      currentMarkers[inc.id].openPopup();
    }
  }

  /**
   * Quick jump to predefined Indian disaster sectors
   */
  function flyToRegion(regionKey) {
    if (!mapInstance) return;
    const key = (regionKey || '').toLowerCase().trim();
    const preset = REGION_PRESETS[key] || REGION_PRESETS['all'];
    mapInstance.flyTo(preset.center, preset.zoom, { duration: 1.4 });
  }

  /**
   * Fallback visual canvas when Leaflet or network CDN is unreachable
   */
  function renderTacticalFallback(container) {
    container.innerHTML = `
      <div class="tactical-fallback-screen">
        <div class="fallback-header">
          <span class="fallback-badge">OFFLINE / AIR-GAPPED TACTICAL VIEW</span>
          <h3>AapdaSetu Tactical Grid Display</h3>
          <p>Leaflet tiles loading or offline fallback active. Vector telemetry markers plotted below:</p>
        </div>
        <div class="tactical-grid-display" id="tactical-grid-pins">
          <!-- Rendered via JS -->
        </div>
      </div>
    `;
  }

  return {
    init: init,
    renderMarkers: renderMarkers,
    flyToIncident: flyToIncident,
    flyToRegion: flyToRegion,
    REGION_PRESETS: REGION_PRESETS
  };
})();

// Export for Node or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AapdaMap;
}
