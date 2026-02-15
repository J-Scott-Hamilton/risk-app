import { NextResponse } from "next/server";

export const maxDuration = 30;

// ─── LiveData API Direct Access ──────────────────────────────
const LDT_BASE = "https://gotlivedata.io/api/people/v1/o_52c87b0a";
const LDT_KEY = process.env.LIVEDATA_API_KEY || "ldtkey_ab94dc93b2af4b51a633ad3fb1859494";

async function ldtSearch(body) {
  try {
    const res = await fetch(`${LDT_BASE}/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LDT_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { error: `API returned ${res.status}` };
    return res.json();
  } catch (err) {
    return { error: err.message };
  }
}

// ─── Tool Definitions ────────────────────────────────────────

const tools = [
  {
    name: "search_company_hires",
    description:
      "Search for recent hires at a specific company. Returns an arrivals/departures report showing how many people were hired and departed, optionally filtered by function, level, or location. Use this when the user asks whether a specific company has been hiring, or asks about hiring at named companies.",
    input_schema: {
      type: "object",
      properties: {
        company_name: {
          type: "string",
          description: "The company name to search for (e.g. 'Procore', 'AppFolio', 'Salesforce')",
        },
        function: {
          type: "string",
          description: "Optional job function filter (e.g. 'Sales and Support', 'Engineering', 'Marketing'). Omit to see all functions.",
        },
        level: {
          type: "string",
          description: "Optional job level filter (e.g. 'Staff', 'Manager', 'Director', 'VP', 'C-Team'). Omit to see all levels.",
        },
        location: {
          type: "string",
          description: "Optional location filter (e.g. 'Santa Barbara', 'California', 'New York'). Omit to see all locations.",
        },
        months_back: {
          type: "number",
          description: "How many months back to search. Default 12.",
        },
      },
      required: ["company_name"],
    },
  },
  {
    name: "search_location_hires",
    description:
      "Search for recent hires in a specific geographic area. Returns which companies have been hiring in that location, optionally filtered by function or level. Use this when the user asks about hiring in a specific city, region, or area.",
    input_schema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The location to search (e.g. 'Santa Barbara', 'San Francisco', 'Boston')",
        },
        function: {
          type: "string",
          description: "Optional job function filter (e.g. 'Sales and Support', 'Engineering'). Omit to see all functions.",
        },
        level: {
          type: "string",
          description: "Optional job level filter (e.g. 'Staff', 'Manager', 'Director'). Omit to see all levels.",
        },
        months_back: {
          type: "number",
          description: "How many months back to search. Default 6.",
        },
      },
      required: ["location"],
    },
  },
  {
    name: "search_person_moves",
    description:
      "Search for where people from a specific company have gone after leaving (talent outflow), or who has joined a company recently. Use this when the user asks about talent movement, alumni networks, or where people from a company end up.",
    input_schema: {
      type: "object",
      properties: {
        company_name: {
          type: "string",
          description: "The company name to track talent flow for",
        },
        direction: {
          type: "string",
          enum: ["departures", "arrivals"],
          description: "'departures' = where did people go after leaving this company. 'arrivals' = where did new hires come from.",
        },
        function: {
          type: "string",
          description: "Optional function filter",
        },
        months_back: {
          type: "number",
          description: "How many months back to search. Default 12.",
        },
      },
      required: ["company_name", "direction"],
    },
  },
];

// ─── Tool Execution ──────────────────────────────────────────

async function executeSearchCompanyHires({ company_name, function: fn, level, location, months_back = 12 }) {
  const dateFrom = new Date();
  dateFrom.setMonth(dateFrom.getMonth() - months_back);
  const dateTo = new Date().toISOString().split("T")[0];

  const filters = [
    { type: "must", field: "jobs.company.name", match_type: "fuzzy", string_values: [company_name] },
    { type: "must", field: "jobs.started_at", match_type: "fuzzy", date_from: dateFrom.toISOString().split("T")[0], date_to: dateTo },
  ];
  if (fn) filters.push({ type: "must", field: "jobs.function", match_type: "exact", string_values: [fn] });
  if (level) filters.push({ type: "must", field: "jobs.level", match_type: "exact", string_values: [level] });
  if (location) filters.push({ type: "must", field: "jobs.location", match_type: "fuzzy", string_values: [location] });

  const result = await ldtSearch({
    filters: [{
      operator: "and",
      filters,
      isJobsGroup: true,
      jobsGroupType: "any",
      positionStatus: "all",
      report: {
        name: "arrivals_departures",
        params: {
          date_from: dateFrom.toISOString().split("T")[0],
          date_to: dateTo,
          group_by: fn ? ["jobs.level"] : ["jobs.function"],
        },
      },
    }],
    size: 0,
  });

  if (result.error) return { error: result.error };

  const rows = result?.report_results?.arrivals_departures || [];
  if (rows.length === 0) {
    return { company: company_name, period: `last ${months_back} months`, totalHires: 0, totalDepartures: 0, message: `No hiring activity found for ${company_name} matching these filters.`, filters: { function: fn || "all", level: level || "all", location: location || "all" } };
  }

  const breakdown = rows.map((row) => ({
    group: row.group_values?.[0]?.value || "Unknown",
    hires: row.arrivals || 0,
    departures: row.departures || 0,
    net: (row.arrivals || 0) - (row.departures || 0),
  })).filter((r) => r.hires > 0 || r.departures > 0).sort((a, b) => b.hires - a.hires);

  return {
    company: company_name,
    period: `last ${months_back} months`,
    totalHires: breakdown.reduce((s, r) => s + r.hires, 0),
    totalDepartures: breakdown.reduce((s, r) => s + r.departures, 0),
    netChange: breakdown.reduce((s, r) => s + r.net, 0),
    breakdown,
    filters: { function: fn || "all", level: level || "all", location: location || "all" },
  };
}

async function executeSearchLocationHires({ location, function: fn, level, months_back = 6 }) {
  const dateFrom = new Date();
  dateFrom.setMonth(dateFrom.getMonth() - months_back);
  const dateTo = new Date().toISOString().split("T")[0];

  const filters = [
    { type: "must", field: "jobs.location", match_type: "fuzzy", string_values: [location] },
    { type: "must", field: "jobs.started_at", match_type: "fuzzy", date_from: dateFrom.toISOString().split("T")[0], date_to: dateTo },
  ];
  if (fn) filters.push({ type: "must", field: "jobs.function", match_type: "exact", string_values: [fn] });
  if (level) filters.push({ type: "must", field: "jobs.level", match_type: "exact", string_values: [level] });

  const result = await ldtSearch({
    filters: [{
      operator: "and",
      filters,
      isJobsGroup: true,
      jobsGroupType: "any",
      positionStatus: "all",
      report: {
        name: "arrivals_departures",
        params: {
          date_from: dateFrom.toISOString().split("T")[0],
          date_to: dateTo,
          group_by: ["jobs.company.name"],
        },
      },
    }],
    size: 0,
  });

  if (result.error) return { error: result.error };

  const rows = result?.report_results?.arrivals_departures || [];
  const byCompany = rows
    .map((row) => ({
      company: row.group_values?.[0]?.value || "Unknown",
      hires: row.arrivals || 0,
      departures: row.departures || 0,
      net: (row.arrivals || 0) - (row.departures || 0),
    }))
    .filter((r) => r.company !== "None" && r.company !== "Freelance/Self-employed" && (r.hires > 0 || r.departures > 0))
    .sort((a, b) => b.hires - a.hires);

  return {
    location,
    period: `last ${months_back} months`,
    totalHires: byCompany.reduce((s, r) => s + r.hires, 0),
    totalCompanies: byCompany.length,
    topCompanies: byCompany.slice(0, 25),
    filters: { function: fn || "all", level: level || "all" },
  };
}

async function executeSearchPersonMoves({ company_name, direction, function: fn, months_back = 12 }) {
  const dateFrom = new Date();
  dateFrom.setMonth(dateFrom.getMonth() - months_back);
  const dateTo = new Date().toISOString().split("T")[0];

  const dateField = direction === "departures" ? "jobs.ended_at" : "jobs.started_at";
  const jobsGroupType = direction === "departures" ? "ended" : "any";

  const filters = [
    { type: "must", field: "jobs.company.name", match_type: "fuzzy", string_values: [company_name] },
    { type: "must", field: dateField, match_type: "fuzzy", date_from: dateFrom.toISOString().split("T")[0], date_to: dateTo },
  ];
  if (fn) filters.push({ type: "must", field: "jobs.function", match_type: "exact", string_values: [fn] });

  const result = await ldtSearch({
    filters: [{
      operator: "and",
      filters,
      isJobsGroup: true,
      jobsGroupType,
      positionStatus: "all",
    }],
    size: 100,
    return_fields: ["name", "position.title", "position.company.name", "location"],
  });

  if (result.error) return { error: result.error };

  const people = result?.results || [];
  if (people.length === 0) {
    return { company: company_name, direction, period: `last ${months_back} months`, totalPeople: 0, message: `No ${direction} found for ${company_name} in this period.` };
  }

  // Aggregate by destination/source company
  const byCompany = {};
  const sourceCompanyLower = company_name.toLowerCase();
  for (const p of people) {
    const destCompany = p.position?.company?.name;
    if (!destCompany || destCompany === "None" || destCompany === "Freelance/Self-employed") continue;
    if (direction === "departures" && destCompany.toLowerCase() === sourceCompanyLower) continue;
    if (!byCompany[destCompany]) byCompany[destCompany] = { company: destCompany, count: 0, people: [] };
    byCompany[destCompany].count++;
    if (byCompany[destCompany].people.length < 3) {
      byCompany[destCompany].people.push({ name: p.name, title: p.position?.title });
    }
  }

  const destinations = Object.values(byCompany).sort((a, b) => b.count - a.count).slice(0, 20);

  return {
    company: company_name,
    direction,
    period: `last ${months_back} months`,
    totalPeople: people.length,
    topDestinations: destinations,
    filters: { function: fn || "all" },
  };
}

async function executeTool(name, input) {
  switch (name) {
    case "search_company_hires":
      return executeSearchCompanyHires(input);
    case "search_location_hires":
      return executeSearchLocationHires(input);
    case "search_person_moves":
      return executeSearchPersonMoves(input);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─── Main Handler ────────────────────────────────────────────

export async function POST(request) {
  try {
    const { question, person, scores, company, salary, hiringSignals, tab } = await request.json();

    if (!question) {
      return NextResponse.json({ error: "Question required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        answer: "The AI assistant is not available right now. Please try again later.",
      });
    }

    // Build context based on what tab the user is on
    const contextSections = [];

    contextSections.push(`PERSON: ${person?.name || "Unknown"}, ${person?.currentTitle || "Unknown"} at ${person?.currentCompany || "Unknown"}.
Location: ${person?.location || "Unknown"}. Function: ${person?.currentFunction || "Unknown"}. Level: ${person?.currentLevel || "Unknown"}.
Education: ${person?.education || "Not available"}.
Career: ${(person?.jobs || []).slice(0, 6).map((j) => `${j.title} @ ${j.company}`).join(" → ")}`);

    if (scores) {
      contextSections.push(`RISK SCORES: Overall ${scores.overall}/100, AI Risk ${scores.aiRisk}/100, Company Instability ${scores.companyInstability}/100, Promotion Ceiling ${scores.promotionCeiling}/100, Function Churn ${scores.functionChurn}/100, Tenure Volatility ${scores.tenureVolatility}/100`);
    }

    if (tab === "company" && company) {
      contextSections.push(`COMPANY DATA: ${person?.currentCompany} has ${company.totalHeadcount?.toLocaleString() || "?"} employees. 2-year growth: ${company.growthPct > 0 ? "+" : ""}${company.growthPct}%. ${person?.currentFunction} dept: ${company.deptHeadcount?.toLocaleString() || "?"}.
Function flows: ${(company.flows || []).slice(0, 8).map((f) => `${f.function}: +${f.hires}/-${f.departures} (net ${f.net >= 0 ? "+" : ""}${f.net})`).join(", ")}`);
    }

    if (tab === "salary" && salary) {
      contextSections.push(`SALARY DATA: Estimate for ${person?.currentFunction} ${person?.currentLevel}: $${Math.round(salary.estimate?.low / 1000)}K - $${Math.round(salary.estimate?.midpoint / 1000)}K - $${Math.round(salary.estimate?.high / 1000)}K.
AI salary pressure: ${salary.aiPressure?.magnitude || "Unknown"} (${salary.aiPressure?.direction || "?"} ${Math.abs(salary.aiPressure?.pctImpact || 0)}%).
Progression: ${(salary.progression || []).map((p) => `${p.level}: $${Math.round(p.midpoint / 1000)}K`).join(", ")}`);
    }

    if (tab === "opportunities" && hiringSignals) {
      const parts = [];
      if (hiringSignals.regional) {
        parts.push(`Regional demand: ${hiringSignals.regional.totalHires} hires at ${person?.currentFunction} ${person?.currentLevel} in ${hiringSignals.geoRegion || person?.location}. Top: ${hiringSignals.regional.topCompanies?.slice(0, 8).map((c) => `${c.name}(${c.hires})`).join(", ")}`);
      }
      if (hiringSignals.employerFlow) {
        parts.push(`Employer network: ${hiringSignals.employerFlow.totalAlumni} alumni tracked. Top destinations: ${hiringSignals.employerFlow.topDestinations?.slice(0, 8).map((d) => `${d.name}(${d.count})`).join(", ")}`);
      }
      if (hiringSignals.school) {
        parts.push(`School network (${(hiringSignals.schools || []).join(",")}): ${hiringSignals.school.totalHires} alumni hired. Top: ${hiringSignals.school.topCompanies?.slice(0, 8).map((c) => `${c.name}(${c.hires})`).join(", ")}`);
      }
      if (hiringSignals.multiSignal?.length > 0) {
        parts.push(`Multi-signal companies: ${hiringSignals.multiSignal.slice(0, 8).map((c) => `${c.name}[${c.signals.join("+")}]`).join(", ")}`);
      }
      contextSections.push(`HIRING SIGNALS:\n${parts.join("\n")}`);
    }

    const systemPrompt = `You are workforce.ai, an AI workforce intelligence assistant with access to real-time workforce data from Live Data Technologies, which tracks over 100 million professional profiles.

You are answering a follow-up question about a specific person's employment risk assessment. Answer concisely (2-4 paragraphs max) but with substance. Be direct and specific — use the person's name, company, and data when relevant.

IMPORTANT: You have tools to query live workforce data. USE THEM when the user asks about:
- Whether a specific company has been hiring (use search_company_hires)
- Hiring activity in a specific city or region (use search_location_hires)
- Where people from a company have gone, or who has joined a company (use search_person_moves)

Do NOT say "I don't have data on that" or "that company doesn't appear in my signals" — instead, use a tool to look it up. The pre-loaded hiring signals from the assessment are a starting point, but you can always query for more specific data.

When the user asks about a specific geographic area (like "Santa Barbara only"), use the search_location_hires tool with that specific location — don't just filter your existing data mentally.

When presenting results, lead with the specific numbers. For example: "AppFolio hired 14 people in Sales and Support over the past year, with 8 at the Staff level and 4 at the Manager level." Be precise, not vague.

If the question is about a general topic (like "what is the AI risk to BDR roles"), you should still ground your answer in the context of this specific person when possible, but can speak more broadly.

If a tool returns zero results, say so clearly — don't speculate about why or redirect to other companies unless the user asks.

Speak in a warm, authoritative tone. No bullet points or lists — conversational paragraphs. Reference specific companies, tools, or trends by name when relevant.`;

    const userPrompt = `ASSESSMENT CONTEXT:
${contextSections.join("\n\n")}

CURRENT TAB: ${tab || "overview"}
USER QUESTION: ${question}

Answer this question using the assessment data, your tools, and your knowledge. If the question involves a specific company or location, use your tools to get precise data — don't guess. Be specific and actionable.`;

    // ─── Agentic loop: call Claude, handle tool use, repeat ───
    let messages = [{ role: "user", content: userPrompt }];
    let maxIterations = 4; // safety cap on tool use rounds

    for (let i = 0; i < maxIterations; i++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 2000,
          system: systemPrompt,
          messages,
          tools,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        console.error("Chat API error:", res.status, errBody);
        return NextResponse.json({
          answer: `I'm having trouble connecting to the AI service right now. Please try again in a moment.`,
        });
      }

      const data = await res.json();

      // If Claude is done (no tool use), extract the text and return
      if (data.stop_reason === "end_turn") {
        const answer = data.content
          ?.filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("\n") || "No response generated.";
        return NextResponse.json({ answer });
      }

      // If Claude wants to use tools, execute them
      if (data.stop_reason === "tool_use") {
        const toolUseBlocks = data.content.filter((b) => b.type === "tool_use");
        const toolResults = [];

        for (const toolBlock of toolUseBlocks) {
          console.log(`Chat tool call: ${toolBlock.name}`, JSON.stringify(toolBlock.input));
          const result = await executeTool(toolBlock.name, toolBlock.input);
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolBlock.id,
            content: JSON.stringify(result),
          });
        }

        // Add assistant response + tool results to messages for next round
        messages.push({ role: "assistant", content: data.content });
        messages.push({ role: "user", content: toolResults });
        continue;
      }

      // Unexpected stop reason — return whatever text we have
      const answer = data.content
        ?.filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n") || "No response generated.";
      return NextResponse.json({ answer });
    }

    // If we exhausted iterations, return what we have
    return NextResponse.json({
      answer: "I ran into a limit processing your question. Could you try rephrasing it more specifically?",
    });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
