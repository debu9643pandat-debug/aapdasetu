/**
 * AapdaSetu - AI Rescue Priority Engine (Explainable AI / XAI)
 * 
 * Transparent Urgency Scoring Algorithm:
 * Unlike opaque "black-box" models, this engine calculates a deterministic,
 * multi-factor urgency score (0-100) using 4 life-critical variables:
 * 
 * 1. Disaster Severity (Weight: 35%)
 * 2. Population at Risk (Weight: 30%)
 * 3. Access to Medical Care & Entrapment (Weight: 20%)
 * 4. Source Reliability & Corroboration (Weight: 15%)
 * 
 * Formula:
 * UrgencyScore = (0.35 * S) + (0.30 * P) + (0.20 * M) + (0.15 * R)
 */

const PriorityEngine = (function () {
  'use strict';

  // Severity Weightings (35% total)
  const SEVERITY_SCORES = {
    critical: 100, // Catastrophic breach, structural collapse, active rapid flooding
    high: 75,     // Severe waterlogging, landslide blockage, cyclone eye wall
    moderate: 50, // Rising waters, localized mudslide, strong winds
    minor: 25     // Minor inundation, localized tree fall, precautionary
  };

  // Medical Care & Entrapment Factor (20% total)
  const MEDICAL_SCORES = {
    trapped: 100,       // Fully cut off, active drowning/crush risk, zero access
    critical_injuries: 85,// Severe trauma, hypothermia, urgent triage needed
    delayed: 60,        // Medical access delayed by 6-12 hours due to route cut
    stable: 25          // Basic first aid available, ambulatory population
  };

  // Source Reliability Factor (15% total)
  const SOURCE_SCORES = {
    ndrf_gov: 100,      // NDRF, SDRF, District Magistrate official bulletin
    verified_responder: 85, // Red Cross, verified NGO field doctor, ham radio op
    multi_citizen: 65,  // Corroborated citizen reports (3+ geo-tagged posts)
    unverified: 40      // Single unverified citizen report / social post
  };

  /**
   * Calculate Population Risk subscore (30% total)
   * Scaled logarithmic progression based on lives at stake.
   */
  function calculatePopulationScore(affectedCount) {
    const count = parseInt(affectedCount, 10) || 0;
    if (count >= 500) return 100;
    if (count >= 250) return 90;
    if (count >= 100) return 75;
    if (count >= 50) return 60;
    if (count >= 20) return 45;
    if (count >= 5) return 30;
    return 15;
  }

  /**
   * Main AI calculation function
   * @param {Object} incident 
   * @returns {Object} detailed score and transparent breakdown
   */
  function calculate(incident) {
    // 1. Severity subscore (0-100)
    const sevKey = (incident.severity || 'moderate').toLowerCase();
    const rawSeverity = SEVERITY_SCORES[sevKey] || 50;

    // 2. Population subscore (0-100)
    const rawPopulation = calculatePopulationScore(incident.peopleAffected);

    // 3. Medical subscore (0-100)
    const medKey = (incident.medicalAccess || 'delayed').toLowerCase();
    const rawMedical = MEDICAL_SCORES[medKey] || 50;

    // 4. Source Reliability subscore (0-100)
    const srcKey = (incident.sourceReliability || 'multi_citizen').toLowerCase();
    const rawSource = SOURCE_SCORES[srcKey] || 50;

    // Weights: 35%, 30%, 20%, 15%
    const weightSeverity = 0.35;
    const weightPopulation = 0.30;
    const weightMedical = 0.20;
    const weightSource = 0.15;

    const weightedSeverity = rawSeverity * weightSeverity;
    const weightedPopulation = rawPopulation * weightPopulation;
    const weightedMedical = rawMedical * weightMedical;
    const weightedSource = rawSource * weightSource;

    const totalScore = Math.round(
      weightedSeverity + weightedPopulation + weightedMedical + weightedSource
    );

    // Classify Priority Tier
    let priorityTier = 'MODERATE';
    let badgeClass = 'badge-moderate';
    let colorHex = '#eab308'; // Amber

    if (totalScore >= 75) {
      priorityTier = 'CRITICAL';
      badgeClass = 'badge-critical';
      colorHex = '#ef4444'; // Red
    } else if (totalScore >= 50) {
      priorityTier = 'HIGH';
      badgeClass = 'badge-high';
      colorHex = '#f97316'; // Orange
    }

    // Generate Context-Aware Tactical Co-Pilot Recommendation
    const recommendation = generateTacticalRecommendation({
      tier: priorityTier,
      score: totalScore,
      disasterType: incident.type,
      peopleAffected: incident.peopleAffected,
      medicalAccess: medKey,
      location: incident.location
    });

    return {
      score: totalScore,
      tier: priorityTier,
      badgeClass: badgeClass,
      colorHex: colorHex,
      breakdown: {
        severity: {
          raw: rawSeverity,
          weight: '35%',
          contribution: +(weightedSeverity).toFixed(1),
          label: 'Disaster Severity'
        },
        population: {
          raw: rawPopulation,
          weight: '30%',
          contribution: +(weightedPopulation).toFixed(1),
          label: 'Population at Risk'
        },
        medical: {
          raw: rawMedical,
          weight: '20%',
          contribution: +(weightedMedical).toFixed(1),
          label: 'Medical Access Urgency'
        },
        source: {
          raw: rawSource,
          weight: '15%',
          contribution: +(weightedSource).toFixed(1),
          label: 'Source Reliability'
        }
      },
      recommendation: recommendation,
      formulaExplanation: `Score (${totalScore}) = (35% × ${rawSeverity}) + (30% × ${rawPopulation}) + (20% × ${rawMedical}) + (15% × ${rawSource})`
    };
  }

  /**
   * Generates mission-critical tactical recommendations for SDMA / NDRF field commanders
   */
  function generateTacticalRecommendation(data) {
    if (data.tier === 'CRITICAL') {
      if (data.medicalAccess === 'trapped') {
        return `URGENT (Tier 1): Immediate amphibious/air rescue required. Estimated ${data.peopleAffected || 'multiple'} individuals completely cut off with zero medical egress. Priority dispatch for NDRF Boat & Triage unit.`;
      }
      return `HIGH PRIORITY: Rapid route clearing and heavy rescue deployment required within 45-60 mins. High structural or drowning vulnerability.`;
    } else if (data.tier === 'HIGH') {
      return `ELEVATED ACTION: Deploy SDRF auxiliary unit for perimeter stabilization and establish localized medical staging center. Monitor telemetry for rapid worsening.`;
    } else {
      return `MONITORING & RELIEF: Dispatch standard dry ration relief supply convoy and establish communications check every 2 hours. Evacuation route currently passable with caution.`;
    }
  }

  return {
    calculate: calculate,
    SEVERITY_SCORES: SEVERITY_SCORES,
    MEDICAL_SCORES: MEDICAL_SCORES,
    SOURCE_SCORES: SOURCE_SCORES
  };
})();

// Export for Node or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PriorityEngine;
}
