// ─── Claude API — Narrative Analysis Generator ─────────────────────────
// Generates risk narratives and retraining path recommendations
// v2: Career-informed retraining with first-real-job detection,
//     functional profiling, and prestige employer classification

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

// ─── Prestige Employer List ─────────────────────────────────────────────
// Internships at these companies signal high selectivity / ambition tier
const PRESTIGE_EMPLOYERS = new Set([
  // Top tech
  "google", "alphabet", "apple", "microsoft", "amazon", "meta", "netflix",
  "nvidia", "anthropic", "openai", "deepmind", "palantir", "stripe", "databricks",
  "snowflake", "figma", "notion", "scale ai", "anduril", "spacex", "tesla",
  // Finance
  "goldman sachs", "morgan stanley", "j.p. morgan", "jpmorgan", "blackstone",
  "blackrock", "citadel", "two sigma", "jane street", "d.e. shaw", "de shaw",
  "point72", "bridgewater", "kkr", "carlyle", "apollo", "sequoia",
  "andreessen horowitz", "a16z", "benchmark", "kleiner perkins",
  // Consulting
  "mckinsey", "bain", "boston consulting", "bcg", "deloitte", "accenture",
  // Pharma / biotech
  "pfizer", "johnson & johnson", "genentech", "moderna", "amgen",
  // Defense / gov
  "lockheed martin", "boeing", "raytheon", "nasa", "jpl",
  // Research / elite institutions
  "mit", "stanford", "caltech", "harvard", "yale", "princeton",
  "bell labs", "xerox parc", "microsoft research", "google deepmind",
]);

function isPrestigeEmployer(companyName) {
  if (!companyName) return false;
  const normalized = companyName.toLowerCase().trim();
  // Direct match
  if (PRESTIGE_EMPLOYERS.has(normalized)) return true;
  // Partial match (e.g., "Goldman Sachs & Co." matches "goldman sachs")
  for (const prestige of PRESTIGE_EMPLOYERS) {
    if (normalized.includes(prestige) || prestige.includes(normalized)) return true;
  }
  return false;
}

// ─── Role Classification ────────────────────────────────────────────────
// Categorizes each job as: "ignore" (student/part-time), "internship", or "real"
const STUDENT_PART_TIME_PATTERNS = /\b(server|waiter|waitress|bartender|barista|busboy|busser|host|hostess|cashier|retail\s*(associate|clerk|sales)?|delivery\s*driver|dishwasher|cook\b|line cook|prep cook|housekeeper|janitor|custodian|lifeguard|nanny|babysitter|tutor|grocery|stocker|fast food|crew member|team member|shift\s*(lead|manager|supervisor)|sandwich\s*artist|bagger|car wash|dog walker|pet sitter|camp counselor|lawn care|landscap(er|ing)|pizza|ice cream|frozen yogurt|movie theater|usher|ticket|receptionist at|front desk at|library\s*(assistant|aide|worker)|campus\s*(ambassador|tour|guide|rep|security)|resident\s*advisor|ra\b|dining\s*(hall|services)|food\s*service|catering\s*(staff|assistant)|freelance\s*tutor)/i;

const INTERNSHIP_PATTERNS = /\b(intern|internship|co-?op|summer\s*analyst|summer\s*associate|research\s*(assistant|associate|aide|fellow)|teaching\s*(assistant|aide)|lab\s*(assistant|tech|aide)|fellow|fellowship|trainee|apprentice|extern)\b/i;

function classifyRole(job) {
  const title = (job.title || "").toLowerCase();
  const level = (job.level || "").toLowerCase();
  const company = job.company?.name || job.company || "";

  // Explicit intern level from LiveData
  if (level === "intern") {
    return {
      type: "internship",
      prestigeInternship: isPrestigeEmployer(company),
    };
  }

  // Title-based internship detection
  if (INTERNSHIP_PATTERNS.test(title)) {
    return {
      type: "internship",
      prestigeInternship: isPrestigeEmployer(company),
    };
  }

  // Student / part-time / service industry
  if (STUDENT_PART_TIME_PATTERNS.test(title)) {
    return { type: "ignore", prestigeInternship: false };
  }

  // Catch generic "part-time" or "temporary" modifiers on otherwise vague titles
  if (/\b(part[\s-]?time|temporary|seasonal|on[\s-]?call)\b/i.test(title) && !level) {
    return { type: "ignore", prestigeInternship: false };
  }

  // Everything else is a real job
  return { type: "real", prestigeInternship: false };
}

// ─── First Real Job Detection ───────────────────────────────────────────
// Scans chronologically, skips student/part-time roles, returns first "real" job
function findFirstRealJob(jobs) {
  if (!jobs || jobs.length === 0) return null;

  // Sort chronologically (earliest first)
  const sorted = [...jobs].sort((a, b) => {
    const dateA = new Date(a.startDate || a.start_date || "2099");
    const dateB = new Date(b.startDate || b.start_date || "2099");
    return dateA - dateB;
  });

  for (const job of sorted) {
    const classification = classifyRole(job);
    if (classification.type === "real") return job;
  }

  return null; // No real jobs found — pre-career
}

// ─── Years of Experience (from first real job) ──────────────────────────
function estimateYearsExperience(jobs) {
  if (!jobs || jobs.length === 0) return 0;

  const firstReal = findFirstRealJob(jobs);
  if (!firstReal) return 0;

  const startDate = new Date(firstReal.startDate || firstReal.start_date);
  if (isNaN(startDate)) return 0;

  return Math.max(0, Math.round((Date.now() - startDate) / (365.25 * 24 * 60 * 60 * 1000)));
}

// ─── Functional Profile ─────────────────────────────────────────────────
// Analyzes career history for functional continuity vs. breadth
function buildFunctionalProfile(jobs) {
  if (!jobs || jobs.length === 0) {
    return {
      dominantFunction: null,
      functionalDepth: "none",
      functionHistory: [],
      crossFunctional: false,
      summary: "No career history available.",
    };
  }

  // Only count real jobs
  const realJobs = jobs.filter((j) => classifyRole(j).type === "real");
  if (realJobs.length === 0) {
    return {
      dominantFunction: null,
      functionalDepth: "none",
      functionHistory: [],
      crossFunctional: false,
      summary: "No substantive professional roles found.",
    };
  }

  // Count time in each function (weighted by duration)
  const functionWeights = {};
  const functionSequence = [];

  for (const job of realJobs) {
    const fn = job.function || "Unknown";
    const start = new Date(job.startDate || job.start_date || Date.now());
    const end = job.endDate || job.end_date
      ? new Date(job.endDate || job.end_date)
      : new Date();
    const durationYears = Math.max(0.25, (end - start) / (365.25 * 24 * 60 * 60 * 1000));

    functionWeights[fn] = (functionWeights[fn] || 0) + durationYears;
    if (!functionSequence.includes(fn)) functionSequence.push(fn);
  }

  // Sort by weight
  const sorted = Object.entries(functionWeights).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0];
  const totalYears = sorted.reduce((sum, [, y]) => sum + y, 0);
  const dominantPct = totalYears > 0 ? dominant[1] / totalYears : 0;

  // Classify depth
  let functionalDepth;
  if (dominantPct >= 0.85) functionalDepth = "deep_specialist";
  else if (dominantPct >= 0.65) functionalDepth = "primary_with_exposure";
  else if (dominantPct >= 0.45) functionalDepth = "multi_functional";
  else functionalDepth = "generalist";

  const depthLabels = {
    deep_specialist: "Deep Specialist",
    primary_with_exposure: "Primary Function with Cross-Functional Exposure",
    multi_functional: "Multi-Functional",
    generalist: "Generalist / Portfolio Career",
  };

  // Build summary
  let summary;
  if (functionalDepth === "deep_specialist") {
    summary = `${Math.round(dominant[1])} years deeply concentrated in ${dominant[0]} (${Math.round(dominantPct * 100)}% of career). Retraining paths should respect this functional gravity — lateral moves within or adjacent to ${dominant[0]} are most credible.`;
  } else if (functionalDepth === "primary_with_exposure") {
    const secondary = sorted[1] ? sorted[1][0] : "other functions";
    summary = `Primarily ${dominant[0]} (${Math.round(dominantPct * 100)}%) with meaningful exposure to ${secondary}. Has demonstrated ability to cross functional boundaries, which opens broader retraining options.`;
  } else if (functionalDepth === "multi_functional") {
    summary = `Career spans multiple functions: ${sorted.slice(0, 3).map(([fn]) => fn).join(", ")}. This breadth suggests adaptability — retraining paths can be wider than for a specialist.`;
  } else {
    summary = `True generalist with experience across ${sorted.length} functions. Career pattern suggests comfort with reinvention — retraining paths should leverage this adaptability.`;
  }

  return {
    dominantFunction: dominant[0],
    dominantPct: Math.round(dominantPct * 100),
    functionalDepth,
    functionalDepthLabel: depthLabels[functionalDepth],
    functionHistory: sorted.map(([fn, years]) => ({
      function: fn,
      years: Math.round(years * 10) / 10,
      pct: Math.round((years / totalYears) * 100),
    })),
    crossFunctional: sorted.length >= 3 && dominantPct < 0.65,
    summary,
  };
}

// ─── Internship Summary ─────────────────────────────────────────────────
// For early-career profiles, summarize internship quality
function summarizeInternships(jobs) {
  if (!jobs || jobs.length === 0) return null;

  const internships = jobs
    .map((j) => ({ ...j, classification: classifyRole(j) }))
    .filter((j) => j.classification.type === "internship");

  if (internships.length === 0) return null;

  const prestige = internships.filter((j) => j.classification.prestigeInternship);
  const regular = internships.filter((j) => !j.classification.prestigeInternship);

  return {
    total: internships.length,
    prestigeCount: prestige.length,
    regularCount: regular.length,
    prestigeEmployers: prestige.map((j) => j.company?.name || j.company || "Unknown"),
    regularEmployers: regular.map((j) => j.company?.name || j.company || "Unknown"),
    ambitionSignal: prestige.length > 0 ? "high" : internships.length >= 2 ? "moderate" : "baseline",
  };
}

// ─── Career Stage Classification ────────────────────────────────────────
function classifyCareerStage(person) {
  const level = (person.currentLevel || "").toLowerCase();
  const title = (person.currentTitle || "").toLowerCase();
  const jobCount = person.jobs?.length || 0;
  const yearsOfExperience = estimateYearsExperience(person.jobs);
  const firstRealJob = findFirstRealJob(person.jobs);

  // Pre-career: no real jobs at all
  if (!firstRealJob) {
    const currentClassification = classifyRole({
      title: person.currentTitle,
      level: person.currentLevel,
      company: { name: person.currentCompany },
    });

    const isStudent = /\b(student|undergraduate|graduate student|phd candidate|research assistant|teaching assistant)\b/.test(title);
    const isIntern = currentClassification.type === "internship";
    const isTransitionalRole = currentClassification.type === "ignore";

    return {
      stage: "pre_career",
      label: isStudent ? "Student" : isIntern ? "Intern" : isTransitionalRole ? "Pre-Career / Transitional" : "Recent Graduate",
      description: isStudent
        ? "Currently in school. Career trajectory not yet established."
        : isIntern
        ? `Currently interning${person.currentCompany ? ` at ${person.currentCompany}` : ""}. Career direction forming.`
        : isTransitionalRole
        ? "Current role appears transitional — not indicative of long-term career direction."
        : "Just entering the workforce. Too early for meaningful risk assessment.",
      retrainingApproach: "career entry paths, high-growth fields, foundational credentials, entry-level roles in growth functions",
      isPreCareer: true,
    };
  }

  // Pinnacle / Apex — C-suite, founders, known leaders
  if (
    level === "c-team" ||
    /\b(ceo|cfo|cto|coo|cio|cpo|cmo|chief|founder|co-?founder|president|chairman|chairwoman)\b/.test(title)
  ) {
    return {
      stage: "pinnacle",
      label: "Pinnacle / Executive Leadership",
      description: "At the apex of organizational hierarchy. Significant organizational authority and strategic scope.",
      retrainingApproach: "board seats, advisory roles, executive-in-residence, venture investing, thought leadership, portfolio company CEO",
    };
  }

  // Senior Executive — VPs, SVPs, EVPs
  if (
    level === "vp" ||
    /\b(vice president|svp|evp|senior vice|executive vice|gm|general manager)\b/.test(title)
  ) {
    return {
      stage: "senior_executive",
      label: "Senior Executive / VP",
      description: "VP-level with broad organizational impact. Significant organizational authority and strategic scope.",
      retrainingApproach: "executive transitions, C-suite paths, board preparation, portfolio company leadership, fractional executive roles",
    };
  }

  // Senior Leader — Directors, Senior Directors, Heads of
  if (
    level === "director" ||
    /\b(director|head of|principal|fellow|distinguished)\b/.test(title)
  ) {
    return {
      stage: "senior_leader",
      label: "Senior Leader / Director",
      description: "Director-level with team/function ownership. Established domain authority.",
      retrainingApproach: "VP-track moves, cross-functional leadership, startup leadership roles, consulting practices",
    };
  }

  // Mid-Career — Managers, Senior ICs
  if (
    level === "manager" ||
    level === "senior staff" ||
    /\b(manager|lead|senior|staff|architect)\b/.test(title) ||
    yearsOfExperience >= 8
  ) {
    return {
      stage: "mid_career",
      label: "Mid-Career Professional",
      description: "Established professional with meaningful experience. May manage people or be a senior IC.",
      retrainingApproach: "adjacent function moves, management track, specialist deepening, emerging tech roles",
    };
  }

  // Early Career
  if (yearsOfExperience >= 3) {
    return {
      stage: "early_career",
      label: "Early Career",
      description: "Building foundational skills and establishing career direction.",
      retrainingApproach: "skill-based pivots, bootcamps, certifications, cross-functional rotations, graduate programs",
    };
  }

  // Entry Level
  return {
    stage: "entry_level",
    label: "Entry Level / New Professional",
    description: "Just starting out. Maximum flexibility for career pivots.",
    retrainingApproach: "broad skill development, apprenticeships, rotational programs, certifications, adjacent roles",
  };
}

// ─── Summarize Career History ───────────────────────────────────────────
function summarizeCareerHistory(jobs) {
  if (!jobs || jobs.length === 0) return "No career history available.";
  return jobs
    .slice(0, 10)
    .map((j, i) => {
      const title = j.title || "Unknown Title";
      const company = j.company?.name || j.company || "Unknown Company";
      const start = j.startDate || j.start_date || "?";
      const end = j.endDate || j.end_date || "Present";
      const level = j.level || "";
      const fn = j.function || "";
      const classification = classifyRole(j);
      const tag = classification.type === "ignore" ? " [STUDENT/PT]"
        : classification.type === "internship"
          ? classification.prestigeInternship ? " [PRESTIGE INTERN]" : " [INTERN]"
          : "";
      return `${i + 1}. ${title} at ${company} (${start} – ${end})${level ? ` [${level}]` : ""}${fn ? ` {${fn}}` : ""}${tag}`;
    })
    .join("\n");
}

// ─── Helper: Detect Upward Trajectory ───────────────────────────────────
function isUpwardTrajectory(levels) {
  const hierarchy = {
    intern: 0,
    staff: 1,
    "senior staff": 2,
    consultant: 2,
    manager: 3,
    director: 4,
    vp: 5,
    "c-team": 6,
  };
  let ascending = 0;
  for (let i = 1; i < levels.length; i++) {
    const prev = hierarchy[levels[i].toLowerCase()] ?? 1;
    const curr = hierarchy[levels[i - 1].toLowerCase()] ?? 1;
    if (curr > prev) ascending++;
  }
  return ascending >= Math.floor(levels.length / 2);
}

// ─── Main Export ────────────────────────────────────────────────────────
export async function generateNarrative(personData, scores, companyData, salaryData) {
  // Short-circuit for pre-career / transitional profiles — no API call needed
  const careerStage = classifyCareerStage(personData);
  if (careerStage.isPreCareer) {
    return preCareerNarrative(personData, scores, careerStage);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return fallbackNarrative(personData, scores);
  }

  const prompt = buildPrompt(personData, scores, companyData, salaryData);

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 8000,
        system: "You are an elite workforce intelligence analyst. Return ONLY valid JSON. No markdown, no backticks, no commentary outside the JSON object.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error("Claude API error:", res.status, await res.text());
      return fallbackNarrative(personData, scores);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "";

    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Claude narrative generation failed:", err);
    return fallbackNarrative(personData, scores);
  }
}

// ─── The Core Prompt ────────────────────────────────────────────────────
function buildPrompt(person, scores, companyData, salaryData) {
  const careerStage = classifyCareerStage(person);
  const yearsExp = estimateYearsExperience(person.jobs);
  const careerHistory = summarizeCareerHistory(person.jobs);
  const functionalProfile = buildFunctionalProfile(person.jobs);
  const internships = summarizeInternships(person.jobs);

  // Detect career patterns
  const jobCount = person.jobs?.length || 0;
  const companies = [...new Set((person.jobs || []).map((j) => j.company?.name || j.company).filter(Boolean))];
  const functions = [...new Set((person.jobs || []).map((j) => j.function).filter(Boolean))];
  const levels = (person.jobs || []).map((j) => j.level).filter(Boolean);
  const hasUpwardTrajectory = levels.length >= 2 && isUpwardTrajectory(levels);

  return `You are an elite workforce intelligence analyst creating a deeply personalized employment risk assessment. This is NOT a generic template — you must analyze this specific individual's unique career arc, seniority, sector, geography, and personal history to produce insights that could only apply to THIS person.

═══════════════════════════════════════════════════════════════
SUBJECT PROFILE
═══════════════════════════════════════════════════════════════
Name: ${person.name}
Current Title: ${person.currentTitle || "Unknown"}
Current Company: ${person.currentCompany || "Unknown"}
Current Level: ${person.currentLevel || "Unknown"}
Current Function: ${person.currentFunction || "Unknown"}
Location: ${person.location || "Unknown"}
Education: ${person.education || "Not available"}

═══════════════════════════════════════════════════════════════
CAREER ANALYSIS
═══════════════════════════════════════════════════════════════
Career Stage: ${careerStage.label} (${careerStage.stage})
Years of Professional Experience: ${yearsExp} (counted from first substantive role, excluding student/part-time work)
Career Stage Description: ${careerStage.description}

FUNCTIONAL PROFILE:
${functionalProfile.summary}
Dominant Function: ${functionalProfile.dominantFunction || "N/A"} (${functionalProfile.dominantPct || 0}% of career)
Functional Depth: ${functionalProfile.functionalDepthLabel || "N/A"}
Function Breakdown: ${functionalProfile.functionHistory.map((f) => `${f.function}: ${f.years}yr (${f.pct}%)`).join(", ") || "N/A"}
Cross-Functional: ${functionalProfile.crossFunctional ? "Yes — has worked across 3+ functions" : "No — concentrated career"}

CAREER HISTORY (roles tagged with classification):
${careerHistory}
${internships ? `\nINTERNSHIP PROFILE:\nTotal internships: ${internships.total}\nPrestige internships (${internships.prestigeCount}): ${internships.prestigeEmployers.join(", ") || "None"}\nOther internships (${internships.regularCount}): ${internships.regularEmployers.join(", ") || "None"}\nAmbition signal: ${internships.ambitionSignal}` : ""}

Career Trajectory: ${hasUpwardTrajectory ? "Upward — consistent level progression" : "Lateral/Mixed — no clear upward pattern"}
Companies: ${companies.length} unique (${companies.slice(0, 5).join(", ")}${companies.length > 5 ? "..." : ""})
Functions: ${functions.join(", ") || "Unknown"}

═══════════════════════════════════════════════════════════════
RISK SCORES (0–100, higher = more risk)
═══════════════════════════════════════════════════════════════
Overall Risk: ${scores.overall}/100
AI Automation Risk: ${scores.aiRisk}/100
Company Instability: ${scores.companyInstability}/100
Promotion Ceiling: ${scores.promotionCeiling}/100
Market Demand: ${scores.marketDemand}/100 (inverted — higher = weaker demand)

${companyData ? `COMPANY DATA:\n${JSON.stringify(companyData, null, 2)}` : ""}

${salaryData ? `SALARY CONTEXT:\n${JSON.stringify(salaryData, null, 2)}` : ""}

═══════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════

CRITICAL RULES FOR RETRAINING PATHS:

1. RESPECT FUNCTIONAL GRAVITY: This person's functional profile shows "${functionalProfile.functionalDepthLabel || "Unknown"}". ${
    functionalProfile.functionalDepth === "deep_specialist"
      ? `They have spent ${functionalProfile.dominantPct}% of their career in ${functionalProfile.dominantFunction}. Do NOT suggest wildly unrelated functions. A long-time ${functionalProfile.dominantFunction} professional should see paths in or adjacent to ${functionalProfile.dominantFunction}, not random pivots to unrelated fields.`
      : functionalProfile.functionalDepth === "primary_with_exposure"
      ? `They're primarily in ${functionalProfile.dominantFunction} but have cross-functional experience. Paths can be slightly broader but should still anchor to their core expertise.`
      : `They've shown functional breadth. Paths can be wider but should still leverage demonstrated skills.`
  }

2. MATCH CAREER STAGE: This person is "${careerStage.label}". ${
    careerStage.stage === "pinnacle" || careerStage.stage === "senior_executive"
      ? "Do NOT suggest mid-level or junior roles. Paths should reflect executive-level transitions: board seats, advisory, portfolio leadership, fractional executive work."
      : careerStage.stage === "senior_leader"
      ? "Paths should be VP-track or equivalent. No entry-level suggestions."
      : careerStage.stage === "mid_career"
      ? "Paths should be lateral or upward. Can include management track or specialist deepening."
      : "Early career allows broader exploration, but paths should still build on demonstrated skills and interests."
  }

3. EDUCATION CONTEXT: ${
    person.education
      ? `Education: ${person.education}. ${yearsExp >= 15 ? "Given 15+ years of experience, education is a minor factor — career history IS the credential. Mention education only if directly relevant." : yearsExp >= 5 ? "Education provides some context but career history is the stronger signal." : "Education is a meaningful signal at this career stage. Consider degree field and institution when suggesting paths."}`
      : "No education data available. Base retraining paths entirely on career history."
  }

4. ROLES TAGGED [STUDENT/PT] OR [INTERN] in the career history should NOT inform retraining path recommendations. They are included for context only. Roles tagged [PRESTIGE INTERN] suggest higher capability/ambition but still should not be treated as career experience.

Return ONLY this JSON structure:

{
  "overviewSummary": "4-6 sentences synthesizing ${person.name}'s overall employment risk posture. Be specific to THIS person — reference their actual role, company, function, level, and career pattern. No generic platitudes.",

  "careerPattern": "3-4 sentences analyzing their career arc. Reference specific moves, tenure patterns, functional concentration or breadth, and what the pattern suggests about their professional identity and adaptability. Note: their professional career started with their first real role, not student/part-time work.",

  "aiThreatAnalysis": "PARAGRAPH 1 (3-4 sentences): How AI specifically threatens ${person.currentTitle}'s daily work at ${person.currentCompany}. Name specific AI tools or capabilities that overlap with their function. Reference actual products (GitHub Copilot, Jasper, Harvey AI, etc.) where relevant. PARAGRAPH 2 (2-3 sentences): What aspects of their specific role are MOST resistant to AI automation and why. PARAGRAPH 3 (2-3 sentences): Timeline and severity assessment — when does AI become a material threat to someone at their level and function?",

  "aiMitigatingFactors": "3-4 sentences on factors that protect THIS specific person from AI displacement. Consider: seniority (managers/directors have more protection than ICs), relationship-dependent work, strategic decision-making, domain expertise depth, regulatory/compliance requirements.",

  "companyHealthSummary": "3-4 sentences on ${person.currentCompany}'s trajectory and what it means for ${person.name}. Reference actual workforce data if available — headcount trends, hiring velocity, attrition patterns.",

  "promotionAnalysis": "3-4 sentences on internal mobility prospects. Given their current level, what's the realistic next rung? Is the company growing fast enough to create those roles? Does their function have a clear leadership ladder at ${person.currentCompany}? Factor in their tenure and career velocity.",

  "geoMarketContext": "2-3 sentences on how their location (${person.location || "their market"}) affects their risk and options. Consider: local industry clusters, remote work trends for their function/level, cost-of-living adjusted comp, talent competition in their area.",

  "retrainingPaths": [
    {
      "rank": 1,
      "title": "Specific role title appropriate to their career stage and function",
      "function": "Which function this falls under",
      "targetLevel": "What level they'd enter at (must be lateral or upward from current)",
      "fitScore": 85,
      "growthScore": 80,
      "aiSafeScore": 75,
      "rationale": "4-5 sentences explaining why this specific transition makes sense for THIS person. Reference their actual career history — specifically their functional profile showing ${functionalProfile.functionalDepthLabel || "their background"}. Explain the logical bridge — why would someone with ${yearsExp} years in ${functionalProfile.dominantFunction || "their field"} be credible and competitive for this role? Include specific companies or sectors where this move is most viable.",
      "skills": ["skill1", "skill2", "skill3", "skill4"],
      "timeToTransition": "Realistic timeline",
      "salaryComparison": "Specific comp comparison"
    }
  ],

  "bottomLine": "4-6 sentences synthesizing everything into an actionable strategic recommendation for this specific person. This should read like advice from a career strategist who knows their full history, not a generic 'upskill and network' platitude. Reference their specific strengths, the 1-2 biggest risks they face, and the most promising path forward given who they are."
}

Include exactly 4 retraining paths ranked by fit. Each path MUST be calibrated to career stage "${careerStage.stage}" — appropriate approaches: ${careerStage.retrainingApproach}.

FORBIDDEN: Do not suggest paths that ignore functional gravity. A ${yearsExp}-year ${functionalProfile.dominantFunction || person.currentFunction || "industry"} professional should NEVER see suggestions like "consider becoming a data engineer" or "explore UX design" unless their career history shows actual affinity for those fields. Every path must have a credible bridge from their actual experience.

Ground every sentence in the actual data provided. No filler. No generic advice. Every claim should be traceable to something in this person's profile, scores, or company data.`;
}

// ─── Pre-Career Narrative ───────────────────────────────────────────────
function preCareerNarrative(person, scores, careerStage) {
  const jobCount = person.jobs?.length || 0;
  const title = (person.currentTitle || "").toLowerCase();
  const internships = summarizeInternships(person.jobs);
  const name = person.name?.split(" ")[0] || person.name || "This person";

  const isStudent = /\b(student|undergraduate|graduate student|phd candidate|research assistant|teaching assistant|fellow|intern)\b/.test(title);
  const currentClassification = classifyRole({
    title: person.currentTitle,
    level: person.currentLevel,
    company: { name: person.currentCompany },
  });
  const isTransitionalRole = currentClassification.type === "ignore";

  // Prestige modifier for career entry paths
  const hasPrestigeInternships = internships && internships.prestigeCount > 0;
  const ambitionNote = hasPrestigeInternships
    ? ` Notably, ${name} has interned at ${internships.prestigeEmployers.join(" and ")}, which suggests a competitive profile and higher-tier career trajectory.`
    : internships && internships.total > 0
    ? ` ${name} has completed ${internships.total} internship${internships.total > 1 ? "s" : ""}, demonstrating proactive career development.`
    : "";

  return {
    isPreCareer: true,
    careerStageAssessment: isStudent
      ? `${person.name} is currently a student${person.education ? ` (${person.education})` : ""}. Career risk assessment isn't applicable at this stage — ${name}'s professional trajectory hasn't begun yet, which is actually an advantage: they can orient toward high-growth, AI-resilient fields from the start.${ambitionNote}`
      : isTransitionalRole
      ? `${person.name} is currently working as ${person.currentTitle}${person.currentCompany ? ` at ${person.currentCompany}` : ""}. This appears to be a transitional role rather than a long-term career position. With ${jobCount <= 1 ? "limited" : "early"} professional history, a traditional risk assessment would not be meaningful — what matters at this stage is where ${name} goes next.${ambitionNote}`
      : `${person.name} is in the earliest stage of their professional career with minimal substantive experience. It's too early to assess career risk in a meaningful way — the data tells us where ${name} is, not where they're going.${ambitionNote}`,

    overviewSummary: `Standard employment risk metrics aren't designed for someone at ${name}'s career stage. Risk scores like AI automation exposure and promotion ceiling assume an established professional role — ${name} ${isStudent ? "hasn't entered the workforce yet" : isTransitionalRole ? "is in a transitional role that doesn't represent their career direction" : "is just getting started"}. Instead of risk analysis, the most valuable insight we can offer is directional: which fields are growing, which credentials open doors, and where the strongest entry-level hiring velocity is right now.`,

    careerPattern: isStudent
      ? `${person.name} is pre-career. No professional pattern to analyze yet.`
      : `${person.name} has ${jobCount} role${jobCount !== 1 ? "s" : ""} on record. ${isTransitionalRole ? "Current position appears to be transitional rather than career-defining." : "Career direction is still forming."} At this stage, the most important signal isn't where ${name} has been — it's what they do next.`,

    aiThreatAnalysis: `AI risk assessment is premature for someone at ${name}'s career stage. Rather than worrying about AI displacing their current ${isTransitionalRole ? "transitional" : "early"} role, ${name} should focus on building skills in areas where human judgment, creativity, and relationship-building remain essential. The best defense against AI disruption is to enter a field where AI augments rather than replaces human work.`,

    aiMitigatingFactors: `${name}'s biggest advantage is timing — entering the workforce now means the opportunity to build a career that's AI-native from the start, rather than having to adapt an existing career to AI disruption.`,

    companyHealthSummary: person.currentCompany
      ? `${person.currentCompany} is ${name}'s current ${isTransitionalRole ? "transitional" : "early-career"} employer. Company health metrics are less relevant at this stage since ${name} is not building a long-term career here.`
      : `No current employer to assess.`,

    promotionAnalysis: `Promotion analysis isn't applicable at the pre-career stage. ${name}'s focus should be on landing the right first professional role rather than climbing a ladder.`,

    geoMarketContext: person.location
      ? `${name} is based in ${person.location}. Local market conditions will matter more once ${name} is targeting specific professional roles.`
      : `Location data not available.`,

    retrainingPaths: buildPreCareerPaths(person, internships, hasPrestigeInternships),

    bottomLine: `${person.name} is at a career inflection point, not a risk point. The traditional risk framework doesn't apply here. ${hasPrestigeInternships ? `The prestige internship experience at ${internships.prestigeEmployers.join(" and ")} is a strong differentiator — ${name} should leverage these brands and the skills gained there when targeting first professional roles. ` : internships && internships.total > 0 ? `The internship experience shows initiative — ${name} should build on this momentum. ` : ""}The most impactful move ${name} can make right now is targeting entry into a high-growth, AI-resilient function and building foundational skills that compound over time.`,
  };
}

// ─── Pre-Career Path Builder ────────────────────────────────────────────
function buildPreCareerPaths(person, internships, hasPrestige) {
  // These are intentionally broader / more directional than career paths
  const basePaths = [
    {
      rank: 1,
      title: "Revenue Operations / Business Operations Analyst",
      function: "Operations",
      targetLevel: "Staff",
      fitScore: 78,
      growthScore: 88,
      aiSafeScore: 72,
      rationale: `Operations roles blend analytical and interpersonal skills, making them strong entry points with high AI resilience. The function is growing rapidly as companies invest in process optimization and cross-functional coordination. ${hasPrestige ? "Prestige internship experience provides a competitive edge for top-tier programs." : ""}`,
      skills: ["Data analysis", "Process design", "CRM/tooling", "Cross-functional communication"],
      timeToTransition: "Immediately targetable",
      salaryComparison: "Entry range $55K-$75K, strong growth trajectory",
    },
    {
      rank: 2,
      title: "Product / Program Coordinator",
      function: "Program and Project Management",
      targetLevel: "Staff",
      fitScore: 75,
      growthScore: 82,
      aiSafeScore: 78,
      rationale: `Product and program roles reward coordination, communication, and stakeholder management — skills that are highly AI-resistant. These roles also provide strong career ladders into management.`,
      skills: ["Stakeholder management", "Project tracking", "Communication", "Prioritization"],
      timeToTransition: "Immediately targetable",
      salaryComparison: "Entry range $50K-$70K, PM track leads to $120K+ within 5 years",
    },
    {
      rank: 3,
      title: "Sales Development Representative (SDR)",
      function: "Sales and Support",
      targetLevel: "Staff",
      fitScore: 72,
      growthScore: 80,
      aiSafeScore: 65,
      rationale: `SDR roles offer low barrier to entry, rapid skill development, and clear promotion paths into account executive and sales leadership positions. High-performing SDRs can advance quickly regardless of educational background.`,
      skills: ["Prospecting", "Communication", "CRM usage", "Objection handling"],
      timeToTransition: "Immediately targetable — most SDR roles require no prior experience",
      salaryComparison: "Base $40K-$55K + commission, AE path leads to $100K+ OTE within 2-3 years",
    },
    {
      rank: 4,
      title: "Technical Support / Customer Success Associate",
      function: "Sales and Support",
      targetLevel: "Staff",
      fitScore: 70,
      growthScore: 75,
      aiSafeScore: 60,
      rationale: `Support and success roles build deep product knowledge and customer empathy, which translates well into product, sales, or operations careers. Strong entry point for those still exploring career direction.`,
      skills: ["Technical troubleshooting", "Customer communication", "Product knowledge", "Documentation"],
      timeToTransition: "Immediately targetable",
      salaryComparison: "Entry range $45K-$65K",
    },
  ];

  // If prestige internships, add more ambitious first option
  if (hasPrestige) {
    basePaths.unshift({
      rank: 0,
      title: "Analyst — Strategy, Investment, or Data",
      function: "Finance and Administration",
      targetLevel: "Staff",
      fitScore: 85,
      growthScore: 90,
      aiSafeScore: 70,
      rationale: `${person.name}'s internship experience at ${internships.prestigeEmployers.join(" and ")} signals competitive readiness for selective analyst programs. These roles offer exceptional career acceleration and optionality — alumni from these programs move into leadership across industries.`,
      skills: ["Financial modeling", "Data analysis", "Strategic thinking", "Presentation skills"],
      timeToTransition: "Target analyst recruiting cycles",
      salaryComparison: "Entry $70K-$100K at top firms, rapid salary growth",
    });
    // Re-rank
    basePaths.forEach((p, i) => (p.rank = i + 1));
    // Keep only top 4
    basePaths.length = 4;
  }

  return basePaths;
}

// ─── Fallback Narrative (when Claude API unavailable) ───────────────────
function fallbackNarrative(person, scores) {
  const careerStage = classifyCareerStage(person);
  const yearsExp = estimateYearsExperience(person.jobs);
  const functionalProfile = buildFunctionalProfile(person.jobs);
  const internships = summarizeInternships(person.jobs);
  const riskLevel =
    scores.overall >= 70
      ? "high"
      : scores.overall >= 50
      ? "moderate-to-elevated"
      : scores.overall >= 30
      ? "moderate"
      : "low";

  const dominantFn = functionalProfile.dominantFunction || person.currentFunction || "their field";

  // Career-stage-aware fallback retraining
  let retrainingPaths;
  if (careerStage.stage === "pinnacle" || careerStage.stage === "senior_executive") {
    retrainingPaths = [
      {
        rank: 1,
        title: "Board Director / Independent Board Member",
        function: "Business Management",
        targetLevel: "C-Team",
        fitScore: 90,
        growthScore: 75,
        aiSafeScore: 95,
        rationale: `With ${yearsExp}+ years of experience and ${person.currentLevel}-level authority at ${person.currentCompany}, board service is a natural extension. Governance, fiduciary oversight, and strategic counsel leverage decades of operating experience in ${dominantFn}.`,
        skills: ["Corporate governance", "Fiduciary oversight", "Strategic advisory", "Risk management"],
        timeToTransition: "3-6 months with existing network",
        salaryComparison: "Board fees typically $200K-$400K per seat with equity",
      },
      {
        rank: 2,
        title: "Fractional / Interim Executive",
        function: "Business Management",
        targetLevel: "C-Team",
        fitScore: 85,
        growthScore: 80,
        aiSafeScore: 90,
        rationale: `The fractional executive market is growing rapidly as companies need experienced ${dominantFn} leaders without full-time overhead. ${person.name}'s depth in ${dominantFn} makes them a strong fit for interim roles.`,
        skills: ["Rapid organizational assessment", "Stakeholder management", "Change leadership", "Operational discipline"],
        timeToTransition: "1-3 months to first engagement",
        salaryComparison: "Day rates $2K-$5K, annualized can exceed full-time comp",
      },
      {
        rank: 3,
        title: `${dominantFn} Advisory / Consulting Practice`,
        function: "Consulting",
        targetLevel: "C-Team",
        fitScore: 82,
        growthScore: 78,
        aiSafeScore: 85,
        rationale: `${yearsExp} years of ${dominantFn} expertise creates a consulting wedge. Focus on the specific domain knowledge accumulated at ${person.currentCompany} and prior roles.`,
        skills: ["Business development", "Engagement management", "Thought leadership", "Client advisory"],
        timeToTransition: "1-3 months to first engagement",
        salaryComparison: "Variable — $300-$600/hr for executive-level consulting",
      },
      {
        rank: 4,
        title: "Portfolio Company CEO / Operating Partner",
        function: "Business Management",
        targetLevel: "C-Team",
        fitScore: 80,
        growthScore: 85,
        aiSafeScore: 88,
        rationale: `PE and VC firms actively recruit experienced operators to lead portfolio companies. ${person.name}'s ${dominantFn} background and executive tenure create a strong operating partner profile.`,
        skills: ["P&L ownership", "Board management", "Scaling operations", "Team building"],
        timeToTransition: "3-9 months through PE/VC network",
        salaryComparison: "Base $250K-$500K+ with significant carried interest / equity",
      },
    ];
  } else if (careerStage.stage === "senior_leader") {
    retrainingPaths = [
      {
        rank: 1,
        title: `VP of ${dominantFn}`,
        function: dominantFn,
        targetLevel: "VP",
        fitScore: 88,
        growthScore: 82,
        aiSafeScore: 80,
        rationale: `Natural upward move from Director-level. ${yearsExp} years in ${dominantFn} and Director-level scope at ${person.currentCompany} provide the operating credibility VPs need. Companies scaling through ${person.currentCompany}'s stage often need leaders who've seen the playbook before.`,
        skills: ["Strategic planning", "P&L ownership", "Org design", "Executive communication"],
        timeToTransition: "3-6 months active search",
        salaryComparison: "15-25% premium for VP-level move",
      },
      {
        rank: 2,
        title: `Startup Head of ${dominantFn}`,
        function: dominantFn,
        targetLevel: "VP",
        fitScore: 82,
        growthScore: 88,
        aiSafeScore: 75,
        rationale: `Series A-C startups seeking first ${dominantFn} leaders value the operational maturity ${person.name} brings from ${person.currentCompany}. The functional depth (${functionalProfile.dominantPct || "significant"}% of career in ${dominantFn}) is exactly what early-stage companies need.`,
        skills: ["Zero-to-one building", "Rapid scaling", "Cross-functional leadership", "Investor communication"],
        timeToTransition: "2-4 months",
        salaryComparison: "Base may be flat but equity upside significant",
      },
      {
        rank: 3,
        title: `${dominantFn} Consulting Practice`,
        function: "Consulting",
        targetLevel: "Director",
        fitScore: 78,
        growthScore: 75,
        aiSafeScore: 82,
        rationale: `${yearsExp} years of ${dominantFn} experience creates a consulting wedge. Focus on the specific domain expertise from ${person.currentCompany}'s industry.`,
        skills: ["Business development", "Engagement management", "Thought leadership", "Client advisory"],
        timeToTransition: "1-3 months to first engagement",
        salaryComparison: "Variable — $150-$300/hr for specialized consulting",
      },
      {
        rank: 4,
        title: "Cross-functional Director / GM role",
        function: "Operations",
        targetLevel: "Director",
        fitScore: 72,
        growthScore: 75,
        aiSafeScore: 70,
        rationale: `Broadening functional scope from ${dominantFn} into general operations or strategy creates a stronger VP candidacy. ${functionalProfile.crossFunctional ? "Career history shows cross-functional comfort, making this a natural expansion." : "Would require building credibility outside primary function."}`,
        skills: ["Process optimization", "Cross-team alignment", "Data-driven decision making", "Change management"],
        timeToTransition: "3-6 months",
        salaryComparison: "Comparable base with broader scope",
      },
    ];
  } else if (careerStage.stage === "mid_career") {
    // Mid-career: paths informed by functional profile
    const isFunctionalSpecialist = functionalProfile.functionalDepth === "deep_specialist";

    retrainingPaths = [
      {
        rank: 1,
        title: isFunctionalSpecialist
          ? `Senior ${dominantFn} Specialist / Lead`
          : `${dominantFn} Manager`,
        function: dominantFn,
        targetLevel: isFunctionalSpecialist ? "Senior Staff" : "Manager",
        fitScore: 85,
        growthScore: 78,
        aiSafeScore: 72,
        rationale: `${isFunctionalSpecialist ? `Deep specialization in ${dominantFn} (${functionalProfile.dominantPct}% of career) makes a senior IC/lead path the most natural next step.` : `${yearsExp} years with primary experience in ${dominantFn} positions ${person.name} for management responsibility.`} Builds directly on existing expertise at ${person.currentCompany}.`,
        skills: isFunctionalSpecialist
          ? ["Deep domain expertise", "Technical mentorship", "Architecture/strategy", "Stakeholder influence"]
          : ["People management", "Hiring and development", "Strategic planning", "Budget ownership"],
        timeToTransition: "3-6 months",
        salaryComparison: "10-20% increase for scope expansion",
      },
      {
        rank: 2,
        title: functionalProfile.crossFunctional
          ? "Operations / Strategy Manager"
          : `Adjacent ${dominantFn === "Engineering" ? "Product" : dominantFn === "Sales and Support" ? "Revenue Operations" : dominantFn === "Marketing and Product" ? "Growth / Analytics" : "Operations"} Role`,
        function: functionalProfile.crossFunctional ? "Operations" : dominantFn === "Engineering" ? "Marketing and Product" : "Operations",
        targetLevel: person.currentLevel || "Staff",
        fitScore: 78,
        growthScore: 82,
        aiSafeScore: 70,
        rationale: `${functionalProfile.crossFunctional ? "Career history shows comfort across multiple functions, making operations/strategy a natural home for this breadth." : `Moving into a function adjacent to ${dominantFn} broadens career optionality while leveraging existing domain knowledge.`}`,
        skills: ["Cross-functional coordination", "Process design", "Data analysis", "Stakeholder management"],
        timeToTransition: "3-6 months with targeted skill development",
        salaryComparison: "Comparable base, different growth trajectory",
      },
      {
        rank: 3,
        title: "Industry Vertical Specialist",
        function: dominantFn,
        targetLevel: person.currentLevel || "Staff",
        fitScore: 75,
        growthScore: 75,
        aiSafeScore: 78,
        rationale: `Deepening industry-specific expertise makes ${person.name} harder to replace and more AI-resistant. Vertical specialists command premium compensation and are less vulnerable to generalist AI tools.`,
        skills: ["Industry knowledge", "Regulatory expertise", "Vertical-specific tooling", "Client/stakeholder relationships"],
        timeToTransition: "6-12 months of deliberate positioning",
        salaryComparison: "15-25% premium for true vertical expertise",
      },
      {
        rank: 4,
        title: "Emerging Tech / AI-Adjacent Role",
        function: dominantFn,
        targetLevel: person.currentLevel || "Staff",
        fitScore: 70,
        growthScore: 90,
        aiSafeScore: 85,
        rationale: `Positioning at the intersection of ${dominantFn} and AI/automation. Rather than being displaced by AI, become the person who implements and manages AI within the function.`,
        skills: ["AI tool proficiency", "Workflow automation", "Change management", "Technical communication"],
        timeToTransition: "3-6 months with upskilling",
        salaryComparison: "Growing premium for AI-literate professionals in all functions",
      },
    ];
  } else {
    // Early career / entry level — broader options, informed by any internship signals
    const hasPrestige = internships && internships.prestigeCount > 0;

    retrainingPaths = [
      {
        rank: 1,
        title: "Revenue Operations / Business Operations",
        function: "Operations",
        targetLevel: person.currentLevel || "Staff",
        fitScore: 80,
        growthScore: 78,
        aiSafeScore: 75,
        rationale: `Operations roles blend analytical and interpersonal skills. ${hasPrestige ? `Internship experience at ${internships.prestigeEmployers.join(", ")} provides competitive positioning for top programs.` : "Strong entry point with clear advancement paths."} Good AI resilience due to cross-functional coordination requirements.`,
        skills: ["Data analysis", "Process design", "CRM architecture", "Cross-functional communication"],
        timeToTransition: "Immediately targetable",
        salaryComparison: "Entry $55K-$75K, strong growth trajectory",
      },
      {
        rank: 2,
        title: hasPrestige ? "Strategy / Investment Analyst" : "Product / Program Coordinator",
        function: hasPrestige ? "Finance and Administration" : "Program and Project Management",
        targetLevel: "Staff",
        fitScore: 77,
        growthScore: 85,
        aiSafeScore: 72,
        rationale: hasPrestige
          ? `Prestige internship background at ${internships.prestigeEmployers.join(", ")} positions ${person.name} for selective analyst programs with exceptional career acceleration.`
          : `Product and program roles reward coordination and stakeholder management — skills with high AI resistance and clear leadership paths.`,
        skills: hasPrestige
          ? ["Financial modeling", "Strategic analysis", "Presentation skills", "Research"]
          : ["Stakeholder management", "Project tracking", "Communication", "Prioritization"],
        timeToTransition: hasPrestige ? "Target analyst recruiting cycles" : "Immediately targetable",
        salaryComparison: hasPrestige ? "Entry $70K-$100K at top firms" : "Entry $50K-$70K, PM track leads to $120K+",
      },
      {
        rank: 3,
        title: "Sales Development Representative (SDR)",
        function: "Sales and Support",
        targetLevel: "Staff",
        fitScore: 72,
        growthScore: 80,
        aiSafeScore: 65,
        rationale: `SDR roles offer rapid skill development and clear promotion paths. High-performing SDRs advance quickly into account executive roles regardless of educational background.`,
        skills: ["Prospecting", "Communication", "CRM usage", "Objection handling"],
        timeToTransition: "Immediately targetable — most require no prior experience",
        salaryComparison: "Base $40K-$55K + commission, AE path to $100K+ OTE in 2-3 years",
      },
      {
        rank: 4,
        title: "Technical Support / Customer Success Associate",
        function: "Sales and Support",
        targetLevel: "Staff",
        fitScore: 70,
        growthScore: 75,
        aiSafeScore: 60,
        rationale: `Support and success roles build deep product knowledge and customer empathy, translating well into product, sales, or operations careers. Strong entry point for exploring career direction.`,
        skills: ["Technical troubleshooting", "Customer communication", "Product knowledge", "Documentation"],
        timeToTransition: "Immediately targetable",
        salaryComparison: "Entry $45K-$65K",
      },
    ];
  }

  return {
    overviewSummary: `${person.name} faces ${riskLevel} employment risk (score: ${scores.overall}/100), primarily driven by ${scores.aiRisk >= 60 ? "AI automation exposure in " + dominantFn : "market dynamics in their sector"}. Their position as ${person.currentTitle} at ${person.currentCompany} provides ${scores.companyInstability <= 30 ? "strong near-term stability" : "some uncertainty"}. With ${yearsExp} years of professional experience${functionalProfile.functionalDepth === "deep_specialist" ? `, deeply concentrated in ${dominantFn}` : ""}, ${person.name}'s career trajectory ${careerStage.stage === "mid_career" || careerStage.stage === "early_career" ? "still has significant room for redirection" : "reflects established expertise that should inform any transition"}.`,

    careerPattern: `Career shows ${functionalProfile.functionalDepthLabel || "a pattern"} across ${yearsExp} years of professional experience (excluding student/part-time work). ${functionalProfile.summary}`,

    aiThreatAnalysis: `The ${dominantFn} function faces ${scores.aiRisk >= 60 ? "significant" : "moderate"} AI disruption risk. AI tools are increasingly automating tasks traditionally performed at the ${person.currentLevel || "individual contributor"} level in this function. ${person.currentLevel === "Manager" || person.currentLevel === "Director" || person.currentLevel === "VP" || person.currentLevel === "C-Team" ? "However, management and strategic decision-making layers have more insulation from direct automation." : "Individual contributors bear the most direct exposure to AI tooling displacement."}`,

    aiMitigatingFactors: `${person.currentLevel === "Manager" || person.currentLevel === "Director" || person.currentLevel === "VP" || person.currentLevel === "C-Team" ? "Management-level position provides meaningful buffer against direct automation — AI replaces tasks, not the judgment layer that coordinates them." : "Focus on developing skills in areas where human judgment, relationship management, and creative problem-solving remain essential."} ${functionalProfile.functionalDepth === "deep_specialist" ? `Deep specialization in ${dominantFn} creates domain expertise that generic AI tools struggle to replicate.` : "Cross-functional experience provides adaptability as AI reshapes individual functions."}`,

    companyHealthSummary: `${person.currentCompany} shows ${scores.companyInstability <= 30 ? "strong growth trajectory" : scores.companyInstability <= 50 ? "stable positioning" : "concerning trends"} based on workforce data. ${scores.companyInstability >= 50 ? "Elevated company instability increases the urgency of career contingency planning." : "Company stability provides runway for deliberate career development."}`,

    promotionAnalysis: `Internal promotion prospects are ${scores.promotionCeiling <= 40 ? "favorable" : scores.promotionCeiling <= 60 ? "competitive" : "challenging"} given current organizational structure. ${careerStage.stage === "mid_career" ? "The next logical step from " + (person.currentLevel || "current level") + " requires demonstrating scope expansion and leadership readiness." : careerStage.stage === "senior_leader" ? "VP-level promotions often require either internal sponsorship or an external move to a company in growth mode." : "Early career promotions often come fastest at high-growth companies with expanding org charts."}`,

    geoMarketContext: person.location
      ? `Based in ${person.location}. Local market conditions and remote work availability for ${dominantFn} roles at the ${person.currentLevel || "individual contributor"} level will affect transition options.`
      : `Location data not available for geographic market analysis.`,

    retrainingPaths,

    bottomLine: `${person.name}'s ${riskLevel} risk score reflects ${scores.aiRisk >= 60 ? "meaningful AI exposure" : "manageable market conditions"} at the ${careerStage.label} stage. ${functionalProfile.functionalDepth === "deep_specialist" ? `The deep concentration in ${dominantFn} is both a strength (hard to replace) and a constraint (fewer lateral options). Retraining paths should build on this foundation rather than abandon it.` : `Functional breadth across the career provides adaptability — lean into this when evaluating transitions.`} ${scores.companyInstability >= 50 ? `Company instability at ${person.currentCompany} adds urgency to contingency planning.` : `Stability at ${person.currentCompany} provides time for deliberate moves.`}`,
  };
}
