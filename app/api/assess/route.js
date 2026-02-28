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
import { generateNarrative, fallbackNarrative } from "@/lib/claude";

export const maxDuration = 60;

// â”€â”€â”€ Parse person data from LiveData response â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Aggregate demographics into summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  const latestDate = dates[dates.length - 1];
  const functionBreakdown = {};
  for (const [func, dateMap] of Object.entries(byFunction)) {
    functionBreakdown[func] = {
      current: dateMap[latestDate] || 0,
      earliest: dateMap[dates[0]] || 0,
    };
  }

  const deptDateMap = personFunction && byFunction[personFunction] ? byFunction[personFunction] : null;
  const deptHeadcount = deptDateMap && latestDate ? (deptDateMap[latestDate] || 0) : null;

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

// â”€â”€â”€ Aggregate flows into summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Hiring Signals (LiveData API Direct) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 4 parallel queries: regional demand, employer flow, school network, function growth

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
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function extractGeoRegion(location) {
  if (!location) return null;
  const parts = location.split(",").map((s) => s.trim());
  // Always return city (first element), never state
  return parts[0] || null;
}

function extractGeoCity(location) {
  if (!location) return null;
  return location.split(",")[0]?.trim() || null;
}

function extractSchools(education) {
  if (!education) return [];
  return education
    .split(",")
    .map((e) => {
      const parts = e.split("@").map((s) => s.trim());
      return parts.length > 1 ? parts[1] : null;
    })
    .filter(Boolean);
}

function extractEmployerIds(jobs, currentCompanyId) {
  if (!jobs) return [];
  const ids = new Set();
  if (currentCompanyId) ids.add(currentCompanyId);
  for (const job of jobs) {
    if (job.companyId && job.company !== "None") ids.add(job.companyId);
  }
  return [...ids].slice(0, 8);
}

function extractEmployerNames(jobs) {
  if (!jobs) return [];
  const names = new Set();
  for (const job of jobs) {
    if (job.company && job.company !== "None") names.add(job.company);
  }
  return [...names];
}

async function getHiringSignals(person) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const dateFrom = sixMonthsAgo.toISOString().split("T")[0];
  const dateTo = new Date().toISOString().split("T")[0];

  const isExec = ["VP", "C-Team"].includes(person.currentLevel);
  const fn = [person.currentFunction].filter(Boolean);
  const lvl = isExec ? ["VP", "C-Team"] : [person.currentLevel].filter(Boolean);
  const geo = extractGeoRegion(person.location);
  const schools = extractSchools(person.education);
  const employerIds = extractEmployerIds(person.jobs, person.currentCompanyId);
  const employerNames = extractEmployerNames(person.jobs);

  const queries = [];

  // Q1: Regional demand â€” function+level hires in their geo
  if (geo && fn.length && lvl.length) {
    queries.push(
      ldtSearch({
        filters: [{
          operator: "and",
          filters: [
            { type: "must", field: "jobs.location", match_type: "fuzzy", string_values: [geo] },
            { type: "must", field: "jobs.function", match_type: "exact", string_values: fn },
            { type: "must", field: "jobs.level", match_type: "exact", string_values: lvl },
            { type: "must", field: "jobs.started_at", match_type: "fuzzy", date_from: dateFrom, date_to: dateTo },
          ],
          isJobsGroup: true,
          jobsGroupType: "any",
          positionStatus: "all",
          report: {
            name: "arrivals_departures",
            params: { date_from: dateFrom, date_to: dateTo, group_by: ["jobs.company.name"] },
          },
        }],
        size: 0,
      }).then((r) => ({ type: "regional", data: r })).catch(() => ({ type: "regional", data: null }))
    );
  } else {
    queries.push(Promise.resolve({ type: "regional", data: null }));
  }

  // Q2: Employer flow â€” where alumni from their companies land now
  if (employerIds.length > 0) {
    const companyOrFilter = {
      operator: "or",
      filters: [
        ...employerIds.map((id) => ({ type: "must", field: "jobs.company.id", match_type: "exact", string_values: [id] })),
        ...employerIds.map((id) => ({ type: "must", field: "jobs.company.group_id", match_type: "exact", string_values: [`${id}-group`] })),
      ],
    };

    const eighteenMonthsAgo = new Date();
    eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);
    const flowFrom = eighteenMonthsAgo.toISOString().split("T")[0];

    queries.push(
      ldtSearch({
        filters: [{
          operator: "and",
          filters: [
            companyOrFilter,
            { type: "must", field: "jobs.ended_at", match_type: "fuzzy", date_from: flowFrom, date_to: dateTo },
            ...(fn.length ? [{ type: "must", field: "jobs.function", match_type: "exact", string_values: [...fn, "Business Management"] }] : []),
          ],
          isJobsGroup: true,
          jobsGroupType: "ended",
          positionStatus: "all",
        }],
        size: 200,
        return_fields: ["name", "position.title", "position.company.name"],
      }).then((r) => ({ type: "employer_flow", data: r })).catch(() => ({ type: "employer_flow", data: null }))
    );
  } else {
    queries.push(Promise.resolve({ type: "employer_flow", data: null }));
  }

  // Q3: School network â€” where alumni are getting hired in this function
  if (schools.length > 0 && fn.length > 0) {
    queries.push(
      ldtSearch({
        filters: [
          {
            operator: "and",
            filters: [
              { type: "must", field: "education.school", match_type: "fuzzy", string_values: schools },
            ],
            isJobsGroup: false,
          },
          {
            operator: "and",
            filters: [
              { type: "must", field: "jobs.function", match_type: "exact", string_values: [...fn, "Business Management"] },
              { type: "must", field: "jobs.started_at", match_type: "fuzzy", date_from: dateFrom, date_to: dateTo },
            ],
            isJobsGroup: true,
            jobsGroupType: "any",
            positionStatus: "all",
            report: {
              name: "arrivals_departures",
              params: { date_from: dateFrom, date_to: dateTo, group_by: ["jobs.company.name"] },
            },
          },
        ],
        size: 0,
      }).then((r) => ({ type: "school", data: r })).catch(() => ({ type: "school", data: null }))
    );
  } else {
    queries.push(Promise.resolve({ type: "school", data: null }));
  }

  // Q4: Function growth â€” top companies building this function nationally
  if (fn.length > 0) {
    queries.push(
      ldtSearch({
        filters: [{
          operator: "and",
          filters: [
            { type: "must", field: "jobs.function", match_type: "exact", string_values: fn },
            { type: "must", field: "jobs.started_at", match_type: "fuzzy", date_from: dateFrom, date_to: dateTo },
          ],
          isJobsGroup: true,
          jobsGroupType: "any",
          positionStatus: "all",
          report: {
            name: "arrivals_departures",
            params: { date_from: dateFrom, date_to: dateTo, group_by: ["jobs.company.name"] },
          },
        }],
        size: 0,
      }).then((r) => ({ type: "function_growth", data: r })).catch(() => ({ type: "function_growth", data: null }))
    );
  } else {
    queries.push(Promise.resolve({ type: "function_growth", data: null }));
  }

  const results = await Promise.all(queries);

  const signals = {
    regional: processArrivalsReport(results.find((r) => r.type === "regional")?.data),
    employerFlow: processEmployerFlow(results.find((r) => r.type === "employer_flow")?.data, employerNames),
    school: processArrivalsReport(results.find((r) => r.type === "school")?.data),
    functionGrowth: processArrivalsReport(results.find((r) => r.type === "function_growth")?.data),
    geoRegion: geo,
    geoCity: extractGeoCity(person.location),
    schools,
    employerNames,
    currentTitle: person.currentTitle,
    currentFunction: person.currentFunction,
    currentLevel: person.currentLevel,
  };

  signals.multiSignal = findMultiSignalCompanies(signals);

  return signals;
}

function processArrivalsReport(result) {
  const rows = result?.report_results?.arrivals_departures;
  if (!rows || rows.length === 0) return null;

  const byCompany = {};
  for (const row of rows) {
    const company = row.group_values?.[0]?.value;
    if (!company || company === "None" || company === "Freelance/Self-employed") continue;
    if (!byCompany[company]) byCompany[company] = 0;
    byCompany[company] += row.arrivals || 0;
  }

  const companies = Object.entries(byCompany)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, hires]) => ({ name, hires }));

  return {
    totalHires: companies.reduce((sum, c) => sum + c.hires, 0),
    totalCompanies: companies.length,
    topCompanies: companies.slice(0, 20),
  };
}

function processEmployerFlow(result, sourceEmployerNames) {
  if (!result?.results || result.results.length === 0) return null;

  const byDestination = {};
  const sourceSet = new Set((sourceEmployerNames || []).map((n) => n.toLowerCase()));

  for (const person of result.results) {
    const destCompany = person.position?.company?.name;
    if (!destCompany || destCompany === "None" || destCompany === "Freelance/Self-employed") continue;
    if (sourceSet.has(destCompany.toLowerCase())) continue;
    if (!byDestination[destCompany]) byDestination[destCompany] = 0;
    byDestination[destCompany]++;
  }

  const destinations = Object.entries(byDestination)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return {
    totalAlumni: destinations.reduce((sum, d) => sum + d.count, 0),
    totalDestinations: destinations.length,
    topDestinations: destinations.slice(0, 20),
  };
}

function findMultiSignalCompanies(signals) {
  const companySignals = {};

  const addSignal = (items, signalType, countField) => {
    if (!items) return;
    for (const c of items) {
      const name = c.name;
      if (!companySignals[name]) companySignals[name] = { name, signals: [], totalWeight: 0 };
      if (!companySignals[name].signals.includes(signalType)) {
        companySignals[name].signals.push(signalType);
      }
      companySignals[name].totalWeight += c[countField] || 1;
    }
  };

  if (signals.regional?.topCompanies) addSignal(signals.regional.topCompanies, "hiring_locally", "hires");
  if (signals.employerFlow?.topDestinations) addSignal(signals.employerFlow.topDestinations, "employer_network", "count");
  if (signals.school?.topCompanies) addSignal(signals.school.topCompanies, "school_network", "hires");
  if (signals.functionGrowth?.topCompanies) addSignal(signals.functionGrowth.topCompanies.slice(0, 15), "function_growth", "hires");

  return Object.values(companySignals)
    .filter((c) => c.signals.length >= 2)
    .sort((a, b) => b.signals.length - a.signals.length || b.totalWeight - a.totalWeight)
    .slice(0, 15);
}

// â”€â”€â”€ Main Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    // Step 2: Company data + hiring signals (all in parallel)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const dateFrom = twoYearsAgo.toISOString().split("T")[0];
    const dateTo = new Date().toISOString().split("T")[0];

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const flowsFrom = oneYearAgo.toISOString().split("T")[0];

    const [demographics, flows, flowsByLevel, hiringSignals] = await Promise.all([
      getCompanyDemographics(person.currentCompanyId, dateFrom, dateTo).catch(() => []),
      getCompanyFlows(person.currentCompanyId, flowsFrom, dateTo).catch(() => []),
      getCompanyFlowsByLevel(person.currentCompanyId, flowsFrom, dateTo).catch(() => []),
      getHiringSignals(person).catch(() => null),
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

    // Step 6: Generate narrative (with timeout so it can't crash the whole function)
    let narrative;
    try {
      const narrativeTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Narrative generation timed out")), 30000)
      );
      narrative = await Promise.race([
        generateNarrative(
          person,
          scores,
          { ...companySummary, flows: flowsSummary, levelHiring: levelSummary },
          { estimate: salary, progression, aiPressure },
          hiringSignals
        ),
        narrativeTimeout,
      ]);
    } catch (narrativeErr) {
      console.error("Narrative error (using fallback):", narrativeErr.message);
      narrative = fallbackNarrative(person, scores, hiringSignals);
    }

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
      hiringSignals: hiringSignals || {},
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
