// â”€â”€â”€ Claude API â€” Narrative Analysis Generator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Generates risk narratives and future-proofing path recommendations
// v2: Career-informed future-proofing with first-real-job detection,
//     functional profiling, and prestige employer classification

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

// â”€â”€â”€ Prestige Employer List â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Role Classification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ First Real Job Detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Scans chronologically, skips student/part-time roles, returns first "real" job
function findFirstRealJob(jobs) {
  if (!jobs || jobs.length === 0) return null;

  // Sort chronologically (earliest first)
  const sorted = [...jobs].sort((a, b) => {
    const dateA = new Date(a.started_at || a.startDate || a.start_date || "2099");
    const dateB = new Date(b.started_at || b.startDate || b.start_date || "2099");
    return dateA - dateB;
  });

  for (const job of sorted) {
    const classification = classifyRole(job);
    if (classification.type === "real") return job;
  }

  return null; // No real jobs found â€” pre-career
}

// â”€â”€â”€ Years of Experience (from first real job) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function estimateYearsExperience(jobs) {
  if (!jobs || jobs.length === 0) return 0;

  const firstReal = findFirstRealJob(jobs);
  if (!firstReal) return 0;

  const startDate = new Date(firstReal.started_at || firstReal.startDate || firstReal.start_date);
  if (isNaN(startDate)) return 0;

  return Math.max(0, Math.round((Date.now() - startDate) / (365.25 * 24 * 60 * 60 * 1000)));
}

// â”€â”€â”€ Functional Profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    const start = new Date(job.started_at || job.startDate || job.start_date || Date.now());
    const end = job.ended_at || job.endDate || job.end_date
      ? new Date(job.ended_at || job.endDate || job.end_date)
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
    summary = `${Math.round(dominant[1])} years deeply concentrated in ${dominant[0]} (${Math.round(dominantPct * 100)}% of career). Future-proofing paths should respect this functional gravity â€” lateral moves within or adjacent to ${dominant[0]} are most credible.`;
  } else if (functionalDepth === "primary_with_exposure") {
    const secondary = sorted[1] ? sorted[1][0] : "other functions";
    summary = `Primarily ${dominant[0]} (${Math.round(dominantPct * 100)}%) with meaningful exposure to ${secondary}. Has demonstrated ability to cross functional boundaries, which opens broader future-proofing options.`;
  } else if (functionalDepth === "multi_functional") {
    summary = `Career spans multiple functions: ${sorted.slice(0, 3).map(([fn]) => fn).join(", ")}. This breadth suggests adaptability â€” future-proofing paths can be wider than for a specialist.`;
  } else {
    summary = `True generalist with experience across ${sorted.length} functions. Career pattern suggests comfort with reinvention â€” future-proofing paths should leverage this adaptability.`;
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

// â”€â”€â”€ Internship Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Career Stage Classification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        ? "Current role appears transitional â€” not indicative of long-term career direction."
        : "Just entering the workforce. Too early for meaningful risk assessment.",
      retrainingApproach: "career entry paths, high-growth fields, foundational credentials, entry-level roles in growth functions",
      isPreCareer: true,
    };
  }

  // Pinnacle / Apex â€” C-suite, founders, known leaders
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

  // Senior Executive â€” VPs, SVPs, EVPs
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

  // Senior Leader â€” Directors, Senior Directors, Heads of
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

  // Mid-Career â€” Managers, Senior ICs
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

// â”€â”€â”€ Summarize Career History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function summarizeCareerHistory(jobs) {
  if (!jobs || jobs.length === 0) return "No career history available.";
  return jobs
    .slice(0, 10)
    .map((j, i) => {
      const title = j.title || "Unknown Title";
      const company = j.company?.name || j.company || "Unknown Company";
      const start = j.started_at || j.startDate || j.start_date || "?";
      const end = j.ended_at || j.endDate || j.end_date || "Present";
      const level = j.level || "";
      const fn = j.function || "";
      const classification = classifyRole(j);
      const tag = classification.type === "ignore" ? " [STUDENT/PT]"
        : classification.type === "internship"
          ? classification.prestigeInternship ? " [PRESTIGE INTERN]" : " [INTERN]"
          : "";
      return `${i + 1}. ${title} at ${company} (${start} â€“ ${end})${level ? ` [${level}]` : ""}${fn ? ` {${fn}}` : ""}${tag}`;
    })
    .join("\n");
}

// â”€â”€â”€ Helper: Detect Upward Trajectory â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Main Export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function generateNarrative(personData, scores, companyData, salaryData, hiringSignals) {
  // Short-circuit for pre-career / transitional profiles â€” no API call needed
  const careerStage = classifyCareerStage(personData);
  if (careerStage.isPreCareer) {
    return preCareerNarrative(personData, scores, careerStage, hiringSignals);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return fallbackNarrative(personData, scores, hiringSignals);
  }

  const prompt = buildPrompt(personData, scores, companyData, salaryData, hiringSignals);

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
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
    return fallbackNarrative(personData, scores, hiringSignals);
  }
}

// â”€â”€â”€ The Core Prompt â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildPrompt(person, scores, companyData, salaryData, hiringSignals) {
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

  return `You are an elite workforce intelligence analyst creating a deeply personalized employment risk assessment. This is NOT a generic template â€” you must analyze this specific individual's unique career arc, seniority, sector, geography, and personal history to produce insights that could only apply to THIS person.

CRITICAL: If the "Current Function" field below says "Unknown", you MUST infer their function from their job title, company, and career history. A "Client Service Manager" is in Client Success / Account Management. A "Marketing Director" is in Marketing. NEVER write "Unknown" in any narrative â€” always use your inference. If you truly cannot determine function, say "their role" or describe what they do based on their title.

ANTI-SLOP RULES â€” READ THESE CAREFULLY:
1. NEVER write sentences that could apply to any professional at any company. "The strategic, relationship, and judgment dimensions of the role remain firmly human" is SLOP â€” it says nothing specific. DELETE sentences like this.
2. Every sentence must contain at least one of: the person's name, their company name, their specific title, a specific industry detail, a specific company detail, or a specific data point. If a sentence contains none of these, it is filler â€” cut it.
3. If you don't know enough about the company to write something specific, say "Based on what's publicly known about [company]..." and give your best inference. Short and honest beats long and generic.
4. NEVER use these phrases: "remain firmly human", "navigating organizational politics", "making ambiguous tradeoffs", "the human touch", "soft skills", "in an increasingly AI-driven world", "stay ahead of the curve", "lean into", "bridge between technology and the organization". These are filler phrases that add nothing.
5. Shorter and specific always beats longer and generic. If you can say it in 2 sentences with real substance, that is better than 5 sentences of padding.

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
SUBJECT PROFILE
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
Name: ${person.name}
Current Title: ${person.currentTitle || "Unknown"}${person.inferredSpecialty ? `
⚠️ TITLE NOTE: The API returned "${person.currentTitleRaw}" as the current title — this is a normalized/abbreviated version. Based on their career history, their specialty is "${person.inferredSpecialty}". Treat this person as a ${person.currentTitleRaw}-level specialist in ${person.inferredSpecialty}. Use "${person.currentTitleRaw} specializing in ${person.inferredSpecialty.replace(/,?\s*(analyst|manager|specialist|coordinator).*/i, "").trim()}" or similar phrasing when describing their role. Do NOT call them just a "Manager" or generic title throughout the analysis.` : ""}
Current Company: ${person.currentCompany || "Unknown"}
Current Level: ${person.currentLevel || "Unknown"}
Current Function: ${person.currentFunction || "Unknown"} ${(person.currentFunction === "Unknown" || !person.currentFunction) ? `(INFER THIS from their title "${person.currentTitle}" and career history â€” do not write "Unknown" anywhere in the output)` : ""}
Location: ${person.location || "Unknown"}
Education: ${person.education || "Not available"}

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CAREER ANALYSIS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
Career Stage: ${careerStage.label} (${careerStage.stage})
Years of Professional Experience: ${yearsExp} (counted from first substantive role, excluding student/part-time work)
Career Stage Description: ${careerStage.description}

FUNCTIONAL PROFILE:
${functionalProfile.summary}
Dominant Function: ${functionalProfile.dominantFunction || "N/A"} (${functionalProfile.dominantPct || 0}% of career)
Functional Depth: ${functionalProfile.functionalDepthLabel || "N/A"}
Function Breakdown: ${functionalProfile.functionHistory.map((f) => `${f.function}: ${f.years}yr (${f.pct}%)`).join(", ") || "N/A"}
Cross-Functional: ${functionalProfile.crossFunctional ? "Yes â€” has worked across 3+ functions" : "No â€” concentrated career"}

CAREER HISTORY (roles tagged with classification):
${careerHistory}
${internships ? `\nINTERNSHIP PROFILE:\nTotal internships: ${internships.total}\nPrestige internships (${internships.prestigeCount}): ${internships.prestigeEmployers.join(", ") || "None"}\nOther internships (${internships.regularCount}): ${internships.regularEmployers.join(", ") || "None"}\nAmbition signal: ${internships.ambitionSignal}` : ""}

Career Trajectory: ${hasUpwardTrajectory ? "Upward â€” consistent level progression" : "Lateral/Mixed â€” no clear upward pattern"}
Companies: ${companies.length} unique (${companies.slice(0, 5).join(", ")}${companies.length > 5 ? "..." : ""})
Functions: ${functions.join(", ") || "Unknown"}

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
RISK SCORES (0â€“100, higher = more risk)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
Overall Risk: ${scores.overall}/100
AI Automation Risk: ${scores.aiRisk}/100
Company Instability: ${scores.companyInstability}/100
Promotion Ceiling: ${scores.promotionCeiling}/100
Market Demand: ${scores.marketDemand}/100 (inverted â€” higher = weaker demand)

${companyData ? `COMPANY DATA:\n${JSON.stringify(companyData, null, 2)}` : ""}

${salaryData ? `SALARY CONTEXT:\n${JSON.stringify(salaryData, null, 2)}` : ""}

${hiringSignals ? `HIRING SIGNALS -- WHO'S HIRING PEOPLE LIKE ${person.name?.toUpperCase() || "THIS PERSON"}

DATA CAVEAT -- READ BEFORE WRITING: The regional demand data is filtered by FUNCTION ("${hiringSignals.currentFunction || person.currentFunction}") and LEVEL ("${hiringSignals.currentLevel || person.currentLevel}") -- NOT by job title "${hiringSignals.currentTitle || person.currentTitle}". This is a proxy signal. When writing hiringOutlook, STATE this clearly: e.g., "These figures capture ${person.currentFunction}-level hiring broadly in ${hiringSignals.geoCity || person.location?.split(",")[0] || "your area"} -- not exclusively ${person.currentTitle} roles." Then reason specifically: which of these companies would plausibly need a ${person.currentTitle} (not a generic ${person.currentFunction} manager)? Name those companies specifically. Do NOT present the numbers as exact title-level counts.

${hiringSignals.regional ? `REGIONAL DEMAND (${hiringSignals.geoCity || hiringSignals.geoRegion || person.location || "their area"}, last 6 months):
Filter: function="${hiringSignals.currentFunction || person.currentFunction}" + level="${hiringSignals.currentLevel || person.currentLevel}" -- NOT title-specific
Total hires in this band: ${hiringSignals.regional.totalHires} across ${hiringSignals.regional.totalCompanies} companies
Top companies: ${hiringSignals.regional.topCompanies.slice(0, 15).map(c => `${c.name} (${c.hires})`).join(", ")}` : "Regional demand data: Not available"}

${hiringSignals.employerFlow ? `EMPLOYER NETWORK (where people from ${person.name}'s past companies went):
Total alumni tracked: ${hiringSignals.employerFlow.totalAlumni} people -> ${hiringSignals.employerFlow.totalDestinations} companies
Source employers: ${(hiringSignals.employerNames || []).join(", ")}
Top destinations: ${hiringSignals.employerFlow.topDestinations.slice(0, 15).map(d => `${d.name} (${d.count})`).join(", ")}` : "Employer network data: Not available"}

${hiringSignals.school ? `SCHOOL NETWORK (${(hiringSignals.schools || []).join(", ")} alumni in ${person.currentFunction}):
Total alumni hires: ${hiringSignals.school.totalHires} across ${hiringSignals.school.totalCompanies} companies
Top companies: ${hiringSignals.school.topCompanies.slice(0, 15).map(c => `${c.name} (${c.hires})`).join(", ")}` : "School network data: Not available"}

${hiringSignals.multiSignal?.length > 0 ? `MULTI-SIGNAL COMPANIES (appear in 2+ signals -- warmest doors):
${hiringSignals.multiSignal.slice(0, 10).map(c => `${c.name}: ${c.signals.join(" + ")} (weight: ${c.totalWeight})`).join("\n")}` : "No multi-signal companies detected"}` : ""}
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
INSTRUCTIONS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

CRITICAL RULES FOR FUTURE-PROOFING PATHS:

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
      ? `Education: ${person.education}. ${yearsExp >= 15 ? "Given 15+ years of experience, education is a minor factor â€” career history IS the credential. Mention education only if directly relevant." : yearsExp >= 5 ? "Education provides some context but career history is the stronger signal." : "Education is a meaningful signal at this career stage. Consider degree field and institution when suggesting paths."}`
      : "No education data available. Base future-proofing paths entirely on career history."
  }

4. ROLES TAGGED [STUDENT/PT] OR [INTERN] in the career history should NOT inform future-proofing path recommendations. They are included for context only. Roles tagged [PRESTIGE INTERN] suggest higher capability/ambition but still should not be treated as career experience.

Return ONLY this JSON structure (all string values are instructions to Claude for what to write -- replace with actual content):

{
  "overviewSummary": "MINIMUM 6-8 substantive sentences. This is the first thing the user reads -- it must feel like a real analyst wrote it specifically about THIS person. Start with: what does ${person.currentTitle} at ${person.currentCompany} actually mean -- what does that company do, what does someone in this title actually spend their day doing? Then: what are the 2-3 most material risk factors for THIS specific person (not their function generically) -- AI exposure at the title level, company trajectory, local market conditions. Then: what is the most important thing they should know right now? Reference ${person.name}, ${person.currentTitle}, ${person.currentCompany}, ${person.location?.split(',')[0]} specifically. FORBIDDEN: do not write a single sentence that could apply to any manager at any company.",

  "careerPattern": "3-4 sentences analyzing their career arc. Reference specific moves, tenure patterns, functional concentration or breadth, and what the pattern suggests about their professional identity and adaptability. Note: their professional career started with their first real role, not student/part-time work.",

  "aiThreatAnalysis": "TITLE-LEVEL ANALYSIS REQUIRED. This person is a ${person.currentTitle} -- NOT a generic ${person.currentFunction} manager. Before writing, reason through what a ${person.currentTitle} at ${person.currentCompany} actually does all day: what platforms they manage, what deliverables they own, what decisions they make, what meetings they attend. Then analyze AI threat at THAT level of specificity.\n\nPARAGRAPH 1 -- WHAT ${person.name?.split(' ')[0] || 'THIS PERSON'} ACTUALLY DOES: Describe the specific daily work of a ${person.currentTitle} at ${person.currentCompany} -- the platforms, campaigns, budgets, reporting cadences, client or internal stakeholder relationships. Then name specifically which parts of that work AI is already doing or will do within 12-24 months. Be concrete: not 'AI tools are changing marketing' but 'the specific workflow of [X] is being automated by [type of AI capability].'\n\nPARAGRAPH 2 -- WHAT AI CANNOT REPLACE: Be specific about what protects ${person.name} in this exact role at ${person.currentCompany}. Not 'relationship skills' generically -- what specific relationships, institutional knowledge, judgment calls, or trust dynamics exist in a ${person.currentTitle} role that AI cannot replicate? If you cannot name something specific, be brief rather than padding with generalities.\n\nPARAGRAPH 3 -- TIMELINE AND IMPACT: When does AI become a material threat to ${person.name} specifically? Consider their ${yearsExp} years of experience, the adoption pace in ${person.currentCompany}'s specific industry, and whether AI is more likely to eliminate the role, compress the team, reduce their leverage, or amplify their value. Be specific about the likely scenario.\n\nCRITICAL: Every sentence must be anchored to ${person.currentTitle} at ${person.currentCompany}. Delete any sentence that could apply to a different title in the same function.",

  "aiMitigatingFactors": "Write 2-3 paragraphs, every sentence referencing ${person.name}, ${person.currentCompany}, or their specific title. PARAGRAPH 1: What specifically protects ${person.name} RIGHT NOW in the ${person.currentTitle} role? Name concrete things at the title level. PARAGRAPH 2: What should ${person.name} specifically do -- not 'learn AI tools' generically, but which specific capabilities in paid social / performance marketing / [their actual specialty] should they develop? What would make ${person.name} the person who deploys AI in their function rather than the person displaced by it? DO NOT use these phrases: 'become the bridge between technology', 'lean into AI transformation', 'stay ahead of the curve', 'the human touch'.",

  "companyHealthNarrative": "THIS SECTION IS COMPANY INTELLIGENCE, NOT PERSON ANALYSIS. Write 6-8 sentences about ${person.currentCompany} as a business. Do NOT write about ${person.name}'s personal risk, career prospects, or role. Structure: (1) What does ${person.currentCompany} actually do -- products, clients, market, business model. Who are their customers? What do they sell? (2-3 sentences). (2) Where does ${person.currentCompany} sit in its competitive landscape -- market leader, challenger, or niche player? Who are their main competitors? What are the business headwinds or tailwinds in their market? (2 sentences). (3) What does the workforce intelligence show -- headcount trajectory over the last 2 years, which functions are growing or contracting, hiring velocity relative to peers, any signs of restructuring or expansion? (2-3 sentences). FORBIDDEN: Do not mention ${person.name} by name. Do not write about career risk. This is a company profile, not a personal risk assessment.",

  "companyAiExposure": "THIS SECTION IS ABOUT THE COMPANY, NOT THE PERSON. Do NOT write about how AI affects ${person.name}\'s job or career. Write about ${person.currentCompany} as a business entity.\n\nWrite 4-6 sentences structured as: (1) What is ${person.currentCompany}\'s own relationship with AI — is AI disrupting their product, their market, or their cost structure? Is ${person.currentCompany} a company that sells AI, uses AI to deliver its services, or is being threatened by AI competitors? (2) What is happening to AI adoption in ${person.currentCompany}\'s specific industry — is the sector early, mid, or late in AI disruption? Name the specific AI forces at play in that industry. (3) What does this mean for ${person.currentCompany}\'s competitive position — are they investing in AI to stay ahead, or are they at risk of being disrupted by a competitor who is? (4) What does this company trajectory mean for anyone working there right now — is this a company accelerating into AI or one being disrupted by it?\n\nFORBIDDEN: Do not write a single sentence about ${person.name}\'s job duties, career risk, or personal AI exposure. This section is company-level intelligence only.",

  "promotionAnalysis": "3-4 sentences on internal mobility prospects. Given ${person.name}'s current level at ${person.currentCompany}, what is the realistic next rung? Is the company growing fast enough to create those roles? Does the ${person.currentTitle} function have a clear leadership ladder at ${person.currentCompany}?",

  "localMarketSummary": "3-4 sentences specifically about the ${person.location?.split(',')[0] || 'local'} market for ${person.currentTitle} roles -- NOT for ${person.currentFunction} broadly. What is the employer landscape for this specific title in this city? Which industries in ${person.location?.split(',')[0]} are most likely to hire a ${person.currentTitle}? Is this a strong or thin local market for this specific role?",

  "hiringOutlook": "USE THE HIRING SIGNALS DATA. PARAGRAPH 1: State the data caveat clearly -- the hiring signal figures capture ${person.currentFunction}-level hiring in ${hiringSignals?.geoCity || person.location?.split(',')[0] || 'their area'}, not exclusively ${person.currentTitle} roles. Then give the headline number. Then name the top 5-8 companies from the regional data and REASON about which of those specifically is likely to need a ${person.currentTitle} (e.g., a DTC brand, an agency, a tech company with a large paid social budget) vs. which hired for other marketing roles. PARAGRAPH 2: Employer network -- where did people from ${person.name}'s past companies go? Name specific companies. These are warm doors, not cold applications. PARAGRAPH 3: Multi-signal companies if any -- name them and explain why they are the warmest targets. PARAGRAPH 4: Actionable -- where should ${person.name} specifically be looking given ALL signals? Be direct about the 2-3 highest-probability targets and why. Reference actual company names from the data throughout.",

  "retrainingPaths": [
    {
      "rank": 1,
      "title": "Specific role title that is a credible next step for a ${person.currentTitle} with ${yearsExp} years experience",
      "function": "Which function this falls under",
      "targetLevel": "Must be lateral or upward from current level '${person.currentLevel}'",
      "fitScore": 85,
      "growthScore": 80,
      "aiSafeScore": 75,
      "rationale": "4-5 sentences. Why does this specific transition make sense for someone who has spent ${yearsExp} years as a ${person.currentTitle}? What skills transfer directly? What is the credible bridge? Name specific companies or sectors in ${person.location?.split(',')[0] || 'their area'} where this move is most viable.",
      "skills": ["specific skill relevant to their actual background", "another specific skill"],
      "timeToTransition": "Realistic timeline",
      "salaryComparison": "Specific comp comparison vs their current likely salary"
    }
  ],

  "bottomLine": "5-7 sentences. Read like advice from a career strategist who has studied ${person.name}'s full history and knows ${person.currentCompany} well. Name their specific strengths (from their actual career history), the 1-2 biggest risks they face right now (specific to their title and company), and the highest-leverage thing they could do in the next 90 days. No platitudes. Nothing that could apply to a different person."
}

Include exactly 4 future-proofing paths ranked by fit. Each path MUST be for a ${person.currentTitle} with this specific career history -- not a generic ${person.currentFunction} professional. Every path must have a credible, title-specific bridge from their actual experience.

FORBIDDEN PATHS: Do not suggest roles that have no connection to ${person.currentTitle}'s actual daily work. A Paid Social Manager does not become a data engineer. Every path must be legible to someone reading their LinkedIn.

Ground every sentence in the actual data. No filler. No generic advice.`;
}

// â”€â”€â”€ Pre-Career Narrative â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function preCareerNarrative(person, scores, careerStage, hiringSignals) {
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
      ? `${person.name} is currently a student${person.education ? ` (${person.education})` : ""}. Career risk assessment isn't applicable at this stage â€” ${name}'s professional trajectory hasn't begun yet, which is actually an advantage: they can orient toward high-growth, AI-resilient fields from the start.${ambitionNote}`
      : isTransitionalRole
      ? `${person.name} is currently working as ${person.currentTitle}${person.currentCompany ? ` at ${person.currentCompany}` : ""}. This appears to be a transitional role rather than a long-term career position. With ${jobCount <= 1 ? "limited" : "early"} professional history, a traditional risk assessment would not be meaningful â€” what matters at this stage is where ${name} goes next.${ambitionNote}`
      : `${person.name} is in the earliest stage of their professional career with minimal substantive experience. It's too early to assess career risk in a meaningful way â€” the data tells us where ${name} is, not where they're going.${ambitionNote}`,

    overviewSummary: `Standard employment risk metrics aren't designed for someone at ${name}'s career stage. Risk scores like AI automation exposure and promotion ceiling assume an established professional role â€” ${name} ${isStudent ? "hasn't entered the workforce yet" : isTransitionalRole ? "is in a transitional role that doesn't represent their career direction" : "is just getting started"}. Instead of risk analysis, the most valuable insight we can offer is directional: which fields are growing, which credentials open doors, and where the strongest entry-level hiring velocity is right now.`,

    careerPattern: isStudent
      ? `${person.name} is pre-career. No professional pattern to analyze yet.`
      : `${person.name} has ${jobCount} role${jobCount !== 1 ? "s" : ""} on record. ${isTransitionalRole ? "Current position appears to be transitional rather than career-defining." : "Career direction is still forming."} At this stage, the most important signal isn't where ${name} has been â€” it's what they do next.`,

    aiThreatAnalysis: `AI risk assessment is premature for someone at ${name}'s career stage. Rather than worrying about AI displacing their current ${isTransitionalRole ? "transitional" : "early"} role, ${name} should focus on building skills in areas where human judgment, creativity, and relationship-building remain essential. The best defense against AI disruption is to enter a field where AI augments rather than replaces human work.`,

    aiMitigatingFactors: `${name}'s biggest advantage is timing â€” entering the workforce now means the opportunity to build a career that's AI-native from the start, rather than having to adapt an existing career to AI disruption.`,

    companyHealthSummary: person.currentCompany
      ? `${person.currentCompany} is ${name}'s current ${isTransitionalRole ? "transitional" : "early-career"} employer. Company health metrics are less relevant at this stage since ${name} is not building a long-term career here.`
      : `No current employer to assess.`,

    promotionAnalysis: `Promotion analysis isn't applicable at the pre-career stage. ${name}'s focus should be on landing the right first professional role rather than climbing a ladder.`,

    geoMarketContext: person.location
      ? `${name} is based in ${person.location}. Local market conditions will matter more once ${name} is targeting specific professional roles.`
      : `Location data not available.`,

    hiringOutlook: buildFallbackHiringOutlook(person, hiringSignals),

    retrainingPaths: buildPreCareerPaths(person, internships, hasPrestigeInternships),

    bottomLine: `${person.name} is at a career inflection point, not a risk point. The traditional risk framework doesn't apply here. ${hasPrestigeInternships ? `The prestige internship experience at ${internships.prestigeEmployers.join(" and ")} is a strong differentiator â€” ${name} should leverage these brands and the skills gained there when targeting first professional roles. ` : internships && internships.total > 0 ? `The internship experience shows initiative â€” ${name} should build on this momentum. ` : ""}The most impactful move ${name} can make right now is targeting entry into a high-growth, AI-resilient function and building foundational skills that compound over time.`,
  };
}

// â”€â”€â”€ Pre-Career Path Builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      rationale: `Product and program roles reward coordination, communication, and stakeholder management â€” skills that are highly AI-resistant. These roles also provide strong career ladders into management.`,
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
      timeToTransition: "Immediately targetable â€” most SDR roles require no prior experience",
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
      title: "Analyst â€” Strategy, Investment, or Data",
      function: "Finance and Administration",
      targetLevel: "Staff",
      fitScore: 85,
      growthScore: 90,
      aiSafeScore: 70,
      rationale: `${person.name}'s internship experience at ${internships.prestigeEmployers.join(" and ")} signals competitive readiness for selective analyst programs. These roles offer exceptional career acceleration and optionality â€” alumni from these programs move into leadership across industries.`,
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

// â”€â”€â”€ Infer function from job title when LiveData returns Unknown â”€â”€â”€â”€â”€â”€â”€â”€â”€
function inferFunctionFromTitle(title) {
  if (!title) return "their function";
  const t = title.toLowerCase();
  if (/\b(sales|account exec|account manager|bdr|sdr|business develop|revenue)\b/.test(t)) return "Sales";
  if (/\b(client service|client success|customer success|customer service|support)\b/.test(t)) return "Client Services";
  if (/\b(marketing|brand|content|growth|demand gen|communications|pr\b)/.test(t)) return "Marketing";
  if (/\b(engineer|developer|software|sre|devops|architect|full.?stack|front.?end|back.?end)\b/.test(t)) return "Engineering";
  if (/\b(product manager|product lead|product director)\b/.test(t)) return "Product";
  if (/\b(design|ux|ui|creative)\b/.test(t)) return "Design";
  if (/\b(data scien|data analy|analytics|machine learning|ml\b|ai\b)\b/.test(t)) return "Data & Analytics";
  if (/\b(finance|controller|accounting|cfo|treasurer|fp&a)\b/.test(t)) return "Finance";
  if (/\b(hr\b|human resource|people ops|talent|recruit)\b/.test(t)) return "People / HR";
  if (/\b(operations|ops\b|supply chain|logistics|procurement)\b/.test(t)) return "Operations";
  if (/\b(legal|counsel|compliance|regulatory)\b/.test(t)) return "Legal";
  if (/\b(ceo|coo|cto|cfo|chief|president|general manager|managing director)\b/.test(t)) return "Executive Leadership";
  if (/\b(consult|advisory|strateg)\b/.test(t)) return "Consulting";
  if (/\b(project manager|program manager|scrum|agile)\b/.test(t)) return "Program Management";
  return "their function";
}

// â”€â”€â”€ Function-Specific AI Threat Analysis (Fallback) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Generates 3+ paragraphs of AI risk analysis â€” must be specific, not generic
function buildFallbackAIThreat(person, scores, dominantFn, yearsExp, careerStage, functionalProfile) {
  const level = (person.currentLevel || "Staff").toLowerCase();
  const isLeader = ["manager", "director", "vp", "c-team"].includes(level);
  const isExec = ["vp", "c-team"].includes(level);
  const title = person.currentTitle || "their current role";
  const company = person.currentCompany || "their company";
  const name = person.name?.split(" ")[0] || person.name || "This person";
  const riskSeverity = scores.aiRisk >= 70 ? "high" : scores.aiRisk >= 50 ? "elevated" : scores.aiRisk >= 30 ? "moderate" : "low";

  // Infer function from title if Unknown
  const fn = (dominantFn && dominantFn !== "Unknown") ? dominantFn : inferFunctionFromTitle(title);

  // Company-aware, role-specific analysis
  const para1 = `As ${title} at ${company}, ${name} faces ${riskSeverity} AI disruption pressure. ${scores.companyInstability <= 30 ? `${company}'s growth trajectory suggests resources to invest in AI tools that could augment or compress the team.` : scores.companyInstability >= 50 ? `Workforce instability at ${company} may accelerate AI adoption as the company looks to do more with fewer people.` : `The pace of AI adoption at ${company} will depend on competitive pressure in their market.`} The tasks most immediately at risk in ${name}'s role are those involving data gathering, report generation, routine analysis, and workflow coordination â€” the repetitive components that AI handles with increasing competence.`;

  const para2 = isLeader
    ? `At the ${person.currentLevel} level, ${name}'s risk is less about personal displacement and more about team compression. AI-augmented teams need fewer people to achieve the same output, which means ${name}'s organization at ${company} may shrink even as their personal scope stays the same or grows. The ${yearsExp} years of experience across ${(person.jobs || []).slice(0, 3).map(j => j.company).filter(Boolean).join(", ")} represent accumulated institutional knowledge that AI doesn't have â€” but ${name} needs to be actively demonstrating that this knowledge translates to better decisions, not just longer tenure.`
    : `At the ${person.currentLevel || "Staff"} level, ${name}'s protection comes from the specific institutional knowledge built over ${yearsExp} years â€” understanding how things actually work at ${company}, which stakeholders matter, and what the data doesn't tell you. These are things AI lacks. The risk is that AI raises the productivity bar: ${company} may expect the same output from fewer people, or expect significantly more output from the same team. ${name} needs to be the person whose productivity goes up with AI, not the person whose role AI makes redundant.`;

  const para3 = `AI's impact on ${name}'s role at ${company} will likely become material over the next ${scores.aiRisk >= 60 ? "12-24 months" : "2-4 years"}. ${isLeader ? `The most likely scenario is that ${name} manages a smaller, more AI-augmented team â€” same scope, fewer direct reports. The question is whether ${name} is the one driving that transition at ${company} or reacting to it.` : `The most likely scenario isn't sudden displacement but a shift in expectations â€” the same output requires less time, so ${company} either adds responsibilities or reduces headcount. Building fluency with AI tools specific to ${fn} now, while adoption is still early, is the highest-leverage move available.`}`;

  return `${para1}\n\n${para2}\n\n${para3}`;
}

// â”€â”€â”€ Function-Specific AI Mitigation Analysis (Fallback) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildFallbackAIMitigation(person, scores, dominantFn, yearsExp, careerStage, functionalProfile) {
  const level = (person.currentLevel || "Staff").toLowerCase();
  const isLeader = ["manager", "director", "vp", "c-team"].includes(level);
  const name = person.name?.split(" ")[0] || person.name || "This person";
  const company = person.currentCompany || "their company";
  const fn = (dominantFn && dominantFn !== "Unknown") ? dominantFn : inferFunctionFromTitle(person.currentTitle || "");

  let protection, action;

  if (isLeader) {
    protection = `${name}'s ${person.currentLevel}-level position at ${company} provides structural protection. The role depends on institutional knowledge built over ${yearsExp} years across ${(person.jobs || []).slice(0, 3).map(j => j.company).filter(Boolean).join(", ")} â€” understanding which clients matter most, how decisions actually get made, and what the data doesn't capture about ${company}'s market. ${functionalProfile.functionalDepth === "deep_specialist" ? `Deep specialization in ${fn} (${functionalProfile.dominantPct}% of career) adds another layer â€” ${name}'s domain expertise is the product of years of pattern recognition in specific situations that AI's training data doesn't cover.` : `Cross-functional breadth across ${functionalProfile.functionHistory.length} areas gives ${name} the ability to shift focus as AI reshapes specific functions.`}`;

    action = `${name} should be the person at ${company} who decides how AI gets used in ${fn}, not someone who watches it happen. Concretely: identify the 2-3 workflows in the team that are most obviously AI-automatable, pilot tools for those, and own the results. Managers who can show "I reduced team effort by 30% on X using AI" are the ones who get promoted, not replaced. ${name} should also be building AI fluency across the team â€” the manager whose people are AI-proficient is more valuable than the manager who needs headcount to scale.`;
  } else {
    protection = `${name}'s primary protection comes from the specific context built over ${yearsExp} years. ${yearsExp >= 8 ? `${name} understands how things actually work at ${company} â€” which stakeholders matter, what the real priorities are behind the stated ones, and how to get things done in the organization. This institutional knowledge is exactly what AI lacks.` : yearsExp >= 3 ? `${name} is building the domain knowledge and professional relationships that distinguish a skilled practitioner from a task executor. Every year at ${company} makes ${name} harder to replace because the accumulated judgment becomes more valuable as AI handles more routine work.` : `Early in their career, ${name}'s main advantage is the ability to adopt AI tools faster than more established colleagues. The professionals who thrive will be those who are AI-native from the start.`}`;

    action = `${name} should focus on three things: (1) becoming proficient with AI tools relevant to ${fn} â€” the person who uses AI effectively is worth more than the person who doesn't, (2) building skills AI handles poorly: managing complex stakeholder situations, creative problem-solving with incomplete information, and making calls that require understanding ${company}'s specific context, and (3) making sure the right people at ${company} see ${name} as someone who brings judgment, not just task completion. ${yearsExp >= 5 ? `At this stage, the goal is to be the person who decides how AI is used in ${fn} at ${company}, not the person whose work AI replaces.` : `At this stage, the goal is to build expertise fast enough that by the time AI handles routine work, ${name} is already operating at the judgment layer.`}`;
  }

  return `${protection}\n\n${action}`;
}

// â”€â”€â”€ Fallback Hiring Outlook (data-driven hope narrative) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildFallbackHiringOutlook(person, signals) {
  if (!signals) return "Hiring signal data is not available for this profile.";

  const name = person.name?.split(" ")[0] || person.name || "This person";
  const fn = person.currentFunction || "their function";
  const lvl = person.currentLevel || "their level";
  const title = person.currentTitle || fn + ' professional';
  const geo = signals.geoCity || signals.geoRegion || (person.location || '').split(',')[0]?.trim() || 'their area';
  const paragraphs = [];

  // P1: Regional demand headline
  if (signals.regional && signals.regional.totalHires > 0) {
    const top5 = signals.regional.topCompanies.slice(0, 6).map((c) => c.name).join(", ");
    paragraphs.push(
      `The market is actively hiring people with ${name}'s profile. In ${geo} over the last 6 months, ${signals.regional.totalHires} ${fn} professionals at the ${lvl} level were hired across ${signals.regional.totalCompanies} companies — this data captures the ${fn} function broadly, not exclusively ${title} roles, but it represents the best available signal for demand in ${name}'s market. The most active employers include ${top5}. This isn't a hypothetical â€” these are real hires of people in the same function, at the same level, in ${name}'s geography. The demand signal is ${signals.regional.totalHires >= 100 ? "very strong" : signals.regional.totalHires >= 30 ? "solid" : "present and growing"}.`
    );
  } else {
    paragraphs.push(
      `While regional hiring data for ${fn} at the ${lvl} level in ${geo} is limited in our sample, this doesn't mean the market is quiet â€” it may reflect the specificity of the search criteria. Broadening the geographic scope or considering adjacent functions often reveals substantial demand.`
    );
  }

  // P2: Employer network
  if (signals.employerFlow && signals.employerFlow.totalAlumni > 0) {
    const top5 = signals.employerFlow.topDestinations.slice(0, 6).map((d) => `${d.name} (${d.count})`).join(", ");
    const employers = (signals.employerNames || []).slice(0, 4).join(", ");
    paragraphs.push(
      `${name}'s professional network is a real asset. People who have left ${employers} in ${fn} roles have landed at ${signals.employerFlow.totalDestinations} different companies, including ${top5}. These aren't cold leads â€” they're proven pathways where ${name}'s background and employer brand carry weight. Former colleagues at these companies represent warm connections that dramatically improve the odds of a successful move.`
    );
  }

  // P3: School network
  if (signals.school && signals.school.totalHires > 0) {
    const schools = (signals.schools || []).join(", ");
    const top5 = signals.school.topCompanies.slice(0, 6).map((c) => `${c.name} (${c.hires})`).join(", ");
    paragraphs.push(
      `The ${schools} alumni network is another source of opportunity. In the last 6 months, ${signals.school.totalHires} alumni were hired into ${fn} roles across ${signals.school.totalCompanies} companies, including ${top5}. Alumni networks create a shared-identity advantage in hiring â€” recruiters and hiring managers disproportionately favor candidates from their own alma mater.`
    );
  }

  // P4: Multi-signal companies (the warmest opportunities)
  if (signals.multiSignal && signals.multiSignal.length > 0) {
    const SIGNAL_LABELS = {
      hiring_locally: "hiring in your area",
      employer_network: "your employer network",
      school_network: "your school network",
      function_growth: "building your function",
    };
    const top = signals.multiSignal.slice(0, 5).map((c) => {
      const labels = c.signals.map((s) => SIGNAL_LABELS[s] || s).join(" + ");
      return `${c.name} (${labels})`;
    }).join("; ");
    paragraphs.push(
      `The strongest opportunities are at companies showing multiple hiring signals. ${top}. These companies appear across two or more data dimensions â€” meaning they're not just hiring in ${name}'s function, they're also connected to ${name}'s professional or educational network. Multi-signal companies represent the warmest targets for outreach because ${name} likely has shared context with people already there.`
    );
  }

  // Final paragraph if we have any data
  if (paragraphs.length > 1) {
    paragraphs.push(
      `The bottom line: the market has room for ${name}. This isn't about sending hundreds of cold applications â€” it's about identifying the companies where ${name}'s background, network, and skills create a natural advantage. The data shows those companies exist and are actively hiring.`
    );
  }

  return paragraphs.join("\n\n");
}

// â”€â”€â”€ Fallback Narrative (when Claude API unavailable) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function fallbackNarrative(person, scores, hiringSignals) {
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

  let dominantFn = functionalProfile.dominantFunction || person.currentFunction || "their field";
  if (dominantFn === "Unknown" || dominantFn === "unknown") {
    dominantFn = inferFunctionFromTitle(person.currentTitle || "") || "their field";
  }

  // Career-stage-aware fallback future-proofing
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
        salaryComparison: "Variable â€” $300-$600/hr for executive-level consulting",
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
        salaryComparison: "Variable â€” $150-$300/hr for specialized consulting",
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
    // Early career / entry level â€” broader options, informed by any internship signals
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
          : `Product and program roles reward coordination and stakeholder management â€” skills with high AI resistance and clear leadership paths.`,
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
        timeToTransition: "Immediately targetable â€” most require no prior experience",
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

  const city = (person.location || '').split(',')[0]?.trim() || 'their area';
  const title = person.currentTitle || 'their role';

  return {
    overviewSummary: `${person.name} works as a ${title} at ${person.currentCompany} in ${city}, with an overall employment risk score of ${scores.overall}/100. ${scores.aiRisk >= 60 ? `The primary driver is AI exposure — roles like ${title} that involve repeatable campaign management, reporting, and execution workflows are increasingly within reach of AI tooling.` : scores.companyInstability >= 50 ? `The primary driver is company instability at ${person.currentCompany}, which adds uncertainty to their near-term situation.` : `Risk is moderate — a combination of AI exposure and market dynamics warrants attention.`} With ${yearsExp} years of experience${functionalProfile.functionalDepth === 'deep_specialist' ? ` concentrated in ${dominantFn}` : ''}, ${person.name}'s background is established enough to anchor a deliberate move but early enough to redirect. ${scores.companyInstability <= 30 ? `${person.currentCompany} appears stable, providing runway for planning.` : `Instability signals at ${person.currentCompany} suggest contingency planning should be active now.`} The key question is whether ${person.name} is building skills and relationships that outlast this specific role.`,

    careerPattern: `Career shows ${functionalProfile.functionalDepthLabel || 'a pattern'} across ${yearsExp} years of professional experience (excluding student/part-time work). ${functionalProfile.summary}`,

    aiThreatAnalysis: buildFallbackAIThreat(person, scores, dominantFn, yearsExp, careerStage, functionalProfile),

    aiMitigatingFactors: buildFallbackAIMitigation(person, scores, dominantFn, yearsExp, careerStage, functionalProfile),

    companyHealthNarrative: `${person.currentCompany} shows ${scores.companyInstability <= 30 ? 'a stable growth trajectory' : scores.companyInstability <= 50 ? 'stable positioning' : 'signs of instability'} based on workforce data. ${scores.companyInstability >= 50 ? `Elevated instability at ${person.currentCompany} increases urgency for contingency planning.` : `Stability at ${person.currentCompany} provides runway for deliberate career development.`} Headcount and hiring patterns suggest ${scores.companyInstability <= 30 ? 'the company is investing and growing' : 'the company may be under cost pressure or restructuring'}.`,

    companyAiExposure: `${person.currentCompany} operates in an industry where AI is ${scores.aiRisk >= 60 ? 'advancing rapidly, putting pressure on traditional workflows and headcount models' : 'beginning to reshape operations, though adoption pace varies by company'}. Whether ${person.currentCompany} is investing in AI to stay competitive or at risk of being disrupted by AI-native competitors depends on their specific market position and product strategy. Companies in ${dominantFn}-heavy sectors that fail to adapt AI into their service delivery are increasingly at a cost disadvantage versus those that do. The workforce data trends at ${person.currentCompany} — ${scores.companyInstability <= 30 ? 'showing stable growth' : scores.companyInstability <= 50 ? 'showing moderate stability' : 'showing signs of instability'} — may reflect how the company is navigating this shift.`,

    promotionAnalysis: `Internal promotion prospects are ${scores.promotionCeiling <= 40 ? 'favorable' : scores.promotionCeiling <= 60 ? 'competitive' : 'challenging'} given current organizational structure at ${person.currentCompany}. ${careerStage.stage === 'mid_career' ? `The next step from ${person.currentLevel || 'current level'} requires demonstrating scope expansion and leadership readiness.` : careerStage.stage === 'senior_leader' ? 'VP-level promotions often require internal sponsorship or an external move to a company in growth mode.' : 'Earlier-career promotions come fastest at high-growth companies with expanding org charts.'}`,

    localMarketSummary: person.location
      ? `The ${city} market for ${title} roles reflects the broader ${dominantFn} talent landscape in that metro. ${hiringSignals?.regional?.totalHires > 0 ? `Recent data shows active demand across ${hiringSignals.regional.totalCompanies} companies in the area.` : 'Local hiring signal data is limited for this specific title.'} ${person.name} should consider whether a remote-open strategy expands options significantly beyond ${city}.`
      : 'Location data not available for geographic market analysis.',

    hiringOutlook: buildFallbackHiringOutlook(person, hiringSignals),

    retrainingPaths,

    bottomLine: `${person.name}'s ${riskLevel} risk score as a ${title} at ${person.currentCompany} reflects ${scores.aiRisk >= 60 ? 'real AI exposure in a role where automation is advancing quickly' : 'manageable conditions with no acute crisis'}. ${functionalProfile.functionalDepth === 'deep_specialist' ? `Deep concentration in ${dominantFn} is a strength — hard to replace — but lateral options are narrower. Future-proofing should build on this foundation.` : 'Cross-functional experience provides adaptability that a pure specialist lacks.'} ${scores.companyInstability >= 50 ? `Instability at ${person.currentCompany} adds urgency — this is not the time to wait.` : `Stability at ${person.currentCompany} allows for deliberate rather than reactive moves.`} The highest-leverage action is building skills specific to ${title} expertise that are portable across employers.`,
  };
}