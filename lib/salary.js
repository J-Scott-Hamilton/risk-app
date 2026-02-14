// Salary Estimation Engine
// Estimates based on function + level + geography
// Source: aggregated from Glassdoor, Salary.com, Levels.fyi ranges (2024-2025)

// Base comp by function (national median, USD)
const BASE_BY_FUNCTION = {
  "Sales and Support": 75000,
  "Engineering": 130000,
  "Marketing and Product": 95000,
  "Business Management": 85000,
  "Finance and Administration": 80000,
  "Human Resources": 72000,
  "Operations": 70000,
  "Information Technology": 90000,
  "Consulting": 95000,
  "Program and Project Management": 90000,
  "Legal": 110000,
  "Risk, Safety, Compliance": 85000,
  "Healthcare": 80000,
  "Education": 55000,
};

// Level multipliers
const LEVEL_MULTIPLIER = {
  Intern: 0.4,
  Staff: 0.85,
  "Senior Staff": 1.1,
  Manager: 1.35,
  Director: 1.75,
  VP: 2.3,
  "C-Team": 3.0,
  Consultant: 1.15,
};

// Geo multipliers (cost-of-labor adjustment)
const GEO_MULTIPLIER = {
  // Major tech hubs
  "san francisco": 1.45,
  "san jose": 1.40,
  "new york": 1.35,
  "new york city": 1.35,
  "nyc": 1.35,
  "brooklyn": 1.32,
  "manhattan": 1.38,
  "seattle": 1.25,
  "boston": 1.22,
  "los angeles": 1.20,
  "washington": 1.18,
  "dc": 1.18,
  "austin": 1.10,
  "denver": 1.08,
  "chicago": 1.10,
  // Secondary markets
  "portland": 1.05,
  "miami": 1.05,
  "atlanta": 1.02,
  "dallas": 1.02,
  "houston": 1.00,
  "phoenix": 0.95,
  "minneapolis": 1.02,
  "philadelphia": 1.08,
  "san diego": 1.12,
  // International
  "london": 1.20,
  "tel aviv": 1.10,
  "berlin": 0.90,
  "toronto": 0.95,
  "sydney": 1.05,
  "singapore": 1.15,
  // Default
  default: 1.0,
};

function getGeoMultiplier(location) {
  if (!location) return GEO_MULTIPLIER.default;
  const loc = location.toLowerCase();
  for (const [key, mult] of Object.entries(GEO_MULTIPLIER)) {
    if (loc.includes(key)) return mult;
  }
  // State-level fallbacks
  if (loc.includes("california") || loc.includes(", ca")) return 1.25;
  if (loc.includes("new york") || loc.includes(", ny")) return 1.28;
  if (loc.includes("washington") || loc.includes(", wa")) return 1.18;
  if (loc.includes("massachusetts") || loc.includes(", ma")) return 1.15;
  if (loc.includes("texas") || loc.includes(", tx")) return 1.02;
  return GEO_MULTIPLIER.default;
}

// ─── Main Estimation Function ─────────────────────────────────

export function estimateSalary(func, level, location) {
  const base = BASE_BY_FUNCTION[func] || 80000;
  const levelMult = LEVEL_MULTIPLIER[level] || 1.0;
  const geoMult = getGeoMultiplier(location);

  const midpoint = Math.round(base * levelMult * geoMult);
  const low = Math.round(midpoint * 0.78);
  const high = Math.round(midpoint * 1.30);
  const p90 = Math.round(midpoint * 1.55);

  return { low, midpoint, high, p90 };
}

// ─── Comp Progression Ladder ──────────────────────────────────

export function getCompProgression(func, location) {
  const levels = ["Staff", "Senior Staff", "Manager", "Director", "VP"];
  return levels.map((level) => ({
    level,
    ...estimateSalary(func, level, location),
  }));
}

// ─── AI Salary Pressure Estimate ──────────────────────────────

export function estimateAISalaryPressure(aiRiskScore) {
  // High AI risk means potential downward pressure on comp
  if (aiRiskScore >= 70) return { direction: "downward", magnitude: "significant", pctImpact: -15 };
  if (aiRiskScore >= 50) return { direction: "downward", magnitude: "moderate", pctImpact: -8 };
  if (aiRiskScore >= 30) return { direction: "neutral", magnitude: "minimal", pctImpact: -3 };
  return { direction: "stable", magnitude: "none", pctImpact: 0 };
}
