// Risk Scoring Engine
// Scores are 0-100 where higher = more risk

// ─── AI Automation Exposure ────────────────────────────────────
// Based on function + level. BDR/SDR ICs are highest risk, managers moderate.

const AI_RISK_BY_FUNCTION = {
  "Sales and Support": 70,
  "Marketing and Product": 45,
  "Business Management": 30,
  "Finance and Administration": 35,
  "Human Resources": 25,
  "Engineering": 20,
  "Operations": 30,
  "Information Technology": 40,
  "Consulting": 35,
  "Program and Project Management": 25,
  "Legal": 20,
  "Risk, Safety, Compliance": 15,
  "Healthcare": 15,
  "Education": 20,
};

const AI_RISK_LEVEL_MODIFIER = {
  Staff: 15,
  "Senior Staff": 10,
  Intern: 20,
  Consultant: 10,
  Manager: -5,
  Director: -15,
  VP: -20,
  "C-Team": -25,
};

// Title keywords that increase AI risk
const HIGH_AI_RISK_TITLES = [
  "sdr", "bdr", "sales development", "business development",
  "outbound", "lead generation", "prospecting",
  "data entry", "scheduling", "coordinator",
];

const LOW_AI_RISK_TITLES = [
  "strategy", "leadership", "director", "vp", "chief",
  "enablement", "operations", "success", "relationship",
];

export function scoreAIRisk(person) {
  const func = person.currentFunction || "Sales and Support";
  const level = person.currentLevel || "Staff";
  const title = (person.currentTitle || "").toLowerCase();

  let score = AI_RISK_BY_FUNCTION[func] ?? 40;
  score += AI_RISK_LEVEL_MODIFIER[level] ?? 0;

  // Title adjustments
  if (HIGH_AI_RISK_TITLES.some((kw) => title.includes(kw))) score += 12;
  if (LOW_AI_RISK_TITLES.some((kw) => title.includes(kw))) score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─── Company Instability ──────────────────────────────────────
// Based on headcount trajectory. Growing = low risk, shrinking = high.

export function scoreCompanyInstability(demographics) {
  if (!demographics || demographics.length < 2) return 50;

  // Get earliest and latest headcount
  const sorted = [...demographics].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const periods = {};
  for (const row of sorted) {
    const date = row.date;
    periods[date] = (periods[date] || 0) + (row.count_employees || 0);
  }

  const dates = Object.keys(periods).sort();
  if (dates.length < 2) return 50;

  const earliest = periods[dates[0]];
  const latest = periods[dates[dates.length - 1]];

  if (earliest === 0) return 50;

  const growthRate = (latest - earliest) / earliest;

  // Map growth to risk: >50% growth = low risk (15), flat = moderate (50), >20% shrink = high (85)
  if (growthRate > 0.5) return 15;
  if (growthRate > 0.2) return 25;
  if (growthRate > 0.05) return 35;
  if (growthRate > -0.05) return 50;
  if (growthRate > -0.2) return 70;
  return 85;
}

// ─── Promotion Ceiling ────────────────────────────────────────
// Based on manager-to-director ratio in the company

export function scorePromotionCeiling(flowsByLevel) {
  if (!flowsByLevel || flowsByLevel.length === 0) return 50;

  const levelCounts = {};
  for (const row of flowsByLevel) {
    const level = row.group_values?.[0]?.value || "unknown";
    levelCounts[level] = (levelCounts[level] || 0) + (row.arrivals || 0);
  }

  const managers = levelCounts["Manager"] || 0;
  const directors = levelCounts["Director"] || 0;

  if (directors === 0 && managers > 0) return 75; // No director hires = crowded
  if (managers === 0) return 40;

  const ratio = managers / Math.max(directors, 1);

  // 2:1 ratio = normal (40), 4:1 = crowded (55), 8:1 = very crowded (75)
  if (ratio <= 2) return 30;
  if (ratio <= 3) return 40;
  if (ratio <= 4) return 55;
  if (ratio <= 6) return 65;
  return 75;
}

// ─── Tenure Volatility ────────────────────────────────────────
// Based on the person's job history — short tenures = higher risk

export function scoreTenureVolatility(jobs) {
  if (!jobs || jobs.length < 2) return 40;

  const tenures = [];
  for (const job of jobs) {
    if (job.started_at && job.ended_at) {
      const start = new Date(job.started_at);
      const end = new Date(job.ended_at);
      const months = (end - start) / (1000 * 60 * 60 * 24 * 30);
      if (months > 0) tenures.push(months);
    }
  }

  if (tenures.length === 0) return 40;

  const avgTenure = tenures.reduce((a, b) => a + b, 0) / tenures.length;
  const shortStints = tenures.filter((t) => t < 6).length;

  // Average tenure scoring
  let score = 40;
  if (avgTenure < 12) score = 75;
  else if (avgTenure < 18) score = 60;
  else if (avgTenure < 24) score = 45;
  else if (avgTenure < 36) score = 35;
  else score = 25;

  // Penalty for very short stints
  score += shortStints * 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─── Function Churn Risk ──────────────────────────────────────
// Based on arrivals/departures in the person's function

export function scoreFunctionChurn(flows, targetFunction) {
  if (!flows || flows.length === 0) return 50;

  let arrivals = 0;
  let departures = 0;

  for (const row of flows) {
    const func = row.group_values?.[0]?.value;
    if (func === targetFunction) {
      arrivals += row.arrivals || 0;
      departures += row.departures || 0;
    }
  }

  if (arrivals === 0) return 50;
  const churnRatio = departures / arrivals;

  // <0.3 = stable (25), 0.3-0.5 = moderate (45), >0.5 = volatile (70)
  if (churnRatio < 0.25) return 20;
  if (churnRatio < 0.35) return 35;
  if (churnRatio < 0.5) return 50;
  if (churnRatio < 0.65) return 65;
  return 78;
}

// ─── Overall Risk Score ───────────────────────────────────────

export function computeOverallRisk(scores) {
  const weights = {
    aiRisk: 0.30,
    companyInstability: 0.20,
    promotionCeiling: 0.15,
    tenureVolatility: 0.10,
    functionChurn: 0.15,
    salaryCompression: 0.10,
  };

  let total = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    if (scores[key] !== undefined) {
      total += scores[key] * weight;
      totalWeight += weight;
    }
  }

  return Math.round(total / (totalWeight || 1));
}

// ─── Compute All Scores ───────────────────────────────────────

export function computeAllScores(person, demographics, flows, flowsByLevel) {
  const aiRisk = scoreAIRisk(person);
  const companyInstability = scoreCompanyInstability(demographics);
  const promotionCeiling = scorePromotionCeiling(flowsByLevel);
  const tenureVolatility = scoreTenureVolatility(person.jobs);
  const functionChurn = scoreFunctionChurn(flows, person.currentFunction);

  // Salary compression is a derived estimate based on AI risk + function churn
  const salaryCompression = Math.round((aiRisk * 0.6 + functionChurn * 0.4));

  const scores = {
    aiRisk,
    companyInstability,
    promotionCeiling,
    tenureVolatility,
    functionChurn,
    salaryCompression,
  };

  scores.overall = computeOverallRisk(scores);

  return scores;
}
