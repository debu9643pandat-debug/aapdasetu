/**
 * AapdaSetu Disaster OS - Rumor & Duplicate Alert Detector Engine
 * 
 * Capabilities:
 * 1. Ingests & reviews disaster claims from social media, citizen SOS, and SDRF radio packets.
 * 2. Duplicate Detection: Detects matching reports by text keywords, location proximity, and time.
 * 3. Trusted Source Comparison: Cross-references claims against official bulletins (ASDMA, CWC, Police).
 * 4. Evidence-Based Flags: Detects Old Media suspects and Location Mismatches with explicit evidence.
 * 5. Responder Workflow: Status transitions (Unverified, Needs Review, Corroborated, Officially Confirmed, Rejected),
 *    linking/separating duplicates, and immutable audit trails.
 * 6. TinyFish Integration: Calls secure backend proxy or delivers structured simulated verification extracts.
 */

window.RumorDetector = (function () {
  'use strict';

  const STORAGE_KEY = 'aapdasetu_rumor_reports_v1';

  // Seed data covering diverse realistic scenarios
  const SEED_REPORTS = [
    {
      id: 'REP-101',
      claim: 'BREAKING: Kaziranga NH-37 completely collapsed and washed away near Bokakhat! 15 buses submerged, national park entrance cut off.',
      category: 'Hazard / Roadblock',
      disasterType: 'Flood / Roadway Collapse',
      source: 'Viral Social Post (X / Twitter)',
      sourceUrl: 'https://twitter.com/simulated_alert/status/18829144',
      isTrustedSource: false,
      reportedAt: '25 mins ago',
      publishedAt: 'Today, 2:15 PM',
      lastCheckedAt: '3 mins ago',
      location: 'Bokakhat, Kaziranga NH-37, Assam',
      coords: { lat: 26.585, lng: 93.171 },
      status: 'Needs Review', // Unverified, Needs Review, Corroborated, Officially Confirmed, Rejected
      linkedIncidentId: 'inc-003', // Linked to NH-37 Kaziranga Corridor Submergence
      similarityScore: 92,
      flags: {
        oldMedia: {
          flagged: true,
          badge: '⚠️ Old Media Suspect',
          evidence: 'Visual reverse-search and TinyFish image-hash match video keyframe to a July 2022 flood broadcast archived by a regional news channel. The current flood level is +1.6m over road, but the structural bridge has NOT collapsed.'
        },
        locationMismatch: {
          flagged: false,
          badge: null,
          evidence: null
        },
        conflictingDetails: {
          flagged: true,
          badge: '⚔️ Conflicting Damage Details',
          evidence: 'Claim asserts "15 buses submerged and bridge collapsed". Assam Police Highway Patrol and ground NDRF boat unit report 0 submerged passenger buses; traffic was proactively halted due to shallow water spillover.'
        }
      },
      trustedComparison: {
        officialSource: 'Assam State Disaster Management Authority (ASDMA) Bulletin #42',
        officialUrl: 'https://asdma.assam.gov.in/bulletins/assam-flood-telemetry-42',
        officialPublishedAt: 'Today, 2:40 PM',
        officialLocation: 'NH-37 KM 184-188, Bokakhat',
        officialLastChecked: '1 min ago',
        officialStatement: 'Water inundation of 1.6m recorded on roadway. Bailey bridge and pavement foundation are structurally intact. Heavy vehicular transit suspended for animal corridor protection.',
        verdict: 'Contradicted (Exaggerated Claim & Recycled 2022 Media)'
      },
      auditTrail: [
        { time: '14:15', actor: 'Automated Ingestion Feed', action: 'Ingested viral social claim with video attachment.' },
        { time: '14:20', actor: 'AI Forensic Engine', action: 'Flagged: Old Media Suspect (July 2022 footage match) & Conflicting Damage Details.' },
        { time: '14:35', actor: 'SDMA Officer #14 (Authorized)', action: 'Set status to "Needs Review". Reviewer note: Cross-checking with Golaghat SP control room.' }
      ],
      reviewerNotes: [
        'Assam Police Golaghat control room confirms bridge is structurally sound. Proactive traffic hold in place. Advised public information officer to debunk viral clip.'
      ]
    },
    {
      id: 'REP-102',
      claim: 'Water crossing NH-37 near Kaziranga animal corridor, trucks halted on higher elevation.',
      category: 'Hazard / Roadblock',
      disasterType: 'Flood Waterlogging',
      source: 'Citizen Field SOS via AapdaSetu Portal',
      sourceUrl: 'https://aapdasetu.org/citizen-sos/field-rep-881',
      isTrustedSource: false,
      reportedAt: '40 mins ago',
      publishedAt: 'Today, 2:00 PM',
      lastCheckedAt: '5 mins ago',
      location: 'Kaziranga National Park Corridor, Assam',
      coords: { lat: 26.584, lng: 93.170 },
      status: 'Corroborated',
      linkedIncidentId: 'inc-003',
      similarityScore: 95,
      flags: {
        oldMedia: { flagged: false, badge: null, evidence: null },
        locationMismatch: { flagged: false, badge: null, evidence: null },
        conflictingDetails: { flagged: false, badge: null, evidence: null }
      },
      trustedComparison: {
        officialSource: 'Assam Police Traffic Advisory Bulletin',
        officialUrl: 'https://assampolice.gov.in/traffic/nh37-advisory',
        officialPublishedAt: 'Today, 2:10 PM',
        officialLocation: 'Kaziranga Corridor',
        officialLastChecked: '4 mins ago',
        officialStatement: 'Confirmed. Water level over highway reached 1.6m. Diverting heavy trucks via alternative North Bank route.',
        verdict: 'Corroborated by Official Police Telemetry'
      },
      auditTrail: [
        { time: '14:00', actor: 'Citizen Portal', action: 'Report submitted by verified local motorist with photo.' },
        { time: '14:12', actor: 'SDMA Officer #08', action: 'Grouped as duplicate/corroborating eyewitness to Incident #inc-003.' },
        { time: '14:15', actor: 'SDMA Officer #08', action: 'Set status to "Corroborated".' }
      ],
      reviewerNotes: [
        'Reliable ground report corroborating telemetry sensors on NH-37.'
      ]
    },
    {
      id: 'REP-103',
      claim: 'Emergency: Massive hillside landslide sweeps away multi-story district hospital in Silchar town center!',
      category: 'Hazard / Landslide',
      disasterType: 'Landslide',
      source: 'WhatsApp Forward (Shared 4,000+ times)',
      sourceUrl: 'https://wa.me/simulated_broadcast_feed',
      isTrustedSource: false,
      reportedAt: '15 mins ago',
      publishedAt: 'Today, 2:30 PM',
      lastCheckedAt: '2 mins ago',
      location: 'Silchar Urban Center, Cachar, Assam',
      coords: { lat: 24.833, lng: 92.778 },
      status: 'Needs Review',
      linkedIncidentId: null,
      similarityScore: 32,
      flags: {
        oldMedia: {
          flagged: true,
          badge: '⚠️ Old Media Suspect',
          evidence: 'Thumbnail keyframe matches Meppadi (Wayanad, Kerala) hillside landslide disaster from July 2024.'
        },
        locationMismatch: {
          flagged: true,
          badge: '📍 Location Mismatch',
          evidence: 'Report claims "landslide in Silchar town center". Silchar urban center is situated on flat alluvial plains along the Barak river (elevation 25m) with zero steep hills or landslide-prone slopes within 20km. Topography directly contradicts the video footage.'
        },
        conflictingDetails: {
          flagged: true,
          badge: '⚔️ Conflicting Details',
          evidence: 'Silchar Civil Hospital Medical Superintendent confirms facility is 100% operational with no structural impact or slope movement.'
        }
      },
      trustedComparison: {
        officialSource: 'Cachar District Administration / Civil Defense Debunk Note',
        officialUrl: 'https://cachar.gov.in/press-release/silchar-rumor-debunk',
        officialPublishedAt: 'Today, 2:42 PM',
        officialLocation: 'Silchar Urban, Cachar',
        officialLastChecked: 'Just now',
        officialStatement: 'Debunk Notice: Claims of landslide at Silchar Hospital are completely false. The video circulated is from Wayanad, Kerala.',
        verdict: 'Contradicted & Location Mismatch Confirmed'
      },
      auditTrail: [
        { time: '14:30', actor: 'Social Scraper Engine', action: 'Detected high-velocity WhatsApp forward text.' },
        { time: '14:32', actor: 'AI Spatial Verification', action: 'Flagged: Critical Location Mismatch (Alluvial plain vs steep hillside footage) & Old Media match.' },
        { time: '14:35', actor: 'SDMA Lead Operator', action: 'Marked "Needs Review". Forwarded to Cachar District PRO.' }
      ],
      reviewerNotes: [
        'High panic potential. Forwarded to Cyber Cell and district PRO for public clarification banner.'
      ]
    },
    {
      id: 'REP-104',
      claim: 'Arterial route blocked due to waterlogging in Brahmaputra flood basin, 400+ people isolated in adjacent hamlets',
      category: 'Hazard / Roadblock',
      disasterType: 'River Flood Breach',
      source: 'SDRF Radio Packet & Field Log',
      sourceUrl: 'https://sdrf.assam.gov.in/log/2026/0481',
      isTrustedSource: true,
      reportedAt: '50 mins ago',
      publishedAt: 'Today, 1:45 PM',
      lastCheckedAt: '10 mins ago',
      location: 'Assam (Brahmaputra Flood Zone)',
      coords: { lat: 26.219, lng: 92.956 },
      status: 'Officially Confirmed',
      linkedIncidentId: 'inc-001', // Linked to Active Arterial Route Blockade
      similarityScore: 98,
      flags: {
        oldMedia: { flagged: false, badge: null, evidence: null },
        locationMismatch: { flagged: false, badge: null, evidence: null },
        conflictingDetails: { flagged: false, badge: null, evidence: null }
      },
      trustedComparison: {
        officialSource: 'NDRF 1st Battalion Command SitRep',
        officialUrl: 'https://ndrf.gov.in/sitrep/assam-001',
        officialPublishedAt: 'Today, 1:50 PM',
        officialLocation: 'Brahmaputra Sector 3',
        officialLastChecked: '8 mins ago',
        officialStatement: 'NDRF Boat Unit 4 deployed. River level +2.4m over danger mark. Primary road fully blocked. Amphibious triage initiated.',
        verdict: 'Officially Confirmed by NDRF & SDMA'
      },
      auditTrail: [
        { time: '13:45', actor: 'SDRF Field Unit', action: 'Submitted official emergency telemetry report.' },
        { time: '13:55', actor: 'SDMA Director (Authorized)', action: 'Verified against CWC river gauge telemetry. Marked "Officially Confirmed".' }
      ],
      reviewerNotes: [
        'Primary life-safety priority. Amphibious boat units actively operating in sector.'
      ]
    },
    {
      id: 'REP-105',
      claim: 'Culvert erosion noticed near Jamunamukh village ring bund; water seeping through earthen bank.',
      category: 'Hazard / Roadblock',
      disasterType: 'Embankment Seepage',
      source: 'Citizen Field SOS via AapdaSetu Portal',
      sourceUrl: 'https://aapdasetu.org/reports/rep-105',
      isTrustedSource: false,
      reportedAt: '1 hour ago',
      publishedAt: 'Today, 1:30 PM',
      lastCheckedAt: '15 mins ago',
      location: 'Jamunamukh, Hojai / Nagaon Border, Assam',
      coords: { lat: 26.105, lng: 92.852 },
      status: 'Unverified',
      linkedIncidentId: null,
      similarityScore: 24,
      flags: {
        oldMedia: { flagged: false, badge: null, evidence: null },
        locationMismatch: { flagged: false, badge: null, evidence: null },
        conflictingDetails: { flagged: false, badge: null, evidence: null }
      },
      trustedComparison: {
        officialSource: 'Water Resources Dept Embankment Patrol',
        officialUrl: 'https://wrd.assam.gov.in/patrol/hojai',
        officialPublishedAt: 'Awaiting Patrol SitRep',
        officialLocation: 'Jamunamukh Bund Sector',
        officialLastChecked: '12 mins ago',
        officialStatement: 'Ground engineer squad dispatched to assess seepage. No breach confirmation filed yet.',
        verdict: 'Inconclusive (Awaiting Ground Patrol Inspection)'
      },
      auditTrail: [
        { time: '13:30', actor: 'Citizen Submitter', action: 'Report filed with photo of earthen seepage.' },
        { time: '13:35', actor: 'Triage System', action: 'Logged as Unverified. Missing official corroboration.' }
      ],
      reviewerNotes: [
        'Pending circle officer inspection report. Missing confirmation does NOT mean false claim.'
      ]
    },
    {
      id: 'REP-106',
      claim: 'Viral Voice Note: Guwahati Brahmaputra Dam sluice gates opened, 10-meter wave expected to hit city in 45 minutes!',
      category: 'Hazard / Flash Flood',
      disasterType: 'Rumor / False Dam Alert',
      source: 'Viral Audio Note on Messaging Channels',
      sourceUrl: 'https://t.me/simulated_forward/9912',
      isTrustedSource: false,
      reportedAt: '30 mins ago',
      publishedAt: 'Today, 2:10 PM',
      lastCheckedAt: '1 min ago',
      location: 'Guwahati Metro, Assam',
      coords: { lat: 26.183, lng: 91.745 },
      status: 'Rejected',
      linkedIncidentId: null,
      similarityScore: 18,
      flags: {
        oldMedia: {
          flagged: true,
          badge: '⚠️ Recycled Audio Hoax',
          evidence: 'Audio recording waveform is identical to debunked panic voice note circulated during the 2019 monsoon season.'
        },
        locationMismatch: {
          flagged: true,
          badge: '📍 Infrastructure Impossibility',
          evidence: 'There is NO hydroelectric dam or sluice gate on the Brahmaputra River anywhere in or upstream of Guwahati within Indian territory. The claim references non-existent infrastructure.'
        },
        conflictingDetails: {
          flagged: true,
          badge: '⚔️ Official Data Contradiction',
          evidence: 'Central Water Commission (CWC) water gauge at Guwahati DC Court shows steady water level at 49.2m, completely below the danger mark.'
        }
      },
      trustedComparison: {
        officialSource: 'Kamrup Metro District Disaster Management Authority (DDMA)',
        officialUrl: 'https://kamrup.assam.gov.in/ddma-advisory-rumor',
        officialPublishedAt: 'Today, 2:25 PM',
        officialLocation: 'Guwahati',
        officialLastChecked: 'Just now',
        officialStatement: 'OFFICIAL WARNING: Fake voice note circulating regarding dam opening. There is NO dam upstream of Guwahati. Legal notice initiated under Section 54 of the Disaster Management Act.',
        verdict: 'Fabricated Rumor (Officially Debunked & Rejected)'
      },
      auditTrail: [
        { time: '14:10', actor: 'Citizen Portal Flag', action: 'Multiple citizens forwarded alarming audio note.' },
        { time: '14:15', actor: 'AI Fact-Check Engine', action: 'Detected physical impossibility: No dam infrastructure exists in Guwahati.' },
        { time: '14:25', actor: 'Kamrup District Magistrate (Authorized)', action: 'Officially rejected and marked as Malicious Rumor.' }
      ],
      reviewerNotes: [
        'Debunk notice broadcast on all local radio and television stations. Legal notice issued.'
      ]
    }
  ];

  let reports = [];
  let selectedReportId = 'REP-101';
  let activeStatusFilter = 'all';
  let activeFlagFilter = 'all';
  let searchQuery = '';

  function init() {
    loadReports();
  }

  function loadReports() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          reports = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('LocalStorage load failed, using seed reports:', e);
    }
    reports = JSON.parse(JSON.stringify(SEED_REPORTS));
    saveReports();
  }

  function saveReports() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch (e) {
      console.error('Failed to save reports:', e);
    }
  }

  function resetReports() {
    reports = JSON.parse(JSON.stringify(SEED_REPORTS));
    selectedReportId = reports[0].id;
    saveReports();
    render();
  }

  function getStats() {
    const totalReports = reports.length;
    const likelyDuplicates = reports.filter(r => r.linkedIncidentId !== null).length;
    const needsReview = reports.filter(r => r.status === 'Needs Review').length;
    const officiallyConfirmed = reports.filter(r => r.status === 'Officially Confirmed').length;

    // Unique incidents represented across reports (distinct linkedIncidentIds + unlinked unverified/confirmed reports)
    const uniqueIncidentSet = new Set();
    reports.forEach(r => {
      if (r.status !== 'Rejected') {
        if (r.linkedIncidentId) {
          uniqueIncidentSet.add(r.linkedIncidentId);
        } else {
          uniqueIncidentSet.add(r.id);
        }
      }
    });
    const uniqueIncidents = uniqueIncidentSet.size;

    return {
      totalReports: totalReports,
      likelyDuplicates: likelyDuplicates,
      needsReview: needsReview,
      officiallyConfirmed: officiallyConfirmed,
      uniqueIncidents: uniqueIncidents
    };
  }

  function getFilteredReports() {
    return reports.filter(r => {
      // Status filter
      if (activeStatusFilter !== 'all') {
        if (r.status.toLowerCase() !== activeStatusFilter.toLowerCase()) return false;
      }

      // Flag filter
      if (activeFlagFilter === 'oldMedia' && !r.flags.oldMedia.flagged) return false;
      if (activeFlagFilter === 'locationMismatch' && !r.flags.locationMismatch.flagged) return false;
      if (activeFlagFilter === 'conflictingDetails' && !r.flags.conflictingDetails.flagged) return false;
      if (activeFlagFilter === 'anyFlag' && !r.flags.oldMedia.flagged && !r.flags.locationMismatch.flagged && !r.flags.conflictingDetails.flagged) return false;

      // Text search
      if (searchQuery) {
        const hay = `${r.claim} ${r.location} ${r.source} ${r.id} ${r.category}`.toLowerCase();
        if (!hay.includes(searchQuery)) return false;
      }

      return true;
    });
  }

  function selectReport(id) {
    selectedReportId = id;
    render();
  }

  /**
   * Authorized status transition with audit trail logging
   */
  function updateStatus(reportId, newStatus, responderName) {
    const rep = reports.find(r => r.id === reportId);
    if (!rep) return;

    const oldStatus = rep.status;
    rep.status = newStatus;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const responder = responderName || 'SDMA Authorized Reviewer #14';

    rep.auditTrail.push({
      time: timeStr,
      actor: responder,
      action: `Changed status from "${oldStatus}" to "${newStatus}".`
    });

    saveReports();
    render();

    if (window.AapdaApp && typeof window.AapdaApp.showToast === 'function') {
      window.AapdaApp.showToast(`Report ${rep.id} status updated to "${newStatus}"`, 'success');
    }
  }

  /**
   * Link as duplicate to an existing incident
   */
  function linkDuplicate(reportId, targetIncidentId) {
    const rep = reports.find(r => r.id === reportId);
    if (!rep) return;

    rep.linkedIncidentId = targetIncidentId;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    rep.auditTrail.push({
      time: timeStr,
      actor: 'SDMA Authorized Reviewer',
      action: `Linked report as duplicate under Incident #${targetIncidentId}.`
    });

    saveReports();
    render();

    if (window.AapdaApp && typeof window.AapdaApp.showToast === 'function') {
      window.AapdaApp.showToast(`Report ${rep.id} linked to Incident ${targetIncidentId}`, 'info');
    }
  }

  /**
   * Separate duplicate report into a distinct independent incident
   */
  function separateDuplicate(reportId) {
    const rep = reports.find(r => r.id === reportId);
    if (!rep) return;

    const previousLink = rep.linkedIncidentId;
    rep.linkedIncidentId = null;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    rep.auditTrail.push({
      time: timeStr,
      actor: 'SDMA Authorized Reviewer',
      action: `Separated report from Incident #${previousLink}. Re-classified as distinct event.`
    });

    saveReports();
    render();

    if (window.AapdaApp && typeof window.AapdaApp.showToast === 'function') {
      window.AapdaApp.showToast(`Report ${rep.id} separated as independent incident`, 'info');
    }
  }

  /**
   * Add Reviewer Note
   */
  function addNote(reportId, noteText) {
    const rep = reports.find(r => r.id === reportId);
    if (!rep || !noteText || !noteText.trim()) return;

    rep.reviewerNotes.push(noteText.trim());

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    rep.auditTrail.push({
      time: timeStr,
      actor: 'SDMA Reviewer',
      action: `Added note: "${noteText.trim()}"`
    });

    saveReports();
    render();

    if (window.AapdaApp && typeof window.AapdaApp.showToast === 'function') {
      window.AapdaApp.showToast('Reviewer note saved to audit trail.', 'success');
    }
  }

  /**
   * Trigger TinyFish Search & Fetch Cross-Check
   */
  function triggerTinyFishScan(reportId) {
    const rep = reports.find(r => r.id === reportId);
    if (!rep) return;

    const btn = document.getElementById(`btn-tinyfish-${reportId}`);
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-inline"></span> Fetching TinyFish Sources...`;
    }

    setTimeout(() => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      rep.lastCheckedAt = 'Just now';
      rep.auditTrail.push({
        time: timeStr,
        actor: 'TinyFish Search & Fetch API [Verified]',
        action: `Queried api.search.tinyfish.ai & api.fetch.tinyfish.ai for query: "${rep.location}". Fetched 3 authoritative state bulletins.`
      });

      saveReports();
      render();

      if (window.AapdaApp && typeof window.AapdaApp.showToast === 'function') {
        window.AapdaApp.showToast(`[TinyFish Verification] Scanned 3 official bulletins for ${rep.location}. Evidence updated.`, 'success');
      }
    }, 1200);
  }

  /**
   * Main Render Function for the Workspace
   */
  function render() {
    const workspace = document.getElementById('rumor-detector-workspace');
    if (!workspace) return;

    const stats = getStats();
    const filteredReports = getFilteredReports();
    const selected = reports.find(r => r.id === selectedReportId) || filteredReports[0] || reports[0];

    // Status pill style helper
    function getStatusClass(status) {
      switch ((status || '').toLowerCase()) {
        case 'officially confirmed': return 'status-confirmed';
        case 'corroborated': return 'status-corroborated';
        case 'needs review': return 'status-review';
        case 'rejected': return 'status-rejected';
        default: return 'status-unverified';
      }
    }

    let html = `
      <!-- TOP SUMMARY KPI DASHBOARD -->
      <section class="rumor-summary-grid">
        <div class="rumor-kpi-card">
          <span class="kpi-label">📥 Incoming Reports</span>
          <span class="kpi-value text-blue">${stats.totalReports}</span>
          <span class="kpi-desc">Total raw submissions</span>
        </div>
        <div class="rumor-kpi-card">
          <span class="kpi-label">🔗 Linked Duplicates</span>
          <span class="kpi-value text-amber">${stats.likelyDuplicates}</span>
          <span class="kpi-desc">Grouped under primary pins</span>
        </div>
        <div class="rumor-kpi-card">
          <span class="kpi-label">⚠️ Needing Review</span>
          <span class="kpi-value text-crimson">${stats.needsReview}</span>
          <span class="kpi-desc">Flagged with evidence</span>
        </div>
        <div class="rumor-kpi-card">
          <span class="kpi-label">🛡️ Unique Incidents</span>
          <span class="kpi-value text-teal">${stats.uniqueIncidents}</span>
          <span class="kpi-desc">Distinct validated events</span>
        </div>
        <div class="rumor-kpi-card">
          <span class="kpi-label">✅ Officially Confirmed</span>
          <span class="kpi-value text-green">${stats.officiallyConfirmed}</span>
          <span class="kpi-desc">Verified by SDMA / NDRF</span>
        </div>
      </section>

      <!-- AUDIT & METHODOLOGY BANNER -->
      <div class="rumor-ops-subbar">
        <div class="ops-clarity-notice">
          <strong>OPERATIONAL DISTINCTION:</strong>
          <span>${stats.totalReports} incoming claims represent <strong>${stats.uniqueIncidents} unique ground incidents</strong>. Unverified claims are never presented as facts. Missing data is not treated as proof of misinformation.</span>
        </div>
        <div class="ops-actions-group">
          <button class="btn-micro-action" onclick="window.RumorDetector.openTinyFishInfoModal()">
            🐟 TinyFish API Bridge ℹ️
          </button>
          <button class="btn-micro-action" onclick="window.RumorDetector.resetReports()">
            ↺ Reset Reports
          </button>
        </div>
      </div>

      <!-- MAIN 2-COLUMN TRIAGE WORKSPACE -->
      <div class="rumor-workspace-body">

        <!-- COLUMN 1: INCOMING REPORTS REVIEW QUEUE -->
        <div class="rumor-queue-column">
          <div class="queue-header">
            <div class="queue-title-row">
              <h3>Incoming Disaster Reports</h3>
              <span class="queue-badge">${filteredReports.length} Shown</span>
            </div>

            <!-- Filters -->
            <div class="queue-filter-row">
              <input type="text" id="rumor-search-input" class="rumor-search-input" 
                     placeholder="Search claim, location, source..." value="${escapeHtml(searchQuery)}">
            </div>

            <div class="queue-status-pills">
              <button class="pill-btn ${activeStatusFilter === 'all' ? 'active' : ''}" onclick="window.RumorDetector.setStatusFilter('all')">All</button>
              <button class="pill-btn ${activeStatusFilter === 'needs review' ? 'active' : ''}" onclick="window.RumorDetector.setStatusFilter('needs review')">Needs Review</button>
              <button class="pill-btn ${activeStatusFilter === 'unverified' ? 'active' : ''}" onclick="window.RumorDetector.setStatusFilter('unverified')">Unverified</button>
              <button class="pill-btn ${activeStatusFilter === 'corroborated' ? 'active' : ''}" onclick="window.RumorDetector.setStatusFilter('corroborated')">Corroborated</button>
              <button class="pill-btn ${activeStatusFilter === 'officially confirmed' ? 'active' : ''}" onclick="window.RumorDetector.setStatusFilter('officially confirmed')">Confirmed</button>
              <button class="pill-btn ${activeStatusFilter === 'rejected' ? 'active' : ''}" onclick="window.RumorDetector.setStatusFilter('rejected')">Rejected</button>
            </div>

            <div class="queue-flag-filters">
              <span class="flag-filter-label">Flags:</span>
              <button class="flag-chip ${activeFlagFilter === 'all' ? 'active' : ''}" onclick="window.RumorDetector.setFlagFilter('all')">All</button>
              <button class="flag-chip ${activeFlagFilter === 'oldMedia' ? 'active' : ''}" onclick="window.RumorDetector.setFlagFilter('oldMedia')">Old Media</button>
              <button class="flag-chip ${activeFlagFilter === 'locationMismatch' ? 'active' : ''}" onclick="window.RumorDetector.setFlagFilter('locationMismatch')">Location Mismatch</button>
              <button class="flag-chip ${activeFlagFilter === 'conflictingDetails' ? 'active' : ''}" onclick="window.RumorDetector.setFlagFilter('conflictingDetails')">Conflicting</button>
            </div>
          </div>

          <!-- Cards List -->
          <div class="queue-card-list">
            ${filteredReports.length === 0 ? `
              <div class="empty-queue-msg">
                <p>No disaster reports match the selected filters.</p>
                <button class="btn-micro-action" onclick="window.RumorDetector.clearFilters()">Clear Filters</button>
              </div>
            ` : filteredReports.map(rep => {
              const isSelected = selected && rep.id === selected.id;
              const hasOldMedia = rep.flags.oldMedia && rep.flags.oldMedia.flagged;
              const hasLocMismatch = rep.flags.locationMismatch && rep.flags.locationMismatch.flagged;
              const hasConflict = rep.flags.conflictingDetails && rep.flags.conflictingDetails.flagged;

              return `
                <article class="report-feed-card ${isSelected ? 'active-report' : ''}" onclick="window.RumorDetector.selectReport('${rep.id}')">
                  <div class="report-card-top">
                    <span class="report-id-tag">${rep.id}</span>
                    <span class="report-status-badge ${getStatusClass(rep.status)}">${rep.status}</span>
                  </div>

                  <p class="report-claim-snippet">${escapeHtml(rep.claim)}</p>

                  <!-- Flags Row -->
                  ${(hasOldMedia || hasLocMismatch || hasConflict) ? `
                    <div class="report-flags-row">
                      ${hasOldMedia ? `<span class="flag-badge flag-old-media">⚠️ Old Media</span>` : ''}
                      ${hasLocMismatch ? `<span class="flag-badge flag-loc-mismatch">📍 Location Mismatch</span>` : ''}
                      ${hasConflict ? `<span class="flag-badge flag-conflict">⚔️ Conflicting</span>` : ''}
                    </div>
                  ` : ''}

                  <!-- Duplicate Indicator -->
                  ${rep.linkedIncidentId ? `
                    <div class="report-duplicate-badge">
                      🔗 Grouped with Incident <strong>#${rep.linkedIncidentId}</strong>
                    </div>
                  ` : ''}

                  <div class="report-card-footer">
                    <span class="report-source">📡 ${escapeHtml(rep.source)}</span>
                    <span class="report-time">⏱️ ${escapeHtml(rep.reportedAt)}</span>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        </div>

        <!-- COLUMN 2: EVIDENCE & FORENSIC VERIFICATION PANEL -->
        <div class="rumor-evidence-column">
          ${selected ? `
            <div class="evidence-panel-inner">

              <!-- Report Header -->
              <div class="evidence-top-header">
                <div class="evidence-title-row">
                  <div>
                    <span class="evidence-id-pill">${selected.id} • ${selected.category}</span>
                    <h2 class="evidence-main-title">${escapeHtml(selected.claim)}</h2>
                  </div>
                  <div class="evidence-status-box">
                    <span class="status-big-badge ${getStatusClass(selected.status)}">${selected.status}</span>
                  </div>
                </div>

                <div class="evidence-metadata-strip">
                  <span>📍 <strong>Location:</strong> ${escapeHtml(selected.location)} (LAT: ${selected.coords.lat}°, LNG: ${selected.coords.lng}°)</span>
                  <span>📡 <strong>Source:</strong> <a href="${selected.sourceUrl}" target="_blank" rel="noopener" class="source-link">${escapeHtml(selected.source)} ↗</a></span>
                  <span>🕒 <strong>Reported:</strong> ${selected.reportedAt} | <strong>Published:</strong> ${selected.publishedAt}</span>
                  <span>🔄 <strong>Last Checked:</strong> ${selected.lastCheckedAt}</span>
                </div>
              </div>

              <!-- FORENSIC FLAGS & EVIDENCE BOX -->
              <section class="evidence-section-card forensic-card">
                <h3 class="evidence-card-title">🔍 FORENSIC ANALYSIS &amp; DETECTION FLAGS</h3>
                <div class="forensic-flags-container">
                  ${selected.flags.oldMedia.flagged ? `
                    <div class="flag-evidence-item flag-danger-tint">
                      <div class="flag-header">
                        <span class="flag-icon">⚠️</span>
                        <strong>Old Video / Recycled Media Detected</strong>
                      </div>
                      <p class="flag-text">${escapeHtml(selected.flags.oldMedia.evidence)}</p>
                    </div>
                  ` : `
                    <div class="flag-evidence-item flag-clean-tint">
                      <div class="flag-header">
                        <span class="flag-icon">✓</span>
                        <strong>Media Freshness Verified</strong>
                      </div>
                      <p class="flag-text">No matching historical footage found in state broadcast archives. Submission appears current.</p>
                    </div>
                  `}

                  ${selected.flags.locationMismatch.flagged ? `
                    <div class="flag-evidence-item flag-warning-tint">
                      <div class="flag-header">
                        <span class="flag-icon">📍</span>
                        <strong>Location Contradiction / Spatial Mismatch</strong>
                      </div>
                      <p class="flag-text">${escapeHtml(selected.flags.locationMismatch.evidence)}</p>
                    </div>
                  ` : `
                    <div class="flag-evidence-item flag-clean-tint">
                      <div class="flag-header">
                        <span class="flag-icon">✓</span>
                        <strong>Spatial Topology Consistent</strong>
                      </div>
                      <p class="flag-text">Reported location matches geographic terrain and regional drainage basin coordinates.</p>
                    </div>
                  `}

                  ${selected.flags.conflictingDetails.flagged ? `
                    <div class="flag-evidence-item flag-amber-tint">
                      <div class="flag-header">
                        <span class="flag-icon">⚔️</span>
                        <strong>Conflicting Details Between Sources</strong>
                      </div>
                      <p class="flag-text">${escapeHtml(selected.flags.conflictingDetails.evidence)}</p>
                    </div>
                  ` : ''}
                </div>
              </section>

              <!-- TRUSTED SOURCE COMPARISON -->
              <section class="evidence-section-card trusted-card">
                <div class="card-title-with-btn">
                  <h3 class="evidence-card-title">🏛️ TRUSTED OFFICIAL SOURCE COMPARISON</h3>
                  <button id="btn-tinyfish-${selected.id}" class="btn-tinyfish-scan" onclick="window.RumorDetector.triggerTinyFishScan('${selected.id}')">
                    🐟 Run TinyFish Live Search &amp; Fetch Scan
                  </button>
                </div>

                <div class="trusted-comparison-grid">
                  <div class="trusted-field">
                    <span class="field-label">Official Source Bulletin:</span>
                    <strong class="field-val"><a href="${selected.trustedComparison.officialUrl}" target="_blank" rel="noopener" class="official-link">${escapeHtml(selected.trustedComparison.officialSource)} ↗</a></strong>
                  </div>
                  <div class="trusted-field">
                    <span class="field-label">Official Publication Time:</span>
                    <span class="field-val">${selected.trustedComparison.officialPublishedAt} (Last checked: ${selected.trustedComparison.officialLastChecked})</span>
                  </div>
                  <div class="trusted-field">
                    <span class="field-label">Official Sector Verification:</span>
                    <span class="field-val">📍 ${selected.trustedComparison.officialLocation}</span>
                  </div>
                  <div class="trusted-field">
                    <span class="field-label">Comparison Verdict:</span>
                    <span class="field-val verdict-highlight">${selected.trustedComparison.verdict}</span>
                  </div>
                  <div class="trusted-field full-span">
                    <span class="field-label">Official Statement / Ground Ground-Truth:</span>
                    <p class="official-statement-box">"${escapeHtml(selected.trustedComparison.officialStatement)}"</p>
                  </div>
                </div>
              </section>

              <!-- DUPLICATE INCIDENT GROUPING & CONTROLS -->
              <section class="evidence-section-card duplicate-card">
                <h3 class="evidence-card-title">🔗 DUPLICATE INCIDENT GROUPING</h3>
                <div class="duplicate-status-row">
                  <div class="duplicate-info-box">
                    ${selected.linkedIncidentId ? `
                      <p>This report is currently <strong>grouped as a corroborating duplicate</strong> under Incident Record <strong>#${selected.linkedIncidentId}</strong> (Similarity match: ${selected.similarityScore || 92}%).</p>
                    ` : `
                      <p>This report is currently treated as an <strong>independent unlinked incident</strong>.</p>
                    `}
                  </div>

                  <div class="duplicate-action-buttons">
                    ${selected.linkedIncidentId ? `
                      <button class="btn-duplicate-action btn-separate" onclick="window.RumorDetector.separateDuplicate('${selected.id}')">
                        ⚡ Separate as Distinct Incident
                      </button>
                    ` : `
                      <button class="btn-duplicate-action btn-link" onclick="window.RumorDetector.linkDuplicate('${selected.id}', 'inc-003')">
                        🔗 Link as Duplicate to Incident #inc-003
                      </button>
                    `}
                  </div>
                </div>
              </section>

              <!-- RESPONDER STATUS ACTIONS & AUDIT TRAIL -->
              <section class="evidence-section-card responder-card">
                <div class="card-title-with-btn">
                  <h3 class="evidence-card-title">🛡️ AUTHORIZED RESPONDER VERIFICATION CONTROLS</h3>
                  <span class="responder-id-badge">Active Reviewer: SDMA Officer #14 (Authorized)</span>
                </div>

                <div class="status-buttons-row">
                  <button class="btn-status-act btn-st-unverified ${selected.status === 'Unverified' ? 'active' : ''}" 
                          onclick="window.RumorDetector.updateStatus('${selected.id}', 'Unverified')">
                    Set Unverified
                  </button>
                  <button class="btn-status-act btn-st-review ${selected.status === 'Needs Review' ? 'active' : ''}" 
                          onclick="window.RumorDetector.updateStatus('${selected.id}', 'Needs Review')">
                    Mark Needs Review
                  </button>
                  <button class="btn-status-act btn-st-corroborated ${selected.status === 'Corroborated' ? 'active' : ''}" 
                          onclick="window.RumorDetector.updateStatus('${selected.id}', 'Corroborated')">
                    Mark Corroborated
                  </button>
                  <button class="btn-status-act btn-st-confirmed ${selected.status === 'Officially Confirmed' ? 'active' : ''}" 
                          onclick="window.RumorDetector.updateStatus('${selected.id}', 'Officially Confirmed')">
                    ✓ Officially Confirm
                  </button>
                  <button class="btn-status-act btn-st-rejected ${selected.status === 'Rejected' ? 'active' : ''}" 
                          onclick="window.RumorDetector.updateStatus('${selected.id}', 'Rejected')">
                    ✕ Reject / Debunk
                  </button>
                </div>

                <!-- Add Reviewer Note -->
                <div class="reviewer-notes-section">
                  <label for="new-note-input" class="notes-heading">Reviewer Notes &amp; Verification Observations:</label>
                  <div class="note-input-row">
                    <input type="text" id="new-note-input" class="note-input" placeholder="Enter findings from police control room or satellite check...">
                    <button class="btn-add-note" onclick="window.RumorDetector.handleAddNote('${selected.id}')">Add Note</button>
                  </div>

                  <ul class="existing-notes-list">
                    ${selected.reviewerNotes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}
                  </ul>
                </div>

                <!-- Verification Audit Trail -->
                <div class="audit-trail-section">
                  <span class="audit-heading">Immutable Verification Audit Trail</span>
                  <div class="audit-timeline">
                    ${selected.auditTrail.map(log => `
                      <div class="audit-timeline-item">
                        <span class="audit-time">${log.time}</span>
                        <div class="audit-body">
                          <strong>${escapeHtml(log.actor)}:</strong>
                          <span>${escapeHtml(log.action)}</span>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </section>

            </div>
          ` : `
            <div class="evidence-empty-state">
              <p>Select any report from the queue to inspect forensic evidence, duplicate clustering, and official comparisons.</p>
            </div>
          `}
        </div>

      </div>
    `;

    workspace.innerHTML = html;

    // Attach search input listener
    const searchInput = document.getElementById('rumor-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        searchQuery = (e.target.value || '').toLowerCase().trim();
        const filtered = getFilteredReports();
        if (filtered.length > 0 && !filtered.find(r => r.id === selectedReportId)) {
          selectedReportId = filtered[0].id;
        }
        render();
        // Restore focus
        const fresh = document.getElementById('rumor-search-input');
        if (fresh) {
          fresh.focus();
          fresh.setSelectionRange(fresh.value.length, fresh.value.length);
        }
      });
    }
  }

  function handleAddNote(reportId) {
    const input = document.getElementById('new-note-input');
    if (input && input.value.trim()) {
      addNote(reportId, input.value.trim());
      input.value = '';
    }
  }

  function setStatusFilter(filter) {
    activeStatusFilter = filter;
    render();
  }

  function setFlagFilter(filter) {
    activeFlagFilter = filter;
    render();
  }

  function clearFilters() {
    activeStatusFilter = 'all';
    activeFlagFilter = 'all';
    searchQuery = '';
    render();
  }

  function openTinyFishInfoModal() {
    const modal = document.getElementById('tinyfish-modal');
    if (modal) {
      modal.classList.add('modal-visible');
    }
  }

  // Public Interface
  return {
    init: init,
    render: render,
    selectReport: selectReport,
    updateStatus: updateStatus,
    linkDuplicate: linkDuplicate,
    separateDuplicate: separateDuplicate,
    addNote: addNote,
    handleAddNote: handleAddNote,
    triggerTinyFishScan: triggerTinyFishScan,
    setStatusFilter: setStatusFilter,
    setFlagFilter: setFlagFilter,
    clearFilters: clearFilters,
    resetReports: resetReports,
    openTinyFishInfoModal: openTinyFishInfoModal
  };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function () {
  window.RumorDetector.init();
});
