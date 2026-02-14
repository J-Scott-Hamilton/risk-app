// Claude API — Narrative Analysis Generator
// Generates deeply personalized risk narratives and retraining recommendations
// factoring in career stage, seniority, sector, geography, and individual history

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

// ─── Career Stage Classification ────────────────────────────────────────
function classifyCareerStage(person) {
  const level = (person.currentLevel || "").toLowerCase();
  const title = (person.currentTitle || "").toLowerCase();
  const jobCount = person.jobs?.length || 0;
  const yearsOfExperience = estimateYearsExperience(person.jobs);

  // Pinnacle / Apex — C-suite, founders, known leaders
  if (
    level === "c-team" ||
    /\b(ceo|cto|cfo|coo|cio|cpo|cmo|chief|founder|co-founder|president|chairman|chairwoman)\b/.test(title)
  ) {
    return {
      stage: "pinnacle",
      label: "Executive / Apex Leader",
      description: "At or near the peak of their career arc. C-suite, founder, or equivalent.",
      retrainingApproach: "board seats, advisory roles, portfolio leadership, venture investing, thought leadership",
    };
  }

  // Senior Executive — VPs, SVPs, EVPs, GMs
  if (
    level === "vp" ||
    /\b(vice president|svp|evp|vp|general manager|managing director|partner)\b/.test(title)
  ) {
    return {
      stage: "senior_executive",
      label: "Senior Executive",
      description: "VP-level or equivalent. Significant organizational authority and strategic scope.",
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

function estimateYearsExperience(jobs) {
  if (!jobs || jobs.length === 0) return 0;
  const dates = jobs
    .map((j) => j.startDate || j.start_date)
    .filter(Boolean)
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d));
  if (dates.length === 0) return 0;
  const earliest = new Date(Math.min(...dates));
  return Math.round((Date.now() - earliest) / (365.25 * 24 * 60 * 60 * 1000));
}

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
      return `${i + 1}. ${title} at ${company} (${start} – ${end})${level ? ` [${level}]` : ""}${fn ? ` {${fn}}` : ""}`;
    })
    .join("\n");
}

// ─── Main Export ────────────────────────────────────────────────────────
export async function generateNarrative(personData, scores, companyData, salaryData) {
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
        system: `You are an elite workforce intelligence analyst at a firm that tracks 100M+ professional career profiles. You produce deeply personalized, data-driven employment risk assessments that read like executive briefing documents — not templates. Every sentence must be specific to the individual being analyzed. You name real companies, real AI tools, real market trends. You never write generic filler. Your AI threat analyses are your signature product — they are exhaustive, specific, and actionable. When asked for 8-12 sentences, you deliver 8-12 substantive sentences. You treat every field as if the person being analyzed will read it and judge whether you actually understand their specific situation.`,
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

  // Detect career patterns
  const jobCount = person.jobs?.length || 0;
  const companies = [...new Set((person.jobs || []).map((j) => j.company?.name || j.company).filter(Boolean))];
  const functions = [...new Set((person.jobs || []).map((j) => j.function).filter(Boolean))];
  const levels = (person.jobs || []).map((j) => j.level).filter(Boolean);
  const hasUpwardTrajectory = levels.length >= 2 && isUpwardTrajectory(levels);

  return `You are an elite workforce intelligence analyst creating a deeply personalized employment risk assessment. This is NOT a generic template — you must analyze this specific individual's unique career arc, seniority, sector, geography, and personal history to produce insights that could only apply to THIS person.

═══════════════════════════════════════════════════════
THE INDIVIDUAL
═══════════════════════════════════════════════════════

Name: ${person.name}
Current Title: ${person.currentTitle}
Current Company: ${person.currentCompany}
Function: ${person.currentFunction}
Level: ${person.currentLevel}
Location: ${person.location || "Unknown"}
Education: ${person.education || "Unknown"}
LinkedIn: ${person.linkedin || "N/A"}

CAREER STAGE: ${careerStage.label} — ${careerStage.description}
ESTIMATED YEARS OF EXPERIENCE: ~${yearsExp} years
NUMBER OF ROLES: ${jobCount} across ${companies.length} companies
FUNCTIONS HELD: ${functions.join(", ") || "Unknown"}
CAREER TRAJECTORY: ${hasUpwardTrajectory ? "Upward — progressive seniority increases" : "Mixed or lateral — no clear upward pattern"}

FULL CAREER HISTORY (most recent first):
${careerHistory}

═══════════════════════════════════════════════════════
RISK SCORES (0-100, higher = more at risk)
═══════════════════════════════════════════════════════

Overall Risk: ${scores.overall}/100
AI Automation Risk: ${scores.aiRisk}/100
Company Instability: ${scores.companyInstability}/100
Promotion Ceiling: ${scores.promotionCeiling}/100
Tenure Volatility: ${scores.tenureVolatility}/100
Function Churn (market): ${scores.functionChurn}/100
Salary Compression Risk: ${scores.salaryCompression}/100

═══════════════════════════════════════════════════════
COMPANY & MARKET DATA
═══════════════════════════════════════════════════════

${JSON.stringify(companyData, null, 2)}

═══════════════════════════════════════════════════════
SALARY ESTIMATE
═══════════════════════════════════════════════════════

${JSON.stringify(salaryData, null, 2)}

═══════════════════════════════════════════════════════
ANALYSIS INSTRUCTIONS
═══════════════════════════════════════════════════════

CRITICAL RULES FOR PERSONALIZATION:

1. CAREER STAGE AWARENESS: This person is classified as "${careerStage.stage}" (${careerStage.label}).
   - If they are "pinnacle" or "senior_executive": They are at or near the apex of a career. Do NOT suggest lateral or downward moves. Suggest board seats, advisory roles, portfolio leadership, venture/angel investing, thought leadership positions, fractional C-suite roles, or similar apex-level transitions. Acknowledge their achievement and authority.
   - If they are "senior_leader": Suggest VP-track, cross-functional executive roles, startup C-suite, or building a practice/consultancy. Not entry-level adjacent roles.
   - If they are "mid_career": Suggest upward or lateral-upward moves that leverage their experience. Include both management and senior IC paths.
   - If they are "early_career" or "entry_level": Broader pivots, certifications, and emerging fields are appropriate.

2. INDIVIDUAL HISTORY MATTERS: Look at their actual career path.
   - What sectors/industries have they worked in? Factor that into risk and recommendations.
   - Have they been at ${companies.length > 1 ? "multiple companies" : "one company"} — what does that mean for adaptability?
   - What functions (${functions.join(", ")}) have they touched? That expands or narrows their pivot options.
   - Do they have a pattern of promotions, lateral moves, or frequent changes?

3. SECTOR & GEO CONTEXT: Consider their industry sector and geographic market:
   - What is the AI exposure level for their specific industry, not just their function?
   - How does their location affect job market options, remote work possibilities, and comp?
   - Are there regional industry clusters that create opportunity or concentration risk?

4. SENIORITY-CALIBRATED LANGUAGE: Match the sophistication of your analysis to the person's level.
   - For C-suite/VPs: Use strategic, board-room language. Reference market dynamics, capital allocation, org design.
   - For Directors/Managers: Use operational leadership language. Reference team building, cross-functional influence.
   - For ICs: Use skill-centric language. Reference technical depth, certification paths, tool proficiency.

5. NEVER suggest roles that would be a clear step backwards for this person's career stage. A VP should not be told to "explore customer success representative" roles. A C-suite executive should not be told to "consider getting a certification in project management."

Return ONLY a JSON object (no markdown, no backticks, no commentary) with this structure:

{
  "careerStageAssessment": "2-3 sentences characterizing where this person is in their career arc. Reference specific roles from their history that demonstrate their trajectory. This should read like an executive briefing, not a generic label.",
  
  "overviewSummary": "4-6 sentences providing a nuanced, personalized risk overview. Reference their specific title, company, industry sector, and how these intersect with macro workforce trends. Include their geographic context. This should feel like it was written by an analyst who spent an hour studying this person, not generated from a template.",
  
  "careerPattern": "3-4 sentences analyzing their actual career moves. Are they a company loyalist or a job hopper? Have they climbed steadily or moved laterally? Have they changed functions or stayed narrow? How does their pattern compare to what's typical for their function and level? Reference specific companies or role transitions from their history.",

  "aiThreatAnalysis": "THIS IS THE MOST IMPORTANT FIELD. Write 8-12 sentences providing an exhaustive, deeply personalized analysis of how AI threatens THIS person's specific role. Do NOT write about their function in general — write about what ${person.name} does day-to-day as ${person.currentTitle} at ${person.currentCompany} given their ${person.currentLevel} level and ${yearsExp} years of experience. Name specific AI tools and companies building them (e.g., 'Gong and Chorus.ai for call analysis', 'Apollo.io and Clay for prospect research', '11x.ai for autonomous SDRs'). Break down which of their daily tasks are already being automated NOW vs. on a 2-3 year horizon vs. remaining human-dependent for 5+ years. Factor in their seniority — a VP faces different AI threats than an IC. Factor in their specific company's likely AI adoption posture. End with the structural risk: not just whether AI replaces them, but whether AI compresses the number of people needed at their level, changes the skills required, or shifts the economics of their function. This should read like a 200-word analyst brief that could only be about THIS person.",

  "aiMitigatingFactors": "4-5 sentences about what specifically protects THIS person from AI displacement. Reference their specific seniority level, their accumulated experience across ${companies.length} companies, the relationship and judgment components of their exact role at ${person.currentCompany}, and any unique positioning from their career history. Be concrete — not 'leadership roles are harder to automate' but 'Their ${person.currentLevel}-level role at ${person.currentCompany} involves stakeholder alignment, org design, and strategic prioritization — tasks where AI assists but doesn't replace.' Also consider: does their geographic market, industry specialization, or cross-functional experience create additional protection?",

  "companyHealthNarrative": "6-10 sentences providing a comprehensive analysis of ${person.currentCompany}'s workforce health. Start with what the headcount trajectory reveals — is the company growing, flat, or contracting? Then analyze functional composition: which departments are growing, which are shrinking, and what does that signal about strategic priorities? CRITICAL: compare ${person.currentCompany}'s trajectory to 2-3 named competitors in their space. Are competitors growing faster, slower, or pulling back? What does the competitive headcount picture mean for ${person.name}'s job security and market alternatives? Finally, connect the company-level trends to this specific person — what does it mean for someone at ${person.currentLevel} level in ${person.currentFunction} at this particular company?",

  "promotionAnalysis": "3-4 sentences on internal mobility prospects. Given their current level, what's the realistic next rung? Is the company growing fast enough to create those roles? Does their function have a clear leadership ladder at ${person.currentCompany}? Factor in their tenure and career velocity.",

  "geoMarketContext": "2-3 sentences on how their location (${person.location || "their market"}) affects their risk and options. Consider: local industry clusters, remote work trends for their function/level, cost-of-living adjusted comp, talent competition in their area.",

  "retrainingPaths": [
    {
      "rank": 1,
      "title": "Specific role title appropriate to their career stage",
      "function": "Which function this falls under",
      "targetLevel": "What level they'd enter at (must be lateral or upward from current)",
      "fitScore": 85,
      "growthScore": 80,
      "aiSafeScore": 75,
      "rationale": "4-5 sentences explaining why this specific transition makes sense for THIS person. Reference their actual career history, skills that transfer, industry knowledge that applies. Explain the logical bridge — why would someone with their background be credible and competitive for this role? Include specific companies or sectors where this move is most viable.",
      "skills": ["skill1", "skill2", "skill3", "skill4"],
      "timeToTransition": "Realistic timeline: e.g., '3-6 months with existing network' or '6-12 months with targeted upskilling'",
      "salaryComparison": "Specific comp comparison: e.g., 'Comparable base with higher equity potential' or '15-20% premium in current market'"
    }
  ],

  "bottomLine": "4-6 sentences synthesizing everything into an actionable strategic recommendation for this specific person. This should read like advice from a career strategist who knows their full history, not a generic 'upskill and network' platitude. Reference their specific strengths, the 1-2 biggest risks they face, and the most promising path forward given who they are."
}

Include exactly 4 retraining paths ranked by fit. Each path MUST be calibrated to career stage "${careerStage.stage}" — appropriate level: ${careerStage.retrainingApproach}.

DEPTH REQUIREMENTS — do NOT be brief:
- aiThreatAnalysis MUST be 8-12 sentences. This is the centerpiece of the report.
- companyHealthNarrative MUST be 6-10 sentences with named competitors.
- Each retraining path rationale MUST be 4-5 sentences referencing their actual history.
- overviewSummary MUST be 4-6 sentences.
- bottomLine MUST be 4-6 sentences.

Name REAL AI tools and companies (not made up ones). If you don't know specific tools for a niche, describe the category of AI solution.
Ground every sentence in the actual data provided. No filler. No generic advice. Every claim should be traceable to something in this person's profile, scores, or company data.`;
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

// ─── Fallback Narrative (when Claude API unavailable) ───────────────────
function fallbackNarrative(person, scores) {
  const careerStage = classifyCareerStage(person);
  const yearsExp = estimateYearsExperience(person.jobs);
  const jobCount = person.jobs?.length || 0;
  const riskLevel =
    scores.overall >= 70
      ? "high"
      : scores.overall >= 50
      ? "moderate-to-elevated"
      : scores.overall >= 30
      ? "moderate"
      : "low";

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
        rationale: `With ${yearsExp}+ years of experience and ${person.currentLevel}-level authority at ${person.currentCompany}, board service is a natural extension. Governance, fiduciary oversight, and strategic counsel leverage decades of operating experience.`,
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
        rationale: `The fractional executive market is growing rapidly as companies need experienced leaders without full-time overhead. ${person.name}'s background in ${person.currentFunction} positions them for interim ${person.currentLevel} engagements.`,
        skills: ["Transformation leadership", "Rapid assessment", "Stakeholder management", "Operational turnaround"],
        timeToTransition: "1-3 months via fractional exec platforms",
        salaryComparison: "Daily rates of $2K-$5K+ with portfolio flexibility",
      },
      {
        rank: 3,
        title: "Venture / Advisory Portfolio",
        function: "Business Management",
        targetLevel: "VP",
        fitScore: 80,
        growthScore: 85,
        aiSafeScore: 85,
        rationale: `Operating experience at ${person.currentCompany} translates directly to venture advisory and LP roles. Industry expertise in ${person.currentFunction} provides pattern recognition that funds value.`,
        skills: ["Due diligence", "Portfolio support", "Market assessment", "Founder coaching"],
        timeToTransition: "Ongoing — can start immediately alongside current role",
        salaryComparison: "Advisory equity + carry provides asymmetric upside",
      },
      {
        rank: 4,
        title: "Strategic Advisor / Operating Partner",
        function: "Consulting",
        targetLevel: "VP",
        fitScore: 78,
        growthScore: 70,
        aiSafeScore: 88,
        rationale: `Private equity firms and growth-stage companies seek operators with ${person.currentLevel}-level experience for hands-on portfolio value creation.`,
        skills: ["Value creation planning", "Operational diligence", "Executive mentoring", "M&A integration"],
        timeToTransition: "3-6 months for PE/VC placement",
        salaryComparison: "Base + carry structure can exceed current total comp",
      },
    ];
  } else if (careerStage.stage === "senior_leader") {
    retrainingPaths = [
      {
        rank: 1,
        title: "VP-level leadership in adjacent function",
        function: person.currentFunction || "Operations",
        targetLevel: "VP",
        fitScore: 82,
        growthScore: 80,
        aiSafeScore: 78,
        rationale: `Director-to-VP transition leveraging ${person.currentFunction} expertise. Companies scaling through ${person.currentCompany}'s stage often need leaders who've seen the playbook before.`,
        skills: ["Strategic planning", "P&L ownership", "Org design", "Executive communication"],
        timeToTransition: "3-6 months active search",
        salaryComparison: "15-25% premium for VP-level move",
      },
      {
        rank: 2,
        title: "Startup Head of / VP",
        function: person.currentFunction || "Operations",
        targetLevel: "VP",
        fitScore: 78,
        growthScore: 88,
        aiSafeScore: 75,
        rationale: `Series A-C startups seeking first ${person.currentFunction} leaders value the operational maturity ${person.name} brings from ${person.currentCompany}.`,
        skills: ["Zero-to-one building", "Rapid scaling", "Cross-functional leadership", "Investor communication"],
        timeToTransition: "2-4 months",
        salaryComparison: "Base may be flat but equity upside significant",
      },
      {
        rank: 3,
        title: "Independent Consulting Practice",
        function: "Consulting",
        targetLevel: "Director",
        fitScore: 75,
        growthScore: 72,
        aiSafeScore: 82,
        rationale: `${yearsExp} years of ${person.currentFunction} experience creates a consulting wedge. Focus on the specific domain expertise from ${person.currentCompany}'s industry.`,
        skills: ["Business development", "Engagement management", "Thought leadership", "Client advisory"],
        timeToTransition: "1-3 months to first engagement",
        salaryComparison: "Variable — $150-$300/hr for specialized consulting",
      },
      {
        rank: 4,
        title: "Cross-functional Director role",
        function: "Operations",
        targetLevel: "Director",
        fitScore: 72,
        growthScore: 75,
        aiSafeScore: 70,
        rationale: `Broadening functional scope from ${person.currentFunction} into general operations or strategy creates a stronger VP candidacy.`,
        skills: ["Process optimization", "Cross-team alignment", "Data-driven decision making", "Change management"],
        timeToTransition: "3-6 months",
        salaryComparison: "Comparable base with broader scope",
      },
    ];
  } else {
    // Mid-career, early career, entry level
    retrainingPaths = [
      {
        rank: 1,
        title: "Revenue Operations / Business Operations",
        function: "Operations",
        targetLevel: person.currentLevel || "Staff",
        fitScore: 80,
        growthScore: 78,
        aiSafeScore: 75,
        rationale: `Operations roles blend analytical and interpersonal skills. ${person.name}'s ${person.currentFunction} background provides domain context that pure ops hires lack.`,
        skills: ["Pipeline analytics", "CRM architecture", "Forecasting", "Process design"],
        timeToTransition: "2-4 months with targeted skill building",
        salaryComparison: "Comparable or higher compensation ceiling",
      },
      {
        rank: 2,
        title: "Product Management",
        function: "Marketing and Product",
        targetLevel: person.currentLevel || "Staff",
        fitScore: 75,
        growthScore: 85,
        aiSafeScore: 72,
        rationale: `Product management rewards cross-functional communication and customer empathy — skills developed in ${person.currentFunction}. Strong growth trajectory.`,
        skills: ["User research", "Roadmap planning", "Stakeholder alignment", "Data analysis"],
        timeToTransition: "3-6 months with PM bootcamp or certification",
        salaryComparison: "Typically 10-20% premium over comparable IC roles",
      },
      {
        rank: 3,
        title: "Solutions Engineering / Technical Sales",
        function: "Sales and Support",
        targetLevel: person.currentLevel || "Staff",
        fitScore: 72,
        growthScore: 80,
        aiSafeScore: 68,
        rationale: `Combines technical depth with relationship building. ${person.currentFunction} experience provides credibility in customer-facing technical roles.`,
        skills: ["Technical demos", "Solution architecture", "Consultative selling", "Integration design"],
        timeToTransition: "1-3 months",
        salaryComparison: "Base + variable comp can exceed current total significantly",
      },
      {
        rank: 4,
        title: "Data / Analytics role in current sector",
        function: "Information Technology",
        targetLevel: person.currentLevel || "Staff",
        fitScore: 70,
        growthScore: 82,
        aiSafeScore: 65,
        rationale: `Domain expertise in ${person.currentCompany}'s sector combined with analytical skills creates a differentiated data professional.`,
        skills: ["SQL/Python", "Business intelligence", "Statistical analysis", "Data storytelling"],
        timeToTransition: "3-9 months depending on current technical depth",
        salaryComparison: "Strong demand keeps comp competitive",
      },
    ];
  }

  return {
    careerStageAssessment: `${person.name} is classified as ${careerStage.label} with approximately ${yearsExp} years of professional experience. Their current position as ${person.currentTitle} at ${person.currentCompany} ${careerStage.stage === "pinnacle" ? "represents an apex-level role" : careerStage.stage === "senior_executive" ? "reflects senior organizational authority" : "positions them in the " + careerStage.label + " phase of their career arc"}.`,
    overviewSummary: `${person.name} faces ${riskLevel} overall employment risk (score: ${scores.overall}/100). As ${person.currentTitle} at ${person.currentCompany}, their ${person.currentFunction} function carries an AI automation risk score of ${scores.aiRisk}/100 while company stability scores ${100 - scores.companyInstability}/100. ${person.location ? `Based in ${person.location}, their geographic market ` : "Their market "}${scores.overall >= 50 ? "compounds exposure through limited local alternatives in their specialty." : "provides reasonable alternative opportunities should they need to transition."}`,
    careerPattern: `Career spans ${jobCount} roles across ${[...new Set((person.jobs || []).map((j) => j.company?.name || j.company).filter(Boolean))].length} organizations over ~${yearsExp} years. ${jobCount > 5 ? "The frequency of role changes suggests either high market demand or potential tenure volatility." : "Relatively stable career progression indicates strong organizational commitment."}`,
    aiThreatAnalysis: `The ${person.currentFunction} function faces ${scores.aiRisk >= 60 ? "significant" : "moderate"} AI disruption risk at the ${person.currentLevel} level. AI tools are increasingly automating tasks traditionally performed in this function, though the impact varies significantly by seniority level and specific responsibilities. ${person.currentLevel === "C-Team" || person.currentLevel === "VP" ? "At the executive level, AI primarily augments decision-making through better data synthesis and scenario modeling, but the core leadership responsibilities — stakeholder alignment, organizational design, strategic prioritization, and institutional judgment — remain fundamentally human-dependent." : person.currentLevel === "Director" || person.currentLevel === "Manager" ? "At the management level, AI is automating reporting, performance tracking, and operational coordination, but the interpersonal dimensions — team leadership, conflict resolution, cross-functional negotiation — remain human-centric." : "At the individual contributor level, task-specific automation is advancing rapidly. Tools are emerging that can handle structured, repeatable work with increasing sophistication."} For ${person.name} specifically, their ${yearsExp} years of accumulated domain expertise and professional relationships provide differentiation that pure AI solutions cannot replicate in the near term.`,
    aiMitigatingFactors: `${person.currentLevel === "C-Team" || person.currentLevel === "VP" ? "Executive-level authority involving strategic decision-making, stakeholder management, and organizational leadership provides substantial insulation from direct AI automation. Their " + yearsExp + " years of experience create pattern recognition and institutional knowledge that AI systems cannot replicate." : person.currentLevel === "Director" || person.currentLevel === "Manager" ? "Management responsibilities including team leadership, cross-functional coordination, and judgment-intensive decisions offer meaningful protection. Their experience across " + ([...new Set((person.jobs || []).map((j) => j.company?.name || j.company).filter(Boolean))].length) + " organizations provides breadth that strengthens their market position." : "Domain expertise and professional relationships built over " + yearsExp + " years provide differentiation, though individual contributor roles face more direct automation exposure. Building AI fluency alongside existing skills is the strongest near-term protection."}`,
    companyHealthNarrative: `${person.currentCompany} shows ${scores.companyInstability <= 30 ? "strong growth trajectory and organizational stability" : scores.companyInstability <= 50 ? "stable positioning with some areas to monitor" : "concerning workforce signals that warrant attention"} based on workforce data analysis. ${scores.companyInstability <= 30 ? "Consistent headcount growth suggests sustained investment across functions." : scores.companyInstability <= 50 ? "Mixed signals in hiring and attrition patterns suggest the company is in a transitional phase." : "Declining headcount or high churn rates across key functions indicate potential organizational stress."} At ${person.currentLevel} level in ${person.currentFunction}, ${person.name}'s position is ${scores.companyInstability <= 40 ? "relatively secure given the company's trajectory" : "worth monitoring as organizational changes could affect their function"}.`,
    promotionAnalysis: `Internal promotion prospects are ${scores.promotionCeiling <= 40 ? "favorable given organizational growth" : scores.promotionCeiling <= 60 ? "competitive within current structure" : "challenging given current organizational dynamics"}.`,
    geoMarketContext: `${person.location ? person.location + " provides " : "Their geographic market provides "}${scores.overall <= 40 ? "a healthy job market for their function and level" : "varying opportunity density depending on willingness to relocate or work remotely"}.`,
    retrainingPaths,
    bottomLine: `${person.name}'s ${riskLevel} risk profile (${scores.overall}/100) reflects the intersection of ${scores.aiRisk >= 60 ? "meaningful AI automation exposure" : "manageable AI risk"} with ${scores.companyInstability >= 50 ? "company instability signals" : "reasonable company stability"}. ${careerStage.stage === "pinnacle" || careerStage.stage === "senior_executive" ? "At their career stage, the focus should be on leveraging their authority and network into portfolio-style opportunities rather than traditional job searches." : careerStage.stage === "senior_leader" ? "At the director level, the strategic move is positioning for VP-track opportunities where their operational experience commands a premium." : "Building adjacent skills while leveraging their " + person.currentFunction + " foundation provides the strongest risk-adjusted career path."}`,
  };
}
