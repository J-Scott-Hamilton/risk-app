// LiveData People API Client
// Docs: https://gotlivedata.io

const BASE_URL = "https://gotlivedata.io/api/people/v1";
const ORG_ID = process.env.LIVEDATA_ORG_ID;
const API_KEY = process.env.LIVEDATA_API_KEY;

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

async function apiCall(endpoint, body, method = "POST") {
  const url = `${BASE_URL}/${ORG_ID}/${endpoint}`;
  const res = await fetch(url, {
    method,
    headers,
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LiveData API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Find Person ──────────────────────────────────────────────

export async function findPerson(name, company = null) {
  const fields = [{ field_name: "name", search_term: name }];
  if (company) {
    fields.push({ field_name: "company.name", search_term: company });
  }

  const data = await apiCall("find", {
    matches: [{ fields }],
    size: 3,
    return_fields: [
      "name",
      "linkedin",
      "location",
      "position.title",
      "position.company.name",
      "position.company.id",
      "position.started_at",
      "jobs.title",
      "jobs.company.name",
      "jobs.company.id",
      "jobs.function",
      "jobs.level",
      "jobs.started_at",
      "jobs.ended_at",
      "education.school",
      "education.degree",
    ],
    confidence: "medium",
  });

  return data.matches?.[0]?.results || [];
}

// ─── Find Person by LinkedIn ──────────────────────────────────

export async function findPersonByLinkedIn(linkedinSlug) {
  const data = await apiCall("find", {
    matches: [
      {
        fields: [{ field_name: "linkedin", search_term: linkedinSlug }],
      },
    ],
    size: 1,
    return_fields: [
      "name",
      "linkedin",
      "location",
      "position.title",
      "position.company.name",
      "position.company.id",
      "position.started_at",
      "jobs.title",
      "jobs.company.name",
      "jobs.company.id",
      "jobs.function",
      "jobs.level",
      "jobs.started_at",
      "jobs.ended_at",
      "education.school",
      "education.degree",
    ],
    confidence: "medium",
  });

  return data.matches?.[0]?.results || [];
}

// ─── Company Demographics (headcount over time by function) ───

export async function getCompanyDemographics(companyId, dateFrom, dateTo) {
  const groupId = companyId.endsWith("-group") ? companyId : `${companyId}-group`;
  const baseId = companyId.replace(/-group$/, "");

  const data = await apiCall("search", {
    filters: [
      {
        operator: "and",
        filters: [
          {
            operator: "or",
            filters: [
              { type: "must", field: "jobs.company.id", match_type: "exact", string_values: [baseId] },
              { type: "must", field: "jobs.company.group_id", match_type: "exact", string_values: [groupId] },
            ],
          },
        ],
        report: {
          name: "demographics",
          params: {
            date_from: dateFrom,
            date_to: dateTo,
            group_by: ["jobs.function"],
            status: "active",
          },
        },
      },
    ],
    size: 0,
  });

  return data.report_results?.demographics || [];
}

// ─── Company Arrivals/Departures ──────────────────────────────

export async function getCompanyFlows(companyId, dateFrom, dateTo) {
  const groupId = companyId.endsWith("-group") ? companyId : `${companyId}-group`;
  const baseId = companyId.replace(/-group$/, "");

  const data = await apiCall("search", {
    filters: [
      {
        operator: "and",
        filters: [
          {
            operator: "or",
            filters: [
              { type: "must", field: "jobs.company.id", match_type: "exact", string_values: [baseId] },
              { type: "must", field: "jobs.company.group_id", match_type: "exact", string_values: [groupId] },
            ],
          },
        ],
        report: {
          name: "arrivals_departures",
          params: {
            date_from: dateFrom,
            date_to: dateTo,
            group_by: ["jobs.function"],
          },
        },
      },
    ],
    size: 0,
  });

  return data.report_results?.arrivals_departures || [];
}

// ─── Company Arrivals/Departures by Level ─────────────────────

export async function getCompanyFlowsByLevel(companyId, dateFrom, dateTo) {
  const groupId = companyId.endsWith("-group") ? companyId : `${companyId}-group`;
  const baseId = companyId.replace(/-group$/, "");

  const data = await apiCall("search", {
    filters: [
      {
        operator: "and",
        filters: [
          {
            operator: "or",
            filters: [
              { type: "must", field: "jobs.company.id", match_type: "exact", string_values: [baseId] },
              { type: "must", field: "jobs.company.group_id", match_type: "exact", string_values: [groupId] },
            ],
          },
          { type: "must", field: "jobs.function", match_type: "exact", string_values: ["Sales and Support", "Business Management"] },
        ],
        report: {
          name: "arrivals_departures",
          params: {
            date_from: dateFrom,
            date_to: dateTo,
            group_by: ["jobs.level"],
          },
        },
      },
    ],
    size: 0,
  });

  return data.report_results?.arrivals_departures || [];
}

// ─── Company Stats (quick headcount) ──────────────────────────

export async function getCompanyStats(companyId) {
  const groupId = companyId.endsWith("-group") ? companyId : `${companyId}-group`;
  const baseId = companyId.replace(/-group$/, "");

  const data = await apiCall("search", {
    filters: [
      {
        operator: "and",
        filters: [
          {
            operator: "or",
            filters: [
              { type: "must", field: "jobs.company.id", match_type: "exact", string_values: [baseId] },
              { type: "must", field: "jobs.company.group_id", match_type: "exact", string_values: [groupId] },
            ],
          },
        ],
        report: {
          name: "stats",
          params: { status: "active" },
        },
      },
    ],
    size: 0,
  });

  return data.report_results?.stats || {};
}
