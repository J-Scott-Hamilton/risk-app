"use client";

import { useState } from "react";

// ─── Shared Components ────────────────────────────────────────

function RiskGauge({ score, label, color }) {
  const r = 40, c = Math.PI * r, off = c - (score / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="60" viewBox="0 0 100 60">
        <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#1a1a2e" strokeWidth="8" strokeLinecap="round" />
        <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: "stroke-dashoffset 1.2s ease-out" }} />
        <text x="50" y="50" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">{score}</text>
      </svg>
      <span style={{ color, fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginTop: "2px" }}>{label}</span>
    </div>
  );
}

function RiskBar({ label, value, color, delay = 0 }) {
  const [anim, setAnim] = useState(false);
  if (!anim) setTimeout(() => setAnim(true), delay);
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span style={{ fontSize: "12px", color: "#8a8fb5", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: "12px", color, fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ height: "6px", backgroundColor: "#1a1a2e", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: anim ? `${value}%` : "0%", height: "100%", backgroundColor: color, borderRadius: "3px", transition: "width 1s ease-out" }} />
      </div>
    </div>
  );
}

function Tag({ children, color = "#8a8fb5" }) {
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, color, border: `1px solid ${color}33`, backgroundColor: `${color}11`, marginRight: "6px", marginBottom: "4px" }}>{children}</span>;
}

function Section({ title, icon, children }) {
  return (
    <div style={{ backgroundColor: "#12122a", borderRadius: "16px", padding: "24px", marginBottom: "16px", border: "1px solid #ffffff08" }}>
      <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#8a8fb5", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "16px" }}>{icon}</span>{title}
      </h3>
      {children}
    </div>
  );
}

function Stat({ label, value, sub, color = "#fff" }) {
  return (
    <div className="text-center">
      <div style={{ fontSize: "28px", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "11px", color: "#8a8fb5", marginTop: "4px", fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: "10px", color: "#4a4f7a", marginTop: "2px" }}>{sub}</div>}
    </div>
  );
}

function FitScore({ score, label }) {
  const c = score >= 80 ? "#22c55e" : score >= 60 ? "#a5b4fc" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: `${c}18`, border: `1.5px solid ${c}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: c }}>{score}</div>
      <span style={{ fontSize: "11px", color: "#8a8fb5" }}>{label}</span>
    </div>
  );
}

function riskColor(score) {
  if (score >= 70) return "#ef4444";
  if (score >= 50) return "#f59e0b";
  if (score >= 30) return "#a5b4fc";
  return "#22c55e";
}

function riskLabel(score) {
  if (score >= 70) return "High";
  if (score >= 50) return "Moderate-Elevated";
  if (score >= 30) return "Moderate";
  return "Low";
}

// ─── Search Page ──────────────────────────────────────────────

function SearchForm({ onSubmit, loading }) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [mode, setMode] = useState("name"); // "name" or "linkedin"
  const [linkedin, setLinkedin] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "linkedin") {
      onSubmit({ linkedin });
    } else {
      onSubmit({ name, company });
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: "520px", width: "100%", textAlign: "center" }}>
        {/* Logo / Brand */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #a5b4fc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, color: "#fff", boxShadow: "0 4px 20px #6366f133" }}>W</div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>workforce<span style={{ color: "#a5b4fc" }}>.ai</span></span>
          </div>
        </div>

        <h1 style={{ fontSize: "40px", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "12px", lineHeight: 1.1 }}>
          Employment Risk<br />
          <span style={{ background: "linear-gradient(135deg, #a5b4fc, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Assessment</span>
        </h1>
        <p style={{ fontSize: "15px", color: "#8a8fb5", lineHeight: 1.6, marginBottom: "12px" }}>
          AI-powered analysis of job security, career trajectory, and retraining opportunities.
        </p>
        <p style={{ fontSize: "12px", color: "#4a4f7a", lineHeight: 1.5, marginBottom: "32px" }}>
          Powered by workforce intelligence data across 100M+ professional profiles
        </p>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-2 mb-6">
          <button onClick={() => setMode("name")} style={{ padding: "6px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", backgroundColor: mode === "name" ? "#6366f1" : "#12122a", color: mode === "name" ? "#fff" : "#8a8fb5" }}>Name + Company</button>
          <button onClick={() => setMode("linkedin")} style={{ padding: "6px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", backgroundColor: mode === "linkedin" ? "#6366f1" : "#12122a", color: mode === "linkedin" ? "#fff" : "#8a8fb5" }}>LinkedIn URL</button>
        </div>

        <div onSubmit={handleSubmit}>
          {mode === "name" ? (
            <div className="flex flex-col gap-3">
              <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: "14px 18px", borderRadius: "12px", border: "1px solid #ffffff12", backgroundColor: "#12122a", color: "#fff", fontSize: "15px", outline: "none" }} />
              <input type="text" placeholder="Company (optional but recommended)" value={company} onChange={(e) => setCompany(e.target.value)} style={{ width: "100%", padding: "14px 18px", borderRadius: "12px", border: "1px solid #ffffff12", backgroundColor: "#12122a", color: "#fff", fontSize: "15px", outline: "none" }} />
            </div>
          ) : (
            <input type="text" placeholder="https://linkedin.com/in/username" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} style={{ width: "100%", padding: "14px 18px", borderRadius: "12px", border: "1px solid #ffffff12", backgroundColor: "#12122a", color: "#fff", fontSize: "15px", outline: "none" }} />
          )}

          <button onClick={handleSubmit} disabled={loading || (mode === "name" ? !name : !linkedin)} style={{ width: "100%", marginTop: "16px", padding: "14px", borderRadius: "12px", border: "none", backgroundColor: loading ? "#4a4f7a" : "#6366f1", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: loading ? "wait" : "pointer", transition: "all 0.2s" }}>
            {loading ? "Analyzing..." : "Generate Assessment →"}
          </button>
        </div>

        {loading && (
          <div style={{ marginTop: "24px" }}>
            <div className="animate-glow" style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#6366f122", border: "2px solid #6366f144", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid #6366f1", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ fontSize: "13px", color: "#8a8fb5" }}>Looking up person · Analyzing company · Scoring risk · Generating insights...</p>
            <p style={{ fontSize: "11px", color: "#4a4f7a", marginTop: "4px" }}>This usually takes 10–20 seconds</p>
          </div>
        )}

        <div style={{ marginTop: "48px", fontSize: "11px", color: "#4a4f7a", lineHeight: 1.6 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "6px", background: "linear-gradient(135deg, #6366f1, #a5b4fc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#fff" }}>W</div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#8a8fb5" }}>workforce<span style={{ color: "#6366f1" }}>.ai</span></span>
          </div>
          <div>AI-powered workforce intelligence · 100M+ career profiles</div>
        </div>
      </div>
    </div>
  );
}

// ─── Report Dashboard ─────────────────────────────────────────

function Report({ data, onReset }) {
  const [tab, setTab] = useState("overview");
  const { person, scores, company, salary, narrative } = data;

  const tabs = [
    { id: "overview", label: "Overview", icon: "⚡" },
    { id: "ai", label: "AI Risk", icon: "🤖" },
    { id: "company", label: "Company", icon: "🏢" },
    { id: "salary", label: "Salary", icon: "💰" },
    { id: "retraining", label: "Retraining", icon: "🎯" },
  ];

  const overallColor = riskColor(scores.overall);

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4" style={{ padding: "12px 16px", backgroundColor: "#12122a", borderRadius: "12px", border: "1px solid #ffffff08" }}>
          <div className="flex items-center gap-3">
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, #6366f1, #a5b4fc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "#fff" }}>W</div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>Employment Risk Assessment</div>
              <div style={{ fontSize: "10px", color: "#6366f1", fontWeight: 600, letterSpacing: "0.05em" }}>workforce.ai</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div style={{ fontSize: "10px", color: "#4a4f7a" }}>{new Date(data.generatedAt).toLocaleDateString()}</div>
            <button onClick={onReset} style={{ fontSize: "11px", color: "#6366f1", background: "#6366f112", border: "1px solid #6366f133", borderRadius: "8px", padding: "5px 12px", cursor: "pointer", fontWeight: 600 }}>+ New Report</button>
          </div>
        </div>

        {/* Profile */}
        <div style={{ background: "linear-gradient(135deg, #12122a 0%, #1a1a3e 100%)", borderRadius: "20px", padding: "28px", marginBottom: "20px", border: "1px solid #ffffff08", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, #6366f115, transparent)", pointerEvents: "none" }} />
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "4px", letterSpacing: "-0.02em" }}>{person.name}</h1>
              <div style={{ fontSize: "15px", color: "#a5b4fc", fontWeight: 600, marginBottom: "8px" }}>{person.currentTitle} · {person.currentCompany}</div>
              <div className="flex flex-wrap gap-1">
                {person.location && <Tag color="#a5b4fc">{person.location}</Tag>}
                {person.education && <Tag color="#a5b4fc">{person.education.split(",")[0]}</Tag>}
                <Tag color="#a5b4fc">{person.currentFunction}</Tag>
              </div>
            </div>
            <RiskGauge score={scores.overall} label="Overall Risk" color={overallColor} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.2s", backgroundColor: tab === t.id ? "#6366f1" : "#12122a", color: tab === t.id ? "#fff" : "#8a8fb5", whiteSpace: "nowrap" }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="animate-fade-in">
            <Section title="Risk Summary" icon="⚡">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div style={{ background: "#0a0a1a", borderRadius: "12px", padding: "16px" }}>
                  <RiskBar label="AI Automation Exposure" value={scores.aiRisk} color={riskColor(scores.aiRisk)} delay={100} />
                  <RiskBar label="Function Churn" value={scores.functionChurn} color={riskColor(scores.functionChurn)} delay={200} />
                  <RiskBar label="Company Instability" value={scores.companyInstability} color={riskColor(scores.companyInstability)} delay={300} />
                </div>
                <div style={{ background: "#0a0a1a", borderRadius: "12px", padding: "16px" }}>
                  <RiskBar label="Promotion Ceiling" value={scores.promotionCeiling} color={riskColor(scores.promotionCeiling)} delay={400} />
                  <RiskBar label="Salary Compression" value={scores.salaryCompression} color={riskColor(scores.salaryCompression)} delay={500} />
                  <RiskBar label="Tenure Volatility" value={scores.tenureVolatility} color={riskColor(scores.tenureVolatility)} delay={600} />
                </div>
              </div>
              <div style={{ fontSize: "13px", color: "#8a8fb5", lineHeight: 1.7, marginBottom: "12px" }}>{narrative.overviewSummary}</div>
              {narrative.careerStageAssessment && (
                <div style={{ padding: "14px", border: "1px solid #6366f133", borderRadius: "10px", backgroundColor: "#6366f108", marginTop: "4px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#a5b4fc", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Career Stage</div>
                  <div style={{ fontSize: "13px", color: "#8a8fb5", lineHeight: 1.7 }}>{narrative.careerStageAssessment}</div>
                </div>
              )}
            </Section>

            <Section title="Career Timeline" icon="📋">
              <div style={{ position: "relative", paddingLeft: "20px" }}>
                {person.jobs.slice(0, 8).map((job, i) => {
                  const startYear = job.started_at ? new Date(job.started_at).getFullYear() : "?";
                  const endYear = job.ended_at ? new Date(job.ended_at).getFullYear() : "Now";
                  const months = job.started_at && job.ended_at ? Math.round((new Date(job.ended_at) - new Date(job.started_at)) / (1000 * 60 * 60 * 24 * 30)) : null;
                  const dotColor = !job.ended_at ? "#22c55e" : months && months < 6 ? "#ef4444" : months && months < 12 ? "#f59e0b" : "#8a8fb5";
                  return (
                    <div key={i} style={{ position: "relative", marginBottom: "12px" }}>
                      <div style={{ position: "absolute", left: "-20px", top: "6px", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: dotColor, boxShadow: `0 0 8px ${dotColor}44` }} />
                      {i < person.jobs.length - 1 && <div style={{ position: "absolute", left: "-17px", top: "16px", width: "2px", height: "20px", backgroundColor: "#1a1a2e" }} />}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontSize: "11px", color: "#4a4f7a", fontWeight: 600, minWidth: "70px" }}>{startYear}–{endYear}</span>
                        <span style={{ fontSize: "13px", color: "#fff", fontWeight: 600 }}>{job.title}</span>
                        <span style={{ fontSize: "11px", color: "#6366f1" }}>@ {job.company}</span>
                        {months && <Tag color={dotColor}>{months} mo</Tag>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {narrative.careerPattern && (
                <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#0a0a1a", borderRadius: "10px", fontSize: "12px", color: "#8a8fb5", lineHeight: 1.6 }}>
                  <strong style={{ color: "#f59e0b" }}>Pattern:</strong> {narrative.careerPattern}
                </div>
              )}
            </Section>

            {narrative.geoMarketContext && (
              <Section title="Market & Geography" icon="🌍">
                <div style={{ fontSize: "13px", color: "#8a8fb5", lineHeight: 1.7 }}>{narrative.geoMarketContext}</div>
              </Section>
            )}
          </div>
        )}

        {/* AI RISK */}
        {tab === "ai" && (
          <div className="animate-fade-in">
            <Section title="AI Automation Threat Level" icon="🤖">
              <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "24px" }}>
                <Stat label="AI Risk Score" value={`${scores.aiRisk}/100`} color={riskColor(scores.aiRisk)} />
                <Stat label="Risk Level" value={riskLabel(scores.aiRisk)} color={riskColor(scores.aiRisk)} />
                <Stat label="Function" value={person.currentFunction.split(" ")[0]} sub={person.currentLevel} color="#a5b4fc" />
              </div>
              <div style={{ fontSize: "13px", color: "#8a8fb5", lineHeight: 1.8, marginBottom: "16px" }}>{narrative.aiThreatAnalysis}</div>
            </Section>

            {/* Task-Level Breakdown */}
            {narrative.aiTaskBreakdown && narrative.aiTaskBreakdown.length > 0 && (
              <Section title={`Task Automation Breakdown — ${person.currentTitle}`} icon="⚙️">
                <div style={{ fontSize: "12px", color: "#8a8fb5", lineHeight: 1.6, marginBottom: "16px" }}>
                  How automatable is each part of this specific role today?
                </div>
                <div style={{ background: "#0a0a1a", borderRadius: "12px", padding: "16px" }}>
                  {narrative.aiTaskBreakdown.map((task, i) => {
                    const c = task.automationRisk >= 80 ? "#ef4444" : task.automationRisk >= 50 ? "#f59e0b" : task.automationRisk >= 30 ? "#a5b4fc" : "#22c55e";
                    const timeColor = task.timeline === "Now" ? "#ef4444" : task.timeline?.includes("1-2") ? "#f59e0b" : task.timeline?.includes("3-5") ? "#a5b4fc" : "#22c55e";
                    return (
                      <div key={i} style={{ marginBottom: i < narrative.aiTaskBreakdown.length - 1 ? "16px" : "0", paddingBottom: i < narrative.aiTaskBreakdown.length - 1 ? "16px" : "0", borderBottom: i < narrative.aiTaskBreakdown.length - 1 ? "1px solid #ffffff08" : "none" }}>
                        <div className="flex justify-between items-start mb-1">
                          <span style={{ fontSize: "13px", color: "#fff", fontWeight: 600, flex: 1 }}>{task.task}</span>
                          <span style={{ fontSize: "12px", color: c, fontWeight: 700, marginLeft: "12px" }}>{task.automationRisk}%</span>
                        </div>
                        <div style={{ height: "5px", backgroundColor: "#1a1a2e", borderRadius: "3px", overflow: "hidden", marginBottom: "8px" }}>
                          <div style={{ width: `${task.automationRisk}%`, height: "100%", backgroundColor: c, borderRadius: "3px", transition: "width 0.8s ease-out" }} />
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {task.aiTools && (
                            <span style={{ fontSize: "11px", color: "#6366f1", backgroundColor: "#6366f112", padding: "2px 8px", borderRadius: "6px", border: "1px solid #6366f122" }}>🔧 {task.aiTools}</span>
                          )}
                          {task.timeline && (
                            <span style={{ fontSize: "11px", color: timeColor, backgroundColor: `${timeColor}12`, padding: "2px 8px", borderRadius: "6px", border: `1px solid ${timeColor}22` }}>⏱ {task.timeline}</span>
                          )}
                        </div>
                        {task.explanation && (
                          <div style={{ fontSize: "11px", color: "#4a4f7a", marginTop: "6px", lineHeight: 1.5 }}>{task.explanation}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Market Context + Evolution */}
            <Section title="Market Intelligence" icon="📊">
              {narrative.aiMarketContext && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#a5b4fc", marginBottom: "8px" }}>📈 Industry Adoption</div>
                  <div style={{ fontSize: "13px", color: "#8a8fb5", lineHeight: 1.7 }}>{narrative.aiMarketContext}</div>
                </div>
              )}
              {narrative.aiEvolutionPath && (
                <div style={{ padding: "16px", border: "1px solid #6366f133", borderRadius: "12px", backgroundColor: "#6366f108", marginBottom: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#6366f1", marginBottom: "8px" }}>🔮 How This Role Evolves</div>
                  <div style={{ fontSize: "13px", color: "#8a8fb5", lineHeight: 1.7 }}>{narrative.aiEvolutionPath}</div>
                </div>
              )}
              {narrative.aiMitigatingFactors && (
                <div style={{ padding: "16px", border: "1px solid #22c55e33", borderRadius: "12px", backgroundColor: "#22c55e08" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#22c55e", marginBottom: "8px" }}>🛡️ What Protects {person.name.split(" ")[0]}</div>
                  <div style={{ fontSize: "12px", color: "#8a8fb5", lineHeight: 1.7 }}>{narrative.aiMitigatingFactors}</div>
                </div>
              )}
            </Section>
          </div>
        )}

        {/* COMPANY */}
        {tab === "company" && (
          <div className="animate-fade-in">
            <Section title={`${person.currentCompany} Workforce Health`} icon="🏢">
              <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "24px" }}>
                <Stat label="Headcount" value={company.totalHeadcount?.toLocaleString() || "?"} color="#a5b4fc" />
                <Stat label="2-Year Growth" value={`${company.growthPct > 0 ? "+" : ""}${company.growthPct}%`} color={company.growthPct > 0 ? "#22c55e" : "#ef4444"} />
                <Stat label="Stability Score" value={`${100 - scores.companyInstability}/100`} color={riskColor(scores.companyInstability)} />
              </div>

              {/* Headcount chart */}
              {company.headcountTimeline && company.headcountTimeline.length > 1 && (
                <div style={{ background: "#0a0a1a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>Headcount Trajectory</div>
                  <div style={{ display: "flex", alignItems: "flex-end", height: "100px", gap: "3px" }}>
                    {company.headcountTimeline.map((pt, i) => {
                      const min = Math.min(...company.headcountTimeline.map(p => p.count));
                      const max = Math.max(...company.headcountTimeline.map(p => p.count));
                      const range = max - min || 1;
                      const pct = ((pt.count - min) / range) * 100;
                      return <div key={i} style={{ flex: 1, height: `${Math.max(pct, 3)}%`, backgroundColor: i >= company.headcountTimeline.length - 2 ? "#6366f1" : "#6366f166", borderRadius: "2px 2px 0 0", minWidth: "4px" }} />;
                    })}
                  </div>
                </div>
              )}

              <div style={{ fontSize: "13px", color: "#8a8fb5", lineHeight: 1.7, marginBottom: "16px" }}>{narrative.companyHealthSummary}</div>

              {/* Function breakdown */}
              {company.flows && company.flows.length > 0 && (
                <div style={{ background: "#0a0a1a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>Hiring Flows by Function</div>
                  {company.flows
                    .sort((a, b) => b.net - a.net)
                    .slice(0, 7)
                    .map((f, i) => {
                      const isTarget = f.function === person.currentFunction;
                      const churnColor = f.churnPct > 55 ? "#ef4444" : f.churnPct > 40 ? "#f59e0b" : "#22c55e";
                      return (
                        <div key={i} className="flex items-center justify-between" style={{ padding: "8px 4px", borderBottom: "1px solid #ffffff06", backgroundColor: isTarget ? "#ef444410" : "transparent", borderRadius: isTarget ? "6px" : "0" }}>
                          <span style={{ fontSize: "12px", color: isTarget ? "#ef4444" : "#fff", fontWeight: isTarget ? 700 : 500, minWidth: "140px" }}>{f.function} {isTarget ? "←" : ""}</span>
                          <div className="flex gap-3">
                            <span style={{ fontSize: "11px", color: "#22c55e" }}>+{f.hires}</span>
                            <span style={{ fontSize: "11px", color: "#ef4444" }}>-{f.departures}</span>
                            <span style={{ fontSize: "11px", color: churnColor, fontWeight: 600 }}>{f.churnPct}%</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {narrative.promotionAnalysis && (
                <div style={{ padding: "16px", border: "1px solid #f59e0b33", borderRadius: "12px", backgroundColor: "#f59e0b08" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#f59e0b", marginBottom: "8px" }}>⚠️ Promotion Outlook</div>
                  <div style={{ fontSize: "12px", color: "#8a8fb5", lineHeight: 1.7 }}>{narrative.promotionAnalysis}</div>
                </div>
              )}
            </Section>
          </div>
        )}

        {/* SALARY */}
        {tab === "salary" && (
          <div className="animate-fade-in">
            <Section title="Compensation Estimate" icon="💰">
              <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "24px" }}>
                <Stat label="Est. Low" value={`$${Math.round(salary.estimate.low / 1000)}K`} sub="P25" color="#8a8fb5" />
                <Stat label="Est. Mid" value={`$${Math.round(salary.estimate.midpoint / 1000)}K`} sub="Median" color="#22c55e" />
                <Stat label="Est. High" value={`$${Math.round(salary.estimate.high / 1000)}K`} sub="P75" color="#f59e0b" />
              </div>

              <div style={{ background: "#0a0a1a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>Comp by Level ({person.currentFunction})</div>
                {salary.progression.map((p, i) => {
                  const isCurrent = p.level === person.currentLevel;
                  return (
                    <div key={i} className="flex items-center justify-between" style={{ padding: "10px 12px", marginBottom: "4px", borderRadius: "8px", backgroundColor: isCurrent ? "#6366f115" : "transparent", border: isCurrent ? "1px solid #6366f133" : "1px solid transparent" }}>
                      <span style={{ fontSize: "12px", color: isCurrent ? "#a5b4fc" : "#8a8fb5", fontWeight: isCurrent ? 700 : 500 }}>{p.level} {isCurrent ? "←" : ""}</span>
                      <div className="flex gap-4 items-center">
                        <span style={{ fontSize: "11px", color: "#4a4f7a" }}>${Math.round(p.low / 1000)}K – ${Math.round(p.high / 1000)}K</span>
                        <span style={{ fontSize: "12px", color: isCurrent ? "#a5b4fc" : "#fff", fontWeight: 700 }}>${Math.round(p.midpoint / 1000)}K</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {salary.aiPressure && (
                <div style={{ padding: "16px", border: "1px solid #f59e0b33", borderRadius: "12px", backgroundColor: "#f59e0b08" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#f59e0b", marginBottom: "8px" }}>💡 AI Salary Pressure: {salary.aiPressure.magnitude}</div>
                  <div style={{ fontSize: "12px", color: "#8a8fb5", lineHeight: 1.7 }}>
                    Based on AI automation risk ({scores.aiRisk}/100), compensation in this function could face {salary.aiPressure.direction} pressure of approximately {Math.abs(salary.aiPressure.pctImpact)}% over the next 2–3 years.
                  </div>
                </div>
              )}

              <div style={{ marginTop: "12px", fontSize: "11px", color: "#4a4f7a", lineHeight: 1.5 }}>
                Estimates based on function, level, and geography. Actual compensation varies by company stage, equity, and individual negotiation.
              </div>
            </Section>
          </div>
        )}

        {/* RETRAINING */}
        {tab === "retraining" && (
          <div className="animate-fade-in">
            {/* Company function growth */}
            {company.flows && company.flows.length > 0 && (
              <Section title={`${person.currentCompany} Function Health`} icon="📈">
                <div style={{ fontSize: "12px", color: "#8a8fb5", lineHeight: 1.7, marginBottom: "16px" }}>
                  Which functions at {person.currentCompany} are growing with the least churn? Your current function is highlighted.
                </div>
                <div style={{ background: "#0a0a1a", borderRadius: "12px", padding: "16px", marginBottom: "16px", overflowX: "auto" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1.4fr 65px 75px 60px 65px", gap: "8px", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid #ffffff12" }}>
                    {["Function", "Hires", "Deps", "Net", "Churn"].map((h, i) => (
                      <span key={i} style={{ fontSize: "10px", color: "#4a4f7a", fontWeight: 700, textAlign: i > 0 ? "right" : "left", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</span>
                    ))}
                  </div>
                  {company.flows
                    .sort((a, b) => b.net - a.net)
                    .slice(0, 8)
                    .map((f, i) => {
                      const isTarget = f.function === person.currentFunction;
                      const churnColor = f.churnPct > 55 ? "#ef4444" : f.churnPct > 40 ? "#f59e0b" : "#22c55e";
                      return (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 65px 75px 60px 65px", gap: "8px", padding: "7px 4px", borderBottom: "1px solid #ffffff06", backgroundColor: isTarget ? "#ef444410" : "transparent", borderRadius: isTarget ? "6px" : "0" }}>
                          <span style={{ fontSize: "12px", color: isTarget ? "#ef4444" : "#fff", fontWeight: isTarget ? 700 : 500 }}>{f.function}{isTarget ? " ←" : ""}</span>
                          <span style={{ fontSize: "12px", color: "#8a8fb5", textAlign: "right" }}>{f.hires}</span>
                          <span style={{ fontSize: "12px", color: "#8a8fb5", textAlign: "right" }}>{f.departures}</span>
                          <span style={{ fontSize: "12px", color: "#22c55e", textAlign: "right", fontWeight: 600 }}>+{f.net}</span>
                          <span style={{ fontSize: "12px", color: churnColor, textAlign: "right", fontWeight: 600 }}>{f.churnPct}%</span>
                        </div>
                      );
                    })}
                </div>
              </Section>
            )}

            {/* Retraining Paths */}
            <Section title="Recommended Retraining Paths" icon="🎯">
              <div style={{ fontSize: "12px", color: "#8a8fb5", lineHeight: 1.7, marginBottom: "16px" }}>
                Based on {person.name}'s skills, {person.currentCompany}'s hiring trends, and sector-wide workforce data:
              </div>

              {(narrative.retrainingPaths || []).map((path, i) => {
                const medals = ["🥇", "🥈", "🥉", "🎲"];
                const colors = ["#22c55e", "#a5b4fc", "#f59e0b", "#8a8fb5"];
                const c = colors[i] || "#8a8fb5";
                return (
                  <div key={i} style={{ background: "#0a0a1a", borderRadius: "14px", padding: "20px", marginBottom: "12px", border: `1px solid ${c}22` }}>
                    <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontSize: "16px" }}>{medals[i] || "📌"}</span>
                          <span style={{ fontSize: "15px", fontWeight: 800, color: c }}>{path.title}</span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#4a4f7a" }}>
                          {path.function}{path.targetLevel ? ` · ${path.targetLevel} level` : ""}
                        </div>
                        {path.timeToTransition && (
                          <div style={{ fontSize: "11px", color: "#a5b4fc", marginTop: "4px" }}>⏱ {path.timeToTransition}</div>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <FitScore score={path.fitScore} label="Fit" />
                        <FitScore score={path.growthScore} label="Growth" />
                        <FitScore score={path.aiSafeScore} label="AI-Safe" />
                      </div>
                    </div>
                    <div style={{ fontSize: "12px", color: "#8a8fb5", lineHeight: 1.7, marginBottom: "12px" }}>{path.rationale}</div>
                    <div className="flex flex-wrap gap-1">
                      {(path.skills || []).map((s, j) => <Tag key={j} color={c}>{s}</Tag>)}
                    </div>
                    {path.salaryComparison && (
                      <div style={{ marginTop: "10px", fontSize: "11px", color: "#4a4f7a" }}>💰 {path.salaryComparison}</div>
                    )}
                  </div>
                );
              })}

              {/* Bottom Line */}
              {narrative.bottomLine && (
                <div style={{ padding: "20px", background: "linear-gradient(135deg, #1a1a3e 0%, #12122a 100%)", borderRadius: "14px", border: "1px solid #6366f133" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#a5b4fc", marginBottom: "10px" }}>💎 The Bottom Line</div>
                  <div style={{ fontSize: "13px", color: "#8a8fb5", lineHeight: 1.8 }}>{narrative.bottomLine}</div>
                </div>
              )}
            </Section>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "24px 16px", borderTop: "1px solid #ffffff08", marginTop: "12px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "7px", background: "linear-gradient(135deg, #6366f1, #a5b4fc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "#fff" }}>W</div>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>workforce<span style={{ color: "#6366f1" }}>.ai</span></span>
          </div>
          <div style={{ fontSize: "12px", color: "#8a8fb5", marginBottom: "12px", lineHeight: 1.5 }}>AI-powered workforce intelligence for hiring, retention, and competitive analysis</div>
          <a href="https://workforce.ai" style={{ display: "inline-block", padding: "8px 20px", borderRadius: "8px", backgroundColor: "#6366f1", color: "#fff", fontSize: "12px", fontWeight: 700, textDecoration: "none", marginBottom: "16px" }}>Explore Workforce.ai →</a>
          <div style={{ fontSize: "10px", color: "#4a4f7a", marginTop: "8px" }}>Sample-based workforce data — directional trends, not census figures · Not financial or career advice</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const handleSearch = async (params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setReportData(data);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  if (reportData) {
    return <Report data={reportData} onReset={() => setReportData(null)} />;
  }

  return (
    <div>
      <SearchForm onSubmit={handleSearch} loading={loading} />
      {error && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#ef444422", border: "1px solid #ef444444", color: "#ef4444", padding: "12px 24px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, maxWidth: "400px", textAlign: "center" }}>
          {error}
        </div>
      )}
    </div>
  );
}
