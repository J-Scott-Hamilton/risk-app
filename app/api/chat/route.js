import { NextResponse } from "next/server";

export const maxDuration = 30;

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
Career: ${(person?.jobs || []).slice(0, 6).map(j => `${j.title} @ ${j.company}`).join(" → ")}`);

    if (scores) {
      contextSections.push(`RISK SCORES: Overall ${scores.overall}/100, AI Risk ${scores.aiRisk}/100, Company Instability ${scores.companyInstability}/100, Promotion Ceiling ${scores.promotionCeiling}/100, Function Churn ${scores.functionChurn}/100, Tenure Volatility ${scores.tenureVolatility}/100`);
    }

    if (tab === "company" && company) {
      contextSections.push(`COMPANY DATA: ${person?.currentCompany} has ${company.totalHeadcount?.toLocaleString() || "?"} employees. 2-year growth: ${company.growthPct > 0 ? "+" : ""}${company.growthPct}%. ${person?.currentFunction} dept: ${company.deptHeadcount?.toLocaleString() || "?"}.
Function flows: ${(company.flows || []).slice(0, 8).map(f => `${f.function}: +${f.hires}/-${f.departures} (net ${f.net >= 0 ? "+" : ""}${f.net})`).join(", ")}`);
    }

    if (tab === "salary" && salary) {
      contextSections.push(`SALARY DATA: Estimate for ${person?.currentFunction} ${person?.currentLevel}: $${Math.round(salary.estimate?.low/1000)}K - $${Math.round(salary.estimate?.midpoint/1000)}K - $${Math.round(salary.estimate?.high/1000)}K.
AI salary pressure: ${salary.aiPressure?.magnitude || "Unknown"} (${salary.aiPressure?.direction || "?"} ${Math.abs(salary.aiPressure?.pctImpact || 0)}%).
Progression: ${(salary.progression || []).map(p => `${p.level}: $${Math.round(p.midpoint/1000)}K`).join(", ")}`);
    }

    if ((tab === "opportunities") && hiringSignals) {
      const parts = [];
      if (hiringSignals.regional) {
        parts.push(`Regional demand: ${hiringSignals.regional.totalHires} hires at ${person?.currentFunction} ${person?.currentLevel} in ${hiringSignals.geoRegion || person?.location}. Top: ${hiringSignals.regional.topCompanies?.slice(0, 8).map(c => `${c.name}(${c.hires})`).join(", ")}`);
      }
      if (hiringSignals.employerFlow) {
        parts.push(`Employer network: ${hiringSignals.employerFlow.totalAlumni} alumni tracked. Top destinations: ${hiringSignals.employerFlow.topDestinations?.slice(0, 8).map(d => `${d.name}(${d.count})`).join(", ")}`);
      }
      if (hiringSignals.school) {
        parts.push(`School network (${(hiringSignals.schools || []).join(",")}): ${hiringSignals.school.totalHires} alumni hired. Top: ${hiringSignals.school.topCompanies?.slice(0, 8).map(c => `${c.name}(${c.hires})`).join(", ")}`);
      }
      if (hiringSignals.multiSignal?.length > 0) {
        parts.push(`Multi-signal companies: ${hiringSignals.multiSignal.slice(0, 8).map(c => `${c.name}[${c.signals.join("+")}]`).join(", ")}`);
      }
      contextSections.push(`HIRING SIGNALS:\n${parts.join("\n")}`);
    }

    const systemPrompt = `You are workforce.ai, an AI workforce intelligence assistant. You have deep knowledge about labor markets, AI disruption, career strategy, hiring trends, and compensation.

You are answering a follow-up question about a specific person's employment risk assessment. Answer concisely (2-4 paragraphs max) but with substance. Be direct and specific — use the person's name, company, and data when relevant.

If the question is about a general topic (like "what is the AI risk to BDR roles"), you should still ground your answer in the context of this specific person when possible, but can speak more broadly.

If you don't have enough data to answer confidently, say so honestly rather than guessing.

Speak in a warm, authoritative tone. No bullet points or lists — conversational paragraphs. Reference specific companies, tools, or trends by name when relevant.`;

    const userPrompt = `ASSESSMENT CONTEXT:
${contextSections.join("\n\n")}

CURRENT TAB: ${tab || "overview"}
USER QUESTION: ${question}

Answer this question using the assessment data and your knowledge. Be specific and actionable.`;

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
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("Chat API error:", res.status, errBody);
      return NextResponse.json({
        answer: `API error (${res.status}): ${errBody || "Unknown error"}. Check that ANTHROPIC_API_KEY is set in your environment variables.`,
      });
    }

    const data = await res.json();
    const answer = data.content?.[0]?.text || "No response generated.";

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
