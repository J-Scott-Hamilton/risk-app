// Claude API — Narrative Analysis Generator
// Generates risk narratives and retraining path recommendations

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

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
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error("Claude API error:", res.status, await res.text());
      return fallbackNarrative(personData, scores);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "";

    // Parse the JSON response
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Claude narrative generation failed:", err);
    return fallbackNarrative(personData, scores);
  }
}

function buildPrompt(person, scores, companyData, salaryData) {
  return `You are an employment risk analyst. Generate a JSON analysis for this person.

PERSON:
- Name: ${person.name}
- Title: ${person.currentTitle}
- Company: ${person.currentCompany}
- Function: ${person.currentFunction}
- Level: ${person.currentLevel}
- Location: ${person.location}
- Career history: ${JSON.stringify(person.jobs?.slice(0, 8) || [])}
- Education: ${person.education || "Unknown"}

RISK SCORES (0-100, higher = more risk):
- Overall: ${scores.overall}
- AI Automation: ${scores.aiRisk}
- Company Instability: ${scores.companyInstability}
- Promotion Ceiling: ${scores.promotionCeiling}
- Tenure Volatility: ${scores.tenureVolatility}
- Function Churn: ${scores.functionChurn}
- Salary Compression: ${scores.salaryCompression}

COMPANY DATA:
${JSON.stringify(companyData, null, 2)}

SALARY ESTIMATE:
${JSON.stringify(salaryData, null, 2)}

Return ONLY a JSON object (no markdown, no backticks) with this structure:
{
  "overviewSummary": "2-3 sentence summary of the person's overall employment risk situation",
  "careerPattern": "1-2 sentence observation about their career trajectory pattern",
  "aiThreatAnalysis": "3-4 sentences providing a SPECIFIC, deeply researched analysis of how AI threatens THIS EXACT role (not just the function). Reference the person's specific title, the specific tasks someone in that title performs daily, and the specific AI tools or categories of tools that are replacing those tasks. Be concrete — name real companies building AI tools in this space, cite market trends, and explain the mechanism of displacement. Do NOT be generic.",
  "aiTaskBreakdown": [
    {
      "task": "Specific daily task this person's role performs (e.g. 'Qualifying inbound leads via email and phone' not just 'Lead qualification')",
      "automationRisk": 0-100,
      "aiTools": "Name 1-2 specific real AI tools or platforms that automate this (e.g. '11x.ai, Artisan Alice')",
      "timeline": "When this becomes fully automated: 'Now', '1-2 years', '3-5 years', '5+ years'",
      "explanation": "1 sentence on exactly how the AI replaces this task"
    }
  ],
  "aiMitigatingFactors": "2-3 sentences about what specifically protects THIS person from displacement. Consider their level, their specific skills from their career history, their company's AI adoption posture, and any unique human elements of their exact role.",
  "aiMarketContext": "2-3 sentences on the broader market dynamics. What percentage of companies in this industry are adopting AI for this function? What's the investment trend? What do industry leaders/analysts say about the timeline for this role?",
  "aiEvolutionPath": "2 sentences describing how this exact role will likely evolve rather than disappear entirely. What does the AI-augmented version of this job look like in 2-3 years?",
  "companyHealthSummary": "1-2 sentences on the company's growth trajectory and what it means for job security",
  "promotionAnalysis": "1-2 sentences on internal promotion prospects",
  "retrainingPaths": [
    {
      "rank": 1,
      "title": "Role title",
      "function": "Which function this falls under",
      "fitScore": 0-100,
      "growthScore": 0-100,
      "aiSafeScore": 0-100,
      "rationale": "2-3 sentences on why this is a good transition and what skills transfer",
      "skills": ["skill1", "skill2", "skill3", "skill4"],
      "salaryComparison": "Brief comp comparison to current role"
    }
  ],
  "bottomLine": "2-3 sentence summary tying the data together into an actionable recommendation"
}

CRITICAL INSTRUCTIONS:
- Include exactly 6-8 items in aiTaskBreakdown, covering the full range of what someone with this EXACT title does daily. Be hyper-specific to their role, not generic to their function.
- Include exactly 4 retraining paths ranked by fit.
- Name REAL AI tools and companies (not made up ones). If you don't know specific tools for a niche, describe the category of AI solution.
- Be specific to this person's industry, company type, and seniority level. A BDR Manager at an HR tech company faces different AI threats than a BDR Manager at a cybersecurity startup.
- Ground analysis in the actual scores and data provided.
- For aiTaskBreakdown automationRisk scores: 80+ means AI can do this NOW with minimal human oversight. 50-79 means AI assists significantly but humans still needed. Below 50 means humans are still primary.`;
}

// Fallback when Claude API is unavailable
function fallbackNarrative(person, scores) {
  const riskLevel =
    scores.overall >= 70 ? "high" : scores.overall >= 50 ? "moderate-to-elevated" : scores.overall >= 30 ? "moderate" : "low";

  return {
    overviewSummary: `${person.name} faces ${riskLevel} employment risk (score: ${scores.overall}/100), primarily driven by ${scores.aiRisk >= 60 ? "AI automation exposure in their function" : "market dynamics"}. Their position as ${person.currentTitle} at ${person.currentCompany} provides ${scores.companyInstability <= 30 ? "strong near-term stability" : "some uncertainty"}.`,
    careerPattern: `Career shows a pattern of ${person.jobs?.length > 4 ? "frequent role changes" : "steady progression"} across ${person.currentFunction} roles.`,
    aiThreatAnalysis: `The ${person.currentFunction} function faces ${scores.aiRisk >= 60 ? "significant" : "moderate"} AI disruption risk. AI tools are increasingly automating tasks traditionally performed by this function.`,
    aiTaskBreakdown: [],
    aiMarketContext: null,
    aiEvolutionPath: null,
    aiMitigatingFactors: `${person.currentLevel === "Manager" || person.currentLevel === "Director" ? "Management-level position provides some buffer against direct automation" : "Individual contributor roles are more exposed to direct automation"}.`,
    companyHealthSummary: `${person.currentCompany} shows ${scores.companyInstability <= 30 ? "strong growth trajectory" : scores.companyInstability <= 50 ? "stable positioning" : "concerning trends"} based on workforce data.`,
    promotionAnalysis: `Internal promotion prospects are ${scores.promotionCeiling <= 40 ? "favorable" : scores.promotionCeiling <= 60 ? "competitive" : "challenging"} given current organizational structure.`,
    retrainingPaths: [
      {
        rank: 1,
        title: "Revenue Operations / Sales Ops",
        function: "Operations",
        fitScore: 80,
        growthScore: 78,
        aiSafeScore: 75,
        rationale: "Leverages existing pipeline and CRM knowledge while moving into a function with lower AI disruption risk and strong growth.",
        skills: ["Pipeline analytics", "CRM architecture", "Forecasting", "Sales process design"],
        salaryComparison: "Comparable or higher compensation ceiling",
      },
      {
        rank: 2,
        title: "Customer Success Manager",
        function: "Sales and Support",
        fitScore: 75,
        growthScore: 85,
        aiSafeScore: 65,
        rationale: "Relationship-focused role that's harder to automate. Natural transition from sales development to post-sale retention.",
        skills: ["Relationship building", "Retention strategy", "Cross-sell / upsell", "Account management"],
        salaryComparison: "Similar base with expansion upside",
      },
      {
        rank: 3,
        title: "Sales Enablement / GTM Strategy",
        function: "Marketing and Product",
        fitScore: 72,
        growthScore: 70,
        aiSafeScore: 72,
        rationale: "Operational knowledge of sales processes translates directly to enablement. Growing function with strategic value.",
        skills: ["Playbook design", "Rep onboarding", "Tool stack optimization", "Competitive intel"],
        salaryComparison: "Moderate salary increase potential",
      },
      {
        rank: 4,
        title: "People Operations",
        function: "Human Resources",
        fitScore: 55,
        growthScore: 65,
        aiSafeScore: 80,
        rationale: "Bigger career pivot but highly AI-resistant. Management experience is directly transferable.",
        skills: ["Team management", "Onboarding design", "People analytics", "Culture development"],
        salaryComparison: "Slight decrease initially, strong ceiling",
      },
    ],
    bottomLine: `${person.name}'s primary risk is ${scores.aiRisk >= 60 ? "AI disruption of their current function" : "market positioning"}. ${scores.companyInstability <= 30 ? person.currentCompany + "'s growth provides near-term stability, but" : ""} medium-term career planning should focus on transitioning toward roles with lower automation exposure and stronger organizational demand.`,
  };
}
