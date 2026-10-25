/**
 * AapdaSetu - Disaster OS Telemetry Data Store
 * 
 * NOTE: [SIMULATED DATA FOR HACKATHON DEMO]
 * The incidents, water levels, sensor telemetry, and coordinates in this
 * module are realistic synthetic scenarios based on historic Indian disaster
 * events (Assam Floods, Wayanad Landslides, Odisha Cyclones, Himachal Floods).
 * 
 * No real emergency responders (112 / NDRF) are dispatched.
 */

const IncidentDataStore = (function () {
  'use strict';

  const STORAGE_KEY = 'aapdasetu_incidents_v2';

  // Realistic seed data matching the reference image layout and Indian disaster sectors
  const DEFAULT_INCIDENTS = [
    {
      id: 'inc-001',
      title: 'Active Arterial Route Blockade — Assam',
      type: 'Hazard / Roadblock',
      category: 'hazard',
      sector: 'Assam (Brahmaputra Flood Zone)',
      region: 'Assam',
      lat: 26.219,
      lng: 92.956,
      severity: 'critical',
      peopleAffected: 420,
      medicalAccess: 'trapped',
      sourceReliability: 'ndrf_gov',
      confidence: 96,
      status: 'Reported', // Reported, Verified, Resolved
      reportedAt: '12 mins ago',
      telemetry: {
        waterLevel: '+2.4m Over Danger',
        flowRate: 'Rapid / High Risk',
        ndrfTeam: 'Deployed (Boat Unit 4)',
        trafficImpact: 'Fully Blocked',
        structuralIntegrity: 'Culvert Compromised',
        rainfallPast24h: '184 mm'
      },
      rawExtract: '[TinyFish Live Extract] Emergency bulletin reports catastrophic waterlogging and debris obstruction along primary transit route in Assam Brahmaputra river basin. Transit impassable.',
      aiAnalysis: 'NDRF & district police actively diverting traffic around low-lying corridor in Assam. Estimated 420 people isolated in adjacent hamlets with rising river levels. Immediate amphibious rescue asset recommended.'
    },
    {
      id: 'inc-002',
      title: 'District Multipurpose Relief Camp — Assam',
      type: 'Relief Shelter',
      category: 'shelter',
      sector: 'Assam (Central Sector Nagaon)',
      region: 'Assam',
      lat: 26.345,
      lng: 92.684,
      severity: 'moderate',
      peopleAffected: 650,
      medicalAccess: 'stable',
      sourceReliability: 'ndrf_gov',
      confidence: 95,
      status: 'Verified',
      reportedAt: '35 mins ago',
      telemetry: {
        shelterCapacity: '650 / 800 Occupants',
        medicalStaff: '3 Doctors, 6 Nurses',
        rationSupply: '4 Days Stock Remaining',
        potableWater: 'Purification Unit Active',
        backupPower: 'Solar Inverter On'
      },
      rawExtract: '[TinyFish Live Extract] District Collectorate activates 24x7 relief camp with medical triage and food packets in Assam Central Sector.',
      aiAnalysis: 'Camp operating at 81% capacity. Adequate clean water supply. Recommend restocking infant formula and ORS within 36 hours.'
    },
    {
      id: 'inc-003',
      title: 'NH-37 Kaziranga Corridor Submergence',
      type: 'Hazard / Roadblock',
      category: 'hazard',
      sector: 'Assam (Kaziranga National Park)',
      region: 'Assam',
      lat: 26.585,
      lng: 93.171,
      severity: 'high',
      peopleAffected: 140,
      medicalAccess: 'delayed',
      sourceReliability: 'verified_responder',
      confidence: 94,
      status: 'Reported',
      reportedAt: '1 hour ago',
      telemetry: {
        waterLevel: '+1.6m Over Roadway',
        flowRate: 'Moderate Inundation',
        ndrfTeam: 'En Route',
        trafficImpact: 'Stranded Vehicles (2.4 km)',
        structuralIntegrity: 'Embankment Eroding',
        rainfallPast24h: '142 mm'
      },
      rawExtract: 'কাজিৰঙাত ৩৭ নং ৰাষ্ট্ৰীয় ঘাইপথৰ ওপৰেৰে বাঢ়নী পানী বৈছে, গধুৰ বাহনৰ চলাচল বন্ধ... [Flood water spilling over national highway near animal corridor].',
      aiAnalysis: 'High risk of wildlife-human conflict due to animal migration towards highlands across flooded highway. Speed restrictions and police pilot escort recommended.'
    },
    {
      id: 'inc-004',
      title: 'Kamrup Metro High School Relief Camp',
      type: 'Relief Shelter',
      category: 'shelter',
      sector: 'Assam (Guwahati Metro)',
      region: 'Assam',
      lat: 26.183,
      lng: 91.745,
      severity: 'minor',
      peopleAffected: 320,
      medicalAccess: 'stable',
      sourceReliability: 'verified_responder',
      confidence: 96,
      status: 'Verified',
      reportedAt: '2 hours ago',
      telemetry: {
        shelterCapacity: '320 / 400 Occupants',
        medicalStaff: '1 Mobile Health Unit',
        rationSupply: '6 Days Stock',
        potableWater: 'Municipal Tanker Connected',
        backupPower: 'Grid Line Active'
      },
      rawExtract: 'Guwahati District Administration opens 14 relief camps with medical teams and dry ration packets for displaced families from low-lying wards.',
      aiAnalysis: 'Sanitation facilities confirmed compliant. High school gym converted to primary triage. Stable operational status.'
    },
    {
      id: 'inc-005',
      title: 'Chooralmala-Meppadi Landslide Debris Cutoff',
      type: 'Hazard / Landslide',
      category: 'hazard',
      sector: 'Kerala (Wayanad Western Ghats)',
      region: 'Kerala',
      lat: 11.536,
      lng: 76.132,
      severity: 'critical',
      peopleAffected: 280,
      medicalAccess: 'trapped',
      sourceReliability: 'ndrf_gov',
      confidence: 98,
      status: 'Reported',
      reportedAt: '45 mins ago',
      telemetry: {
        waterLevel: 'Debris Flow Depth 3.2m',
        flowRate: 'Unstable Slopes',
        ndrfTeam: 'NDRF 4th Bn + Indian Army Bailey Bridge Unit',
        trafficImpact: 'Bridge Washed Out',
        structuralIntegrity: 'Severed Connectivity',
        rainfallPast24h: '290 mm'
      },
      rawExtract: '[Field SOS] Landslide completely swept away access bridge connecting plantation workers colony. Heavy rain continuing.',
      aiAnalysis: 'Critical humanitarian situation. Bailey bridge construction initiated by military engineers. Drone-based payload delivery recommended for emergency medical kits.'
    },
    {
      id: 'inc-006',
      title: 'Cyclone Shelter No. 7 — Kendrapara Coast',
      type: 'Relief Shelter',
      category: 'shelter',
      sector: 'Odisha (Bay of Bengal Coast)',
      region: 'Odisha',
      lat: 20.501,
      lng: 86.423,
      severity: 'moderate',
      peopleAffected: 890,
      medicalAccess: 'stable',
      sourceReliability: 'ndrf_gov',
      confidence: 97,
      status: 'Verified',
      reportedAt: '3 hours ago',
      telemetry: {
        shelterCapacity: '890 / 1200 Occupants',
        medicalStaff: '4 SDRF Paramedics',
        rationSupply: '5 Days Stock',
        potableWater: 'Desalination R.O. Unit',
        backupPower: 'Diesel Genset Operating'
      },
      rawExtract: 'OSDMA coastal multipurpose shelter operational with reinforced concrete cyclone proofing and community kitchen.',
      aiAnalysis: 'Structure designed for Category 4 wind gusts. Evacuation of outer 5 km coastal hamlets 92% complete.'
    },
    {
      id: 'inc-007',
      title: 'Mandi Pandoh Gorge Flash Flood Obstruction',
      type: 'Hazard / Flash Flood',
      category: 'hazard',
      sector: 'Himachal (Beas River Basin)',
      region: 'Himachal',
      lat: 31.670,
      lng: 77.054,
      severity: 'high',
      peopleAffected: 95,
      medicalAccess: 'critical_injuries',
      sourceReliability: 'verified_responder',
      confidence: 93,
      status: 'Reported',
      reportedAt: '1.5 hours ago',
      telemetry: {
        waterLevel: '+3.1m Surge Wave',
        flowRate: 'Torrential / 45 knots',
        ndrfTeam: 'SDRF Himachal Mountain Rescue',
        trafficImpact: 'Chandigarh-Manali Highway Blocked',
        structuralIntegrity: 'Retaining Wall Damaged',
        rainfallPast24h: '210 mm'
      },
      rawExtract: 'Heavy cloudburst in catchment area caused sudden surge in Beas river; boulders obstructing NH-21 near Pandoh dam.',
      aiAnalysis: 'River discharge peaked at 150,000 cusecs. Urgent medical triage team required for 6 injured motorists.'
    },
    {
      id: 'inc-008',
      title: 'Yamuna Floodplain Relief Base — Kashmere Gate',
      type: 'Relief Shelter',
      category: 'shelter',
      sector: 'Delhi NCR (Yamuna Basin)',
      region: 'Delhi NCR',
      lat: 28.667,
      lng: 77.234,
      severity: 'minor',
      peopleAffected: 450,
      medicalAccess: 'stable',
      sourceReliability: 'ndrf_gov',
      confidence: 94,
      status: 'Verified',
      reportedAt: '4 hours ago',
      telemetry: {
        shelterCapacity: '450 / 600 Occupants',
        medicalStaff: 'Delhi Health Mission Camp',
        rationSupply: '7 Days Stock',
        potableWater: 'DJB Water Tankers 6x',
        backupPower: 'Grid & Dual Battery'
      },
      rawExtract: 'Relief camp set up along higher ring road elevation for families evacuated from Monastery and Yamuna Bazar low-lying sectors.',
      aiAnalysis: 'Water level at Old Railway Bridge stabilizing at 205.80m. Mosquito abatement and water purification packets distributed.'
    }
  ];

  // Helper to enrich an incident with AI Urgency scores
  function enrichWithAiScore(inc) {
    if (typeof PriorityEngine !== 'undefined') {
      const calculation = PriorityEngine.calculate(inc);
      return Object.assign({}, inc, {
        aiScore: calculation.score,
        priorityTier: calculation.tier,
        badgeClass: calculation.badgeClass,
        breakdown: calculation.breakdown,
        tacticalRecommendation: calculation.recommendation,
        formulaExplanation: calculation.formulaExplanation
      });
    }
    return inc;
  }

  // Load from LocalStorage or seed default
  function loadIncidents() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(enrichWithAiScore);
        }
      }
    } catch (e) {
      console.warn('LocalStorage load failed, falling back to seed data:', e);
    }
    const enriched = DEFAULT_INCIDENTS.map(enrichWithAiScore);
    saveIncidents(enriched);
    return enriched;
  }

  function saveIncidents(incidents) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  function resetToDefaults() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { }
    const enriched = DEFAULT_INCIDENTS.map(enrichWithAiScore);
    saveIncidents(enriched);
    return enriched;
  }

  return {
    getAll: loadIncidents,
    saveAll: saveIncidents,
    resetToDefaults: resetToDefaults,
    enrichWithAiScore: enrichWithAiScore
  };
})();

// Export for Node or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IncidentDataStore;
}
