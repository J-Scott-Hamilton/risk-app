import { NextResponse } from "next/server";
import {
  findPerson,
  findPersonByLinkedIn,
  getCompanyDemographics,
  getCompanyFlows,
  getCompanyFlowsByLevel,
} from "@/lib/livedata";
import { computeAllScores } from "@/lib/scoring";
import { estimateSalary, getCompProgression, estimateAISalaryPressure } from "@/lib/salary";
import { generateNarrative } from "@/lib/claude";

export const maxDuration = 60; // Allow up to 60s for all API calls

// ─── Parse person data from LiveData response ─────────────────

function parsePerson(result) {
  const person = {
    name: result.name || "Unknown",
    linkedin: result.linkedin || null,
    location: result.location || null,
    currentTitle: result.position?.title || result.jobs?.[0]?.title || "Unknown",
    currentCompany: result.position?.company?.name || result.jobs?.[0]?.company?.name || "Unknown",
    currentCompanyId: result.position?.company?.id || result.jobs?.[0]?.company?.id || null,
    currentFunction: result.jobs?.[0]?.function || "Sales and Support",
    currentLevel: result.jobs?.[0]?.level || "Staff",
    startedAt: result.position?.started_at || result.jobs?.[0]?.started_at || null,
    education: result.education?.map((e) => `${e.degree || ""} @ ${e.school || ""}`).join(", ") || null,
    jobs: (result.jobs || []).map((j) => ({
      title: j.title,
      company: j.company?.name,
      companyId: j.company?.id,
      function: j.function,
      level: j.level,
      started_at: j.started_at,
      ended_at: j.ended_at,
    })),
  };

  return person;
}

// ─── Aggregate demographics into summary ──────────────────────

function summarizeDemographics(demographics, personFunction) {
  const byFunction = {};
  const byDate = {};

  for (const row of demographics) {
    const func = row.group_values?.[0]?.value || "Unknown";
    const date = row.date;
    const count = row.count_employees || 0;

    if (!byFunction[func]) byFunction[func] = {};
    byFunction[func][date] = count;

    byDate[date] = (byDate[date] || 0) + count;
  }

  const dates = Object.keys(byDate).sort();
  const totalHeadcount = dates.length > 0 ? byDate[dates[dates.length - 1]] : 0;
  const earliestHeadcount = dates.length > 0 ? byDate[dates[0]] : 0;
  const growthPct =
    earliestHeadcount > 0
      ? Math.round(((totalHeadcount - earliestHeadcount) / earliestHeadcount) * 100)
      : 0;

  // Function breakdown at latest date
  const latestDate = dates[dates.length - 1];
  const functionBreakdown = {};
  for (const [func, dateMap] of Object.entries(byFunction)) {
    functionBreakdown[func] = {
      current: dateMap[latestDate] || 0,
      earliest: dateMap[dates[0]] || 0,
    };
  }

  // Department (person's function) headcount over time
  const deptDateMap = personFunction && byFunction[personFunction] ? byFunction[personFunction] : null;
  const deptHeadcount = deptDateMap && latestDate ? (deptDateMap[latestDate] || 0) : null;

  // Build timeline with 12 most recent months, including dept counts
  const recentDates = dates.slice(-12);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(d) {
    const parts = d.split("-");
    if (parts.length >= 2) {
      const m = parseInt(parts[1], 10) - 1;
      const y = parts[0].slice(-2);
      return `${monthNames[m] || parts[1]} ${y}`;
    }
    return d;
  }

  return {
    totalHeadcount,
    earliestHeadcount,
    growthPct,
    deptHeadcount,
    deptName: personFunction || null,
    headcountTimeline: recentDates.map((d) => {
      const entry = { date: fmtDate(d), count: byDate[d] };
      if (deptDateMap) entry.dept = deptDateMap[d] || 0;
      return entry;
    }),
    functionBreakdown,
  };
}

// ─── Aggregate flows into summary ─────────────────────────────

function summarizeFlows(flows) {
  const byFunction = {};

  for (const row of flows) {
    const func = row.group_values?.[0]?.value || "Unknown";
    if (!byFunction[func]) byFunction[func] = { arrivals: 0, departures: 0 };
    byFunction[func].arrivals += row.arrivals || 0;
    byFunction[func].departures += row.departures || 0;
  }

  return Object.entries(byFunction).map(([func, data]) => ({
    function: func,
    hires: data.arrivals,
    departures: data.departures,
    net: data.arrivals - data.departures,
    churnPct: data.arrivals > 0 ? Math.round((data.departures / data.arrivals) * 1000) / 10 : 0,
  }));
}

function summarizeFlowsByLevel(flows) {
  const byLevel = {};
  for (const row of flows) {
    const level = row.group_values?.[0]?.value || "Unknown";
    if (!byLevel[level]) byLevel[level] = { arrivals: 0, departures: 0 };
    byLevel[level].arrivals += row.arrivals || 0;
    byLevel[level].departures += row.departures || 0;
  }

  return Object.entries(byLevel).map(([level, data]) => ({
    level,
    hires: data.arrivals,
    departures: data.departures,
    net: data.arrivals - data.departures,
  }));
}

// ─── Main Handler ─────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, company, linkedin } = body;

    if (!name && !linkedin) {
      return NextResponse.json({ error: "Name or LinkedIn URL required" }, { status: 400 });
    }

    // Step 1: Find the person
    let results;
    if (linkedin) {
      // Extract LinkedIn slug from URL
      const slug = linkedin
        .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "")
        .replace(/\/$/, "");
      results = await findPersonByLinkedIn(slug);
    } else {
      results = await findPerson(name, company || null);
    }

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: "Person not found. Try a different name or add their company." },
        { status: 404 }
      );
    }

    const person = parsePerson(results[0]);

    if (!person.currentCompanyId) {
      return NextResponse.json(
        { error: "Could not determine current company. Try adding the company name." },
        { status: 400 }
      );
    }

    // Step 2: Get company data (parallel calls)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const dateFrom = twoYearsAgo.toISOString().split("T")[0];
    const dateTo = new Date().toISOString().split("T")[0];

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const flowsFrom = oneYearAgo.toISOString().split("T")[0];

    const [demographics, flows, flowsByLevel] = await Promise.all([
      getCompanyDemographics(person.currentCompanyId, dateFrom, dateTo).catch(() => []),
      getCompanyFlows(person.currentCompanyId, flowsFrom, dateTo).catch(() => []),
      getCompanyFlowsByLevel(person.currentCompanyId, flowsFrom, dateTo).catch(() => []),
    ]);

    // Step 3: Process data
    const companySummary = summarizeDemographics(demographics, person.currentFunction);
    const flowsSummary = summarizeFlows(flows);
    const levelSummary = summarizeFlowsByLevel(flowsByLevel);

    // Step 4: Score
    const scores = computeAllScores(person, demographics, flows, flowsByLevel);

    // Step 5: Salary estimate
    const salary = estimateSalary(person.currentFunction, person.currentLevel, person.location);
    const progression = getCompProgression(person.currentFunction, person.location);
    const aiPressure = estimateAISalaryPressure(scores.aiRisk);

    // Step 6: Generate narrative via Claude
    const narrative = await generateNarrative(
      person,
      scores,
      { ...companySummary, flows: flowsSummary, levelHiring: levelSummary },
      { estimate: salary, progression, aiPressure }
    );

    // Step 7: Return everything
    return NextResponse.json({
      person,
      scores,
      company: {
        ...companySummary,
        flows: flowsSummary,
        levelHiring: levelSummary,
      },
      salary: {
        estimate: salary,
        progression,
        aiPressure,
      },
      narrative,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Assessment error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
