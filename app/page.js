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

function RiskBar({ label, value, color, delay = 0, tip }) {
  const [anim, setAnim] = useState(false);
  if (!anim) setTimeout(() => setAnim(true), delay);
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span style={{ fontSize: "12px", color: "#8a8fb5", fontWeight: 500, display: "flex", alignItems: "center" }}>
          {label}{tip && <InfoTip text={tip} />}
        </span>
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

function InfoTip({ text }) {
  const [visible, setVisible] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", marginLeft: "5px", verticalAlign: "middle" }}>
      <span
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "14px", height: "14px", borderRadius: "50%", fontSize: "9px", fontWeight: 700, color: "#4a4f7a", border: "1px solid #4a4f7a55", cursor: "default", lineHeight: 1, userSelect: "none" }}
      >?</span>
      {visible && (
        <span style={{ position: "absolute", left: "20px", top: "-4px", zIndex: 100, backgroundColor: "#1e1e3f", border: "1px solid #4a4f7a55", borderRadius: "8px", padding: "8px 12px", fontSize: "11px", color: "#c4c8e0", lineHeight: 1.6, width: "220px", boxShadow: "0 8px 24px #00000066", pointerEvents: "none" }}>
          {text}
        </span>
      )}
    </span>
  );
}

function toneProfile(score) {
  if (score < 30) return {
    mode: "strong",
    directiveLabel: "🏆 The Position",
    directiveBorder: "#22c55e33",
    directiveBg: "linear-gradient(135deg, #0f1f1a 0%, #0a1a12 100%)",
    directiveAccent: "#22c55e",
    signalHeader: "What the data confirms",
  };
  if (score < 55) return {
    mode: "watchful",
    directiveLabel: "📋 What to Watch",
    directiveBorder: "#a5b4fc33",
    directiveBg: "linear-gradient(135deg, #12122a 0%, #1a1a3e 100%)",
    directiveAccent: "#a5b4fc",
    signalHeader: "What the data found",
  };
  if (score < 70) return {
    mode: "advisory",
    directiveLabel: "🎯 The Directive",
    directiveBorder: "#22c55e33",
    directiveBg: "linear-gradient(135deg, #0f1f1a 0%, #0a1a12 100%)",
    directiveAccent: "#22c55e",
    signalHeader: "What the data found",
  };
  return {
    mode: "alarm",
    directiveLabel: "🚨 The Directive",
    directiveBorder: "#ef444433",
    directiveBg: "linear-gradient(135deg, #1f0f0a 0%, #1a0a0a 100%)",
    directiveAccent: "#ef4444",
    signalHeader: "Critical signals found",
  };
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
          AI-powered analysis of job security, career trajectory, and future-proofing strategies.
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
              <input type="text" placeholder="Current or previous company (optional but recommended)" value={company} onChange={(e) => setCompany(e.target.value)} style={{ width: "100%", padding: "14px 18px", borderRadius: "12px", border: "1px solid #ffffff12", backgroundColor: "#12122a", color: "#fff", fontSize: "15px", outline: "none" }} />
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
            <p style={{ fontSize: "11px", color: "#4a4f7a", marginTop: "4px" }}>This usually takes 30–60 seconds</p>
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

// ─── Ask workforce.ai Widget ─────────────────────────────────

function getSuggestedQuestions(tab, person, scores, hiringSignals) {
  const name = person?.name?.split(" ")[0] || "this person";
  const fn = person?.currentFunction || "their function";
  const title = person?.currentTitle || "their role";
  const company = person?.currentCompany || "their company";
  const level = person?.currentLevel || "their level";
  const school = person?.education?.split("@")?.[1]?.split(",")?.[0]?.trim() || null;

  const questions = {
    ai: [
      `What is the AI risk to the ${title} position in general?`,
      `How are companies like ${company} using AI to replace ${fn} roles?`,
      `What AI skills should ${name} learn to stay competitive?`,
      `Is ${level}-level more or less exposed to AI than junior roles?`,
    ],
    company: [
      `Is ${company} growing in other departments besides ${fn}?`,
      `How does ${company}'s attrition compare to similar companies?`,
      `What does the hiring pattern at ${company} tell us about their strategy?`,
      `Should ${name} be concerned about ${company}'s trajectory?`,
    ],
    salary: [
      `How does ${name}'s likely comp compare to market for ${title}?`,
      `What's the salary upside if ${name} moved to a larger company?`,
      `How will AI affect compensation for ${fn} roles over the next 3 years?`,
      `What level does ${name} need to reach for a significant pay bump?`,
    ],
    opportunities: [
      ...(hiringSignals?.multiSignal?.length > 0
        ? [`Why is ${hiringSignals.multiSignal[0].name} a strong fit for ${name}?`]
        : []),
      `Which of these companies should ${name} prioritize reaching out to?`,
      `How should ${name} leverage their network for warm introductions?`,
      ...(school ? [`How strong is the ${school} alumni network for ${fn} roles?`] : []),
      `What's the best way to approach companies on this list?`,
    ],
    retraining: [
      `How realistic is the top recommended path for someone at ${name}'s stage?`,
      `What certifications would make ${name} more competitive?`,
      `Can ${name} make a lateral move without taking a pay cut?`,
      `Which of these paths has the fastest time to transition?`,
    ],
  };

  return (questions[tab] || []).slice(0, 4);
}

function AskBar({ tab, person, scores, company, salary, hiringSignals }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const suggested = getSuggestedQuestions(tab, person, scores, hiringSignals);

  const handleAsk = async (q) => {
    const text = q || question;
    if (!text.trim() || loading) return;

    setExpanded(true);
    setMessages((prev) => [...prev, { role: "user", text }]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          person,
          scores,
          company,
          salary,
          hiringSignals,
          tab,
        }),
      });
      let data;
      try {
        const responseText = await res.text();
        data = JSON.parse(responseText);
      } catch {
        data = { answer: "The AI assistant timed out. Try a shorter question." };
      }
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer || data.error || "No response." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ backgroundColor: "#12122a", borderRadius: "14px", border: "1px solid #6366f122", overflow: "hidden" }}>
        {/* Header bar — always visible */}
        <div
          onClick={() => setExpanded(!expanded)}
          style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <div className="flex items-center gap-2">
            <div style={{ width: "22px", height: "22px", borderRadius: "7px", background: "linear-gradient(135deg, #6366f1, #a5b4fc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#fff" }}>W</div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#a5b4fc", letterSpacing: "0.02em" }}>Ask workforce.ai</span>
            {messages.length > 0 && (
              <span style={{ fontSize: "10px", color: "#4a4f7a", marginLeft: "4px" }}>· {messages.filter(m => m.role === "user").length} question{messages.filter(m => m.role === "user").length !== 1 ? "s" : ""}</span>
            )}
          </div>
          <span style={{ fontSize: "14px", color: "#4a4f7a", transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
        </div>

        {/* Expanded area */}
        {expanded && (
          <div style={{ padding: "0 16px 16px" }}>
            {/* Suggested questions */}
            {messages.length === 0 && suggested.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "10px", color: "#4a4f7a", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Suggested questions</div>
                <div className="flex flex-wrap gap-2">
                  {suggested.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleAsk(q)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: 500,
                        color: "#a5b4fc",
                        backgroundColor: "#6366f10a",
                        border: "1px solid #6366f122",
                        cursor: "pointer",
                        textAlign: "left",
                        lineHeight: 1.4,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { e.target.style.backgroundColor = "#6366f118"; e.target.style.borderColor = "#6366f144"; }}
                      onMouseLeave={(e) => { e.target.style.backgroundColor = "#6366f10a"; e.target.style.borderColor = "#6366f122"; }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat history */}
            {messages.length > 0 && (
              <div style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "12px", scrollbarWidth: "thin" }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ marginBottom: "12px" }}>
                    {msg.role === "user" ? (
                      <div className="flex items-start gap-2">
                        <span style={{ fontSize: "10px", color: "#4a4f7a", fontWeight: 700, minWidth: "28px", marginTop: "2px" }}>YOU</span>
                        <div style={{ fontSize: "12px", color: "#fff", fontWeight: 600 }}>{msg.text}</div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <div style={{ minWidth: "28px", marginTop: "1px" }}>
                          <div style={{ width: "16px", height: "16px", borderRadius: "5px", background: "linear-gradient(135deg, #6366f1, #a5b4fc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 800, color: "#fff" }}>W</div>
                        </div>
                        <div style={{ fontSize: "12px", color: "#c4c8e0", lineHeight: 1.75, whiteSpace: "pre-line" }}>{msg.text}</div>
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2" style={{ marginTop: "8px" }}>
                    <div style={{ minWidth: "28px" }}>
                      <div style={{ width: "16px", height: "16px", borderRadius: "5px", background: "linear-gradient(135deg, #6366f1, #a5b4fc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 800, color: "#fff" }}>W</div>
                    </div>
                    <div style={{ fontSize: "12px", color: "#6366f1" }}>
                      <span className="animate-pulse">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                placeholder="Ask a follow-up question..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #ffffff12",
                  backgroundColor: "#0a0a1a",
                  color: "#fff",
                  fontSize: "12px",
                  outline: "none",
                }}
              />
              <button
                onClick={() => handleAsk()}
                disabled={loading || !question.trim()}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: loading || !question.trim() ? "#1a1a2e" : "#6366f1",
                  color: loading || !question.trim() ? "#4a4f7a" : "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: loading || !question.trim() ? "default" : "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                Ask →
              </button>
            </div>

            {/* Show suggested again after conversation */}
            {messages.length > 0 && !loading && suggested.length > 0 && (
              <div className="flex flex-wrap gap-1" style={{ marginTop: "10px" }}>
                {suggested.filter(q => !messages.some(m => m.text === q)).slice(0, 3).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleAsk(q)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "10px",
                      color: "#6366f1",
                      backgroundColor: "transparent",
                      border: "1px solid #6366f122",
                      cursor: "pointer",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Report Dashboard ─────────────────────────────────────────

function Report({ data, onReset }) {
  const [tab, setTab] = useState("overview");
  const { person, scores, company, salary, narrative, hiringSignals } = data;

  const hasSignals = hiringSignals && (
    hiringSignals.regional?.totalHires > 0 ||
    hiringSignals.employerFlow?.totalAlumni > 0 ||
    hiringSignals.school?.totalHires > 0 ||
    hiringSignals.multiSignal?.length > 0
  );

  const tabs = [
    { id: "overview", label: "Overview", icon: "⚡" },
    { id: "ai", label: "AI Risk", icon: "🤖" },
    { id: "company", label: "Company", icon: "🏢" },
    { id: "salary", label: "Salary", icon: "💰" },
    ...(hasSignals ? [{ id: "opportunities", label: "Opportunities", icon: "🚀" }] : []),
    { id: "retraining", label: narrative?.isPreCareer ? "Career Paths" : "Future-Proofing", icon: "🎯" },
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

        {/* Ask workforce.ai — on all tabs except overview */}
        {tab !== "overview" && (
          <AskBar
            key={tab}
            tab={tab}
            person={person}
            scores={scores}
            company={company}
            salary={salary}
            hiringSignals={hiringSignals}
          />
        )}

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="animate-fade-in">
            {person.titleIsGeneric && (
              <div style={{ padding: "16px", border: "1px solid #f59e0b44", borderRadius: "12px", backgroundColor: "#f59e0b0a", marginBottom: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#f59e0b", marginBottom: "6px" }}>⚠️ Generic Title Detected — Assessment May Be Broad</div>
                <div style={{ fontSize: "12px", color: "#8a8fb5", lineHeight: 1.7 }}>
                  Our data source only has <strong style={{ color: "#fff" }}>"{person.currentTitle}"</strong> for this profile — no specialty information. The analysis below is based on their broader {person.currentFunction} background. To get a sharper, role-specific assessment, tell us their actual focus area in the chat — e.g. "Katherine is a Paid Social Manager specializing in Meta Ads."
                </div>
              </div>
            )}
            {narrative?.isPreCareer && (
              <div style={{ padding: "16px", border: "1px solid #f59e0b44", borderRadius: "12px", backgroundColor: "#f59e0b0a", marginBottom: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#f59e0b", marginBottom: "6px" }}>📋 Limited Assessment — {narrative.careerStageAssessment?.includes("student") || narrative.careerStageAssessment?.includes("Student") ? "Student" : "Early / Transitional Career"}</div>
                <div style={{ fontSize: "12px", color: "#8a8fb5", lineHeight: 1.7 }}>
                  Traditional risk scores require an established professional role. Directional career guidance is provided instead — see the <span style={{ color: "#a5b4fc", cursor: "pointer" }} onClick={() => setTab("retraining")}>Career Paths</span> tab for the most actionable insights.
                </div>
              </div>
            )}
            <Section title="Risk Summary" icon="⚡">
              {narrative.overviewSummary && (
                <div style={{ fontSize: "14px", color: "#c4c8e0", lineHeight: 2.0, marginBottom: "20px", padding: "20px", background: "linear-gradient(135deg, #12122a 0%, #1a1a3e 100%)", borderRadius: "12px", border: "1px solid #6366f122" }}>
                  {narrative.overviewSummary}
                  {narrative.overviewDetail && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #ffffff0a", fontSize: "13px", color: "#8a8fb5", lineHeight: 1.9 }}>
                      {narrative.overviewDetail}
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div style={{ background: "#0a0a1a", borderRadius: "12px", padding: "16px" }}>
                  <RiskBar label="AI Automation Exposure" value={scores.aiRisk} color={riskColor(scores.aiRisk)} delay={100} tip="How likely is it that AI tools could perform key tasks in this specific role within the next 2–3 years? Higher = more at risk of automation." />
                  <RiskBar label="Function Churn" value={scores.functionChurn} color={riskColor(scores.functionChurn)} delay={200} tip="How often are people in this job function leaving their roles industry-wide? High churn signals instability in the field." />
                  <RiskBar label="Company Instability" value={scores.companyInstability} color={riskColor(scores.companyInstability)} delay={300} tip="Based on hiring/departure ratios, headcount trend, and layoff signals — how stable does this company appear right now?" />
                </div>
                <div style={{ background: "#0a0a1a", borderRadius: "12px", padding: "16px" }}>
                  <RiskBar label="Promotion Ceiling" value={scores.promotionCeiling} color={riskColor(scores.promotionCeiling)} delay={400} tip="How difficult is it to advance to the next level at this company or in this function? High = few openings above, slow career progression." />
                  <RiskBar label="Salary Compression" value={scores.salaryCompression} color={riskColor(scores.salaryCompression)} delay={500} tip="Is pay getting squeezed? High compression means the gap between entry-level and senior pay is narrowing — limiting upside from tenure alone." />
                  <RiskBar label="Tenure Volatility" value={scores.tenureVolatility} color={riskColor(scores.tenureVolatility)} delay={600} tip="How frequently does this person tend to change jobs relative to peers? Short stints can reduce perceived stability to future employers." />
                </div>
              </div>
              {narrative.careerStageAssessment && (
                <div style={{ padding: "14px", border: "1px solid #6366f133", borderRadius: "10px", backgroundColor: "#6366f108", marginTop: "8px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#a5b4fc", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Career Stage Assessment</div>
                  <div style={{ fontSize: "13px", color: "#8a8fb5", lineHeight: 1.7 }}>{narrative.careerStageAssessment}</div>
                </div>
              )}
            </Section>

            {/* Local Market — summary only, no company list (see Opportunities tab) */}
            {(() => {
              const geoLabel = hiringSignals?.geoCity || hiringSignals?.geoRegion?.split(",")[0]?.trim() || person.location?.split(",")[0]?.trim() || "Your Area";
              const hasLocal = hiringSignals?.regional?.totalHires > 0 || narrative?.localMarketSummary || narrative?.hiringOutlook;
              if (!hasLocal) return null;
              return (
                <Section title={`Local Market · ${geoLabel}`} icon="📍">
                  {/* Primary narrative — city-specific, one focused paragraph */}
                  {(narrative.localMarketSummary || narrative.hiringOutlook) && (
                    <div style={{ fontSize: "13px", color: "#c4c8e0", lineHeight: 1.9, marginBottom: "18px" }}>
                      {narrative.localMarketSummary || narrative.hiringOutlook}
                    </div>
                  )}
                  {/* Stat pills */}
                  {hiringSignals?.regional?.totalHires > 0 && (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                      <div style={{ flex: 1, minWidth: "100px", background: "#0a0a1a", borderRadius: "12px", padding: "14px", textAlign: "center" }}>
                        <div style={{ fontSize: "22px", fontWeight: 800, color: "#22c55e" }}>{hiringSignals.regional.totalHires.toLocaleString()}*</div>
                        <div style={{ fontSize: "10px", color: "#4a4f7a", marginTop: "4px" }}>observed hires · {person.currentTitle}</div>
                        <div style={{ fontSize: "10px", color: "#6a6f9a", marginTop: "2px", fontStyle: "italic" }}>last 6 months</div>
                      </div>
                      {hiringSignals.regional.totalCompanies > 0 && (
                        <div style={{ flex: 1, minWidth: "100px", background: "#0a0a1a", borderRadius: "12px", padding: "14px", textAlign: "center" }}>
                          <div style={{ fontSize: "22px", fontWeight: 800, color: "#a5b4fc" }}>{hiringSignals.regional.totalCompanies.toLocaleString()}</div>
                          <div style={{ fontSize: "10px", color: "#4a4f7a", marginTop: "4px" }}>companies hiring locally</div>
                          <div style={{ fontSize: "10px", color: "#6a6f9a", marginTop: "2px", fontStyle: "italic" }}>in {geoLabel}</div>
                        </div>
                      )}
                      {hiringSignals.multiSignal?.length > 0 && (
                        <div style={{ flex: 1, minWidth: "100px", background: "#0a0a1a", borderRadius: "12px", padding: "14px", textAlign: "center" }}>
                          <div style={{ fontSize: "22px", fontWeight: 800, color: "#f59e0b" }}>{hiringSignals.multiSignal.length}</div>
                          <div style={{ fontSize: "10px", color: "#4a4f7a", marginTop: "4px" }}>warm door matches</div>
                          <div style={{ fontSize: "10px", color: "#6a6f9a", marginTop: "2px", fontStyle: "italic" }}>network overlap</div>
                        </div>
                      )}
                    </div>
                  )}
                  {!hiringSignals?.regional?.totalHires && (
                    <div style={{ padding: "14px", background: "#1a0f0a", border: "1px solid #f59e0b33", borderRadius: "10px", fontSize: "12px", color: "#8a8fb5", lineHeight: 1.7 }}>
                      ⚠️ Local hiring data for this specific role in {geoLabel} is limited — which is itself a signal worth noting. This could reflect a thin local market for this title, or that the bulk of activity is remote or concentrated in other metros. See the <span style={{ color: "#a5b4fc", cursor: "pointer" }} onClick={() => setTab("opportunities")}>Opportunities tab</span> for full signal breakdown.
                    </div>
                  )}
                  <div style={{ fontSize: "10px", color: "#4a4f7a", marginTop: "10px" }}>
                    * Sample-based from workforce.ai tracking — directional, not census figures · <span style={{ color: "#a5b4fc", cursor: "pointer" }} onClick={() => setTab("opportunities")}>See full company list →</span>
                  </div>
                </Section>
              );
            })()}

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
            <Section title={`AI Risk · ${person.currentTitle}`} icon="🤖">
              {/* Stats row — numbers first */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
                <div style={{ flex: 1, minWidth: "90px", background: "#0a0a1a", borderRadius: "12px", padding: "16px", textAlign: "center", border: `1px solid ${riskColor(scores.aiRisk)}22` }}>
                  <div style={{ fontSize: "26px", fontWeight: 800, color: riskColor(scores.aiRisk), lineHeight: 1.1 }}>{scores.aiRisk}</div>
                  <div style={{ fontSize: "10px", color: "#4a4f7a", marginTop: "5px" }}>AI Risk Score</div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: riskColor(scores.aiRisk), marginTop: "3px" }}>{riskLabel(scores.aiRisk)}</div>
                </div>
                <div style={{ flex: 1, minWidth: "90px", background: "#0a0a1a", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "26px", fontWeight: 800, color: "#a5b4fc", lineHeight: 1.1 }}>{person.currentLevel}</div>
                  <div style={{ fontSize: "10px", color: "#4a4f7a", marginTop: "5px" }}>Seniority Level</div>
                </div>
                <div style={{ flex: 1, minWidth: "90px", background: "#0a0a1a", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "26px", fontWeight: 800, color: scores.aiRisk < 40 ? "#22c55e" : scores.aiRisk < 65 ? "#f59e0b" : "#ef4444", lineHeight: 1.1 }}>
                    {scores.aiRisk < 40 ? "Low" : scores.aiRisk < 65 ? "Mid" : "High"}
                  </div>
                  <div style={{ fontSize: "10px", color: "#4a4f7a", marginTop: "5px" }}>Exposure Band</div>
                </div>
              </div>

              {/* Role-specific AI threat narrative */}
              {narrative.aiThreatAnalysis && (
                <div style={{ fontSize: "13px", color: "#c4c8e0", lineHeight: 1.9, marginBottom: "20px", padding: "18px", background: "linear-gradient(135deg, #1a0f0f 0%, #120a0a 100%)", borderRadius: "12px", border: "1px solid #ef444422" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                    How AI Affects {person.currentTitle} Specifically
                  </div>
                  {narrative.aiThreatAnalysis}
                </div>
              )}

              {/* Role-specific displacement bars */}
              {(() => {
                // Build role-contextual profile — try to match current title, fall back to function
                const title = (person.currentTitle || "").toLowerCase();
                const aiProfiles = {
                  "Engineering": [
                    { role: "Code generation / boilerplate",     risk: 82, note: "GitHub Copilot & peers do this today", tags: ["junior", "engineer", "developer", "swe"] },
                    { role: "QA / automated testing",             risk: 71, note: "AI-assisted test generation growing fast", tags: ["qa", "test", "quality"] },
                    { role: "Mid-level feature development",      risk: 55, note: "Pair programming with AI — scope shrinks", tags: ["engineer", "developer", "software"] },
                    { role: "Architecture / system design",       risk: 28, note: "Judgment-intensive — AI-resistant", tags: ["architect", "principal", "staff", "senior staff"] },
                    { role: "Staff+ technical leadership",        risk: 15, note: "Organizational influence — protected", tags: ["vp", "cto", "director", "head of"] },
                  ],
                  "Publishing, Editorial and Reporting": [
                    { role: "Data / markets automated output",    risk: 88, note: "AP, Reuters, Bloomberg automate this now", tags: ["data reporter", "markets", "finance reporter"] },
                    { role: "Earnings / finance reporting",       risk: 74, note: "Highest automation overlap in journalism", tags: ["reporter", "journalist", "writer"] },
                    { role: "General business news",              risk: 61, note: "Mid-risk — depends on source depth", tags: ["staff writer", "correspondent"] },
                    { role: "Investigative / regulatory",         risk: 28, note: "Source-driven — AI-resistant", tags: ["investigative", "regulatory", "policy"] },
                    { role: "Senior analytical / columnist",      risk: 16, note: "Voice and judgment — protected", tags: ["editor", "senior editor", "managing editor", "columnist"] },
                  ],
                  "Finance and Administration": [
                    { role: "Data entry / reconciliation",        risk: 85, note: "Heavily automated by RPA and AI tools", tags: ["analyst", "associate", "coordinator"] },
                    { role: "Routine financial reporting",        risk: 72, note: "Templated reports increasingly AI-generated", tags: ["financial analyst", "accountant"] },
                    { role: "FP&A / budget modeling",             risk: 48, note: "Augmented by AI but judgment still required", tags: ["fp&a", "finance manager", "senior analyst"] },
                    { role: "Strategic finance / CFO advisory",   risk: 22, note: "Executive judgment — AI-resistant", tags: ["vp finance", "cfo", "director finance", "controller"] },
                  ],
                  "Sales and Support": [
                    { role: "Tier 1 support / FAQs",              risk: 80, note: "Chatbots handling most of this already", tags: ["support", "customer service", "tier 1"] },
                    { role: "SDR / outbound prospecting",         risk: 65, note: "AI sequencing replacing manual outreach", tags: ["sdr", "bdr", "sales development"] },
                    { role: "Account management",                 risk: 40, note: "Relationship-driven — partially protected", tags: ["account manager", "am", "csm", "customer success"] },
                    { role: "Enterprise / strategic sales",       risk: 20, note: "Complex deals — human judgment required", tags: ["enterprise", "ae", "account executive", "vp sales"] },
                  ],
                  "Marketing and Product": [
                    { role: "Content creation / copywriting",     risk: 78, note: "Generative AI directly competes here", tags: ["content", "copywriter", "writer", "content manager"] },
                    { role: "Performance / paid marketing",       risk: 60, note: "Automation tools replacing manual ops", tags: ["performance", "paid", "growth", "demand gen"] },
                    { role: "Product management",                 risk: 35, note: "Prioritization and stakeholder work — resistant", tags: ["product manager", "pm", "product lead"] },
                    { role: "Brand / creative strategy",          risk: 25, note: "Taste and narrative — protected", tags: ["brand", "creative director", "vp marketing", "cmo"] },
                  ],
                  "Business Management": [
                    { role: "Operational reporting / dashboards", risk: 70, note: "BI tools and AI automating routine reports", tags: ["ops", "operations analyst", "coordinator"] },
                    { role: "Project coordination",               risk: 55, note: "AI scheduling and tracking tools growing", tags: ["project manager", "program manager", "pmo"] },
                    { role: "Strategy / general management",      risk: 28, note: "Leadership and judgment — AI-resistant", tags: ["director", "vp", "chief of staff", "general manager"] },
                  ],
                };
                const fnKey = person.currentFunction;
                const profile = aiProfiles[fnKey] || aiProfiles["Business Management"];
                // Find which row best matches the person's title
                const bestMatchIdx = profile.reduce((best, row, i) => {
                  const matches = row.tags.filter(tag => title.includes(tag)).length;
                  return matches > (profile[best]?.tags.filter(tag => title.includes(tag)).length || 0) ? i : best;
                }, -1);
                return (
                  <div style={{ background: "#0a0a1a", borderRadius: "12px", padding: "18px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
                      AI Displacement Risk by Role — {fnKey}
                    </div>
                    <div style={{ fontSize: "11px", color: "#4a4f7a", marginBottom: "14px" }}>
                      {person.currentTitle} is highlighted below. Higher score = greater automation overlap.
                    </div>
                    {profile.map((row, i) => {
                      const isMatch = i === bestMatchIdx;
                      return (
                        <div key={i} style={{ marginBottom: "12px", padding: isMatch ? "10px 12px" : "0", borderRadius: isMatch ? "8px" : "0", background: isMatch ? `${riskColor(row.risk)}0d` : "transparent", border: isMatch ? `1px solid ${riskColor(row.risk)}33` : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: isMatch ? "#fff" : "#8a8fb5", fontWeight: isMatch ? 700 : 400 }}>
                              {row.role} {isMatch && <span style={{ fontSize: "10px", color: riskColor(row.risk), fontWeight: 700 }}> ← your role</span>}
                            </span>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: riskColor(row.risk) }}>{row.risk}</span>
                          </div>
                          <div style={{ height: "5px", backgroundColor: "#1a1f3a", borderRadius: "3px", marginBottom: "4px" }}>
                            <div style={{ width: `${row.risk}%`, height: "100%", backgroundColor: riskColor(row.risk), borderRadius: "3px" }} />
                          </div>
                          <div style={{ fontSize: "10px", color: isMatch ? "#8a8fb5" : "#4a4f7a" }}>{row.note}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {narrative.aiMitigatingFactors && (
                <div style={{ padding: "16px", border: "1px solid #22c55e33", borderRadius: "12px", backgroundColor: "#22c55e08", marginBottom: "12px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#22c55e", marginBottom: "8px" }}>🛡️ What Protects {person.name.split(" ")[0]}</div>
                  <div style={{ fontSize: "13px", color: "#8a8fb5", lineHeight: 1.7 }}>{narrative.aiMitigatingFactors}</div>
                </div>
              )}
              {narrative.aiVulnerabilities && (
                <div style={{ padding: "16px", border: "1px solid #ef444433", borderRadius: "12px", backgroundColor: "#ef444408" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#ef4444", marginBottom: "8px" }}>⚠️ What's at Risk</div>
                  <div style={{ fontSize: "13px", color: "#8a8fb5", lineHeight: 1.7 }}>{narrative.aiVulnerabilities}</div>
                </div>
              )}
            </Section>
          </div>
        )}

        {/* COMPANY */}
        {tab === "company" && (
          <div className="animate-fade-in">
            <Section title={`${person.currentCompany} · Company Intelligence`} icon="🏢">
              <div style={{ fontSize: "11px", color: "#6b7094", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#a5b4fc", fontWeight: 600 }}>Source: workforce.ai</span>
                <span style={{ color: "#3a3f5c" }}>·</span>
                Tracking 100M+ professionals
                <span style={{ color: "#3a3f5c" }}>·</span>
                Reflects observed workforce patterns, not official headcount
              </div>

              {/* Para 1: Company overview + competitive positioning + risk profile */}
              {(narrative.companyHealthNarrative || narrative.companyHealthSummary) && (
                <div style={{ fontSize: "13px", color: "#c4c8e0", lineHeight: 1.95, marginBottom: "12px", padding: "20px", background: "linear-gradient(135deg, #12122a 0%, #1a1a3e 100%)", borderRadius: "14px", border: "1px solid #6366f122" }}>
                  {narrative.companyHealthNarrative || narrative.companyHealthSummary}
                </div>
              )}

              {/* Para 2: AI disruption exposure at the company level + outlook */}
              {(narrative.companyOutlook || narrative.companyAiExposure) && (
                <div style={{ fontSize: "13px", color: "#c4c8e0", lineHeight: 1.95, marginBottom: "20px", padding: "20px", background: "linear-gradient(135deg, #1a0f0a 0%, #120a0a 100%)", borderRadius: "14px", border: "1px solid #ef444420" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>AI & Competitive Exposure</div>
                  {narrative.companyAiExposure || narrative.companyOutlook}
                </div>
              )}

              {/* Key stats */}
              <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "8px" }}>
                <Stat label="Headcount*" value={company.totalHeadcount?.toLocaleString() || "?"} color="#a5b4fc" />
                {company.deptHeadcount != null && (
                  <Stat label={`${company.deptName || person.currentFunction}*`} value={company.deptHeadcount?.toLocaleString()} color="#6366f1" />
                )}
                <Stat label="2-Year Growth" value={`${company.growthPct > 0 ? "+" : ""}${company.growthPct}%`} color={company.growthPct > 0 ? "#22c55e" : "#ef4444"} />
                <Stat label="Stability Score" value={`${100 - scores.companyInstability}/100`} color={riskColor(scores.companyInstability)} />
              </div>
              <div style={{ fontSize: "10px", color: "#4a4f7a", textAlign: "center", marginBottom: "20px" }}>
                * Observed sample from workforce.ai — directional figures, not official company headcount
              </div>

              {/* Dual headcount chart — total + dept */}
              {company.headcountTimeline && company.headcountTimeline.length > 1 && (() => {
                const tl = company.headcountTimeline;
                const totalMin = Math.min(...tl.map(p => p.count));
                const totalMax = Math.max(...tl.map(p => p.count));
                const totalRange = totalMax - totalMin || 1;
                const hasDept = tl[0]?.dept != null;
                const deptMin = hasDept ? Math.min(...tl.map(p => p.dept)) : 0;
                const deptMax = hasDept ? Math.max(...tl.map(p => p.dept)) : 1;
                const deptRange = deptMax - deptMin || 1;
                const totalDelta = tl[tl.length - 1].count - tl[0].count;
                const deptDelta = hasDept ? tl[tl.length - 1].dept - tl[0].dept : 0;
                const maxBarH = 56;
                const minBarH = 8;
                function barH(val, min, range) { return minBarH + ((val - min) / range) * (maxBarH - minBarH); }

                return (
                  <div style={{ background: "#0a0a1a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                    {/* Total row */}
                    <div style={{ marginBottom: "20px" }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: "8px" }}>
                        <div className="flex items-center gap-2">
                          <div style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#a5b4fc" }} />
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>Total Company*</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: "12px", color: "#8a8fb5" }}>{tl[0].count.toLocaleString()} → {tl[tl.length-1].count.toLocaleString()}</span>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: totalDelta >= 0 ? "#22c55e" : "#ef4444" }}>{totalDelta >= 0 ? "+" : ""}{totalDelta.toLocaleString()}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: `${maxBarH}px` }}>
                        {tl.map((pt, i) => (
                          <div key={i} style={{ flex: 1, height: `${barH(pt.count, totalMin, totalRange)}px`, backgroundColor: i === tl.length - 1 ? "#a5b4fc" : "#a5b4fc55", borderRadius: "3px 3px 0 0" }} />
                        ))}
                      </div>
                    </div>

                    {/* Dept row */}
                    {hasDept && (
                      <div>
                        <div className="flex items-center justify-between" style={{ marginBottom: "8px" }}>
                          <div className="flex items-center gap-2">
                            <div style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#6366f1" }} />
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>{company.deptName || person.currentFunction}*</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: "12px", color: "#8a8fb5" }}>{tl[0].dept.toLocaleString()} → {tl[tl.length-1].dept.toLocaleString()}</span>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: deptDelta >= 0 ? "#22c55e" : "#ef4444" }}>{deptDelta >= 0 ? "+" : ""}{deptDelta.toLocaleString()}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: `${maxBarH}px` }}>
                          {tl.map((pt, i) => (
                            <div key={i} style={{ flex: 1, height: `${barH(pt.dept, deptMin, deptRange)}px`, backgroundColor: i === tl.length - 1 ? "#6366f1" : "#6366f155", borderRadius: "3px 3px 0 0" }} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Date labels */}
                    <div style={{ display: "flex", marginTop: "8px" }}>
                      {tl.map((pt, i) => (
                        <span key={i} style={{ flex: 1, fontSize: "9px", color: "#4a4f7a", textAlign: "center" }}>
                          {i === 0 || i === Math.floor(tl.length / 2) || i === tl.length - 1 ? pt.date : ""}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: "9px", color: "#4a4f7a", marginTop: "6px" }}>* Observed sample — see note above</div>
                  </div>
                );
              })()}

              {/* Function Health Table */}
              {company.flows && company.flows.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>📈 Function Health — Which departments are growing?</div>
                  <div style={{ fontSize: "11px", color: "#8a8fb5", lineHeight: 1.5, marginBottom: "12px" }}>
                    Your function ({person.currentFunction}) is highlighted.
                  </div>
                  <div style={{ background: "#0a0a1a", borderRadius: "12px", padding: "16px", overflowX: "auto" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 65px 75px 60px 65px", gap: "8px", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid #ffffff12" }}>
                      {["Function", "Hires*", "Deps*", "Net", "Churn"].map((h, i) => (
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
                            <span style={{ fontSize: "12px", color: f.net >= 0 ? "#22c55e" : "#ef4444", textAlign: "right", fontWeight: 600 }}>{f.net >= 0 ? "+" : ""}{f.net}</span>
                            <span style={{ fontSize: "12px", color: churnColor, textAlign: "right", fontWeight: 600 }}>{f.churnPct}%</span>
                          </div>
                        );
                      })}
                    <div style={{ fontSize: "9px", color: "#4a4f7a", marginTop: "8px" }}>* Observed sample from workforce.ai tracking</div>
                  </div>
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

        {/* OPPORTUNITIES (Hiring Signals) */}
        {tab === "opportunities" && hiringSignals && (
          <div className="animate-fade-in">
            {/* Headline stats */}
            <Section title="Who's Hiring People Like You" icon="🚀">
              <div style={{ fontSize: "12px", color: "#4a4f7a", marginBottom: "14px" }}>
                Signals filtered to <strong style={{ color: "#a5b4fc" }}>{person.currentTitle}</strong> in <strong style={{ color: "#22c55e" }}>{hiringSignals?.geoCity || hiringSignals?.geoRegion?.split(",")[0] || person.location?.split(",")[0] || "your area"}</strong> — role-specific, not just department-level
              </div>
              <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "16px" }}>
                {hiringSignals.regional?.totalHires > 0 && (
                  <Stat label="Role-Match Hires*" value={hiringSignals.regional.totalHires.toLocaleString()} sub={person.currentTitle} color="#22c55e" />
                )}
                {hiringSignals.regional?.totalCompanies > 0 && (
                  <Stat label="Companies Hiring" value={hiringSignals.regional.totalCompanies.toLocaleString()} sub={hiringSignals.geoCity || person.location?.split(",")[0] || ""} color="#a5b4fc" />
                )}
                {hiringSignals.employerFlow?.totalAlumni > 0 && (
                  <Stat label="Alumni Tracked" value={hiringSignals.employerFlow.totalAlumni.toLocaleString()} sub="From your employers" color="#6366f1" />
                )}
                {hiringSignals.school?.totalHires > 0 && (
                  <Stat label="School Network" value={hiringSignals.school.totalHires.toLocaleString()} sub={(hiringSignals.schools || [])[0] || "Alumni"} color="#f59e0b" />
                )}
              </div>
              <div style={{ fontSize: "9px", color: "#4a4f7a", marginBottom: "4px" }}>* Sample-based from workforce.ai tracking — directional, not census figures</div>

              {/* Narrative */}
              {narrative?.hiringOutlook && (
                <div style={{ fontSize: "13px", color: "#c4c8e0", lineHeight: 1.85, marginTop: "12px", whiteSpace: "pre-line" }}>
                  {narrative.hiringOutlook}
                </div>
              )}

              {/* Thin local market warning */}
              {!hiringSignals.regional?.totalHires && (
                <div style={{ padding: "16px", background: "#1a0f0a", border: "1px solid #f59e0b44", borderRadius: "12px", marginTop: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#f59e0b", marginBottom: "8px" }}>⚠️ Thin Local Market for {person.currentTitle}</div>
                  <div style={{ fontSize: "13px", color: "#8a8fb5", lineHeight: 1.7 }}>
                    Observed hiring for <strong style={{ color: "#fff" }}>{person.currentTitle}</strong> specifically in {hiringSignals?.geoCity || person.location?.split(",")[0] || "your area"} is limited over the past 6 months. This is a meaningful signal — it may indicate that the local market for this role is thin, that demand is concentrated in remote-first companies, or that activity is clustered in a nearby metro. This is worth factoring into your strategy: either expand your geographic radius, target remote-open roles, or position a move to a denser market. The alumni and school network signals below may be your strongest near-term lever.
                  </div>
                </div>
              )}
            </Section>

            {/* Multi-Signal / Warmest Matches */}
            {hiringSignals.multiSignal?.length > 0 && (
              <Section title="Warmest Opportunities" icon="🔥">
                <div style={{ fontSize: "12px", color: "#8a8fb5", lineHeight: 1.7, marginBottom: "16px" }}>
                  Companies appearing in multiple signals — local hiring <em>and</em> network overlap. These are your highest-probability doors.
                </div>
                {hiringSignals.multiSignal.map((co, i) => {
                  const signalLabels = {
                    hiring_locally: { label: "Hiring locally", color: "#22c55e", icon: "📍" },
                    employer_network: { label: "Employer network", color: "#6366f1", icon: "🤝" },
                    school_network: { label: "School network", color: "#f59e0b", icon: "🎓" },
                    function_growth: { label: "Growing function", color: "#a5b4fc", icon: "📈" },
                  };
                  const contact = co.suggestedContact || co.contact;
                  return (
                    <div key={i} style={{ background: "#0a0a1a", borderRadius: "12px", padding: "16px", marginBottom: "8px", border: co.signals.length >= 3 ? "1px solid #22c55e33" : "1px solid #ffffff08" }}>
                      <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: "15px", fontWeight: 800, color: co.signals.length >= 3 ? "#22c55e" : "#fff" }}>{co.name}</span>
                            {co.signals.length >= 3 && <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "#22c55e18", color: "#22c55e", fontWeight: 700 }}>TOP MATCH</span>}
                          </div>
                          {co.recentHires > 0 && (
                            <div style={{ fontSize: "11px", color: "#4a4f7a", marginTop: "2px" }}>{co.recentHires} role-matched hires in {hiringSignals?.geoCity || "your area"} · last 6 months*</div>
                          )}
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {co.signals.map((sig, j) => {
                            const info = signalLabels[sig] || { label: sig, color: "#8a8fb5", icon: "•" };
                            return (
                              <span key={j} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, color: info.color, border: `1px solid ${info.color}33`, backgroundColor: `${info.color}11` }}>
                                {info.icon} {info.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      {/* Suggested contact */}
                      {contact && (
                        <div style={{ marginTop: "10px", padding: "10px 12px", background: "#12122a", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #a5b4fc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                            {(contact.name || "?")[0]}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>{contact.name}</div>
                            <div style={{ fontSize: "11px", color: "#6366f1" }}>{contact.title}</div>
                            {contact.connectionType && <div style={{ fontSize: "10px", color: "#4a4f7a", marginTop: "1px" }}>{contact.connectionType}</div>}
                          </div>
                          <div style={{ fontSize: "10px", color: "#22c55e", fontWeight: 600 }}>💬 Reach out</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </Section>
            )}

            {/* Local hiring — role-specific, with contact suggestion */}
            {(() => {
              const geoLabel = hiringSignals?.geoCity || hiringSignals?.geoRegion?.split(",")[0]?.trim() || person.location?.split(",")[0]?.trim() || "Your Area";
              const companies = hiringSignals.regional?.topCompanies;
              if (!companies?.length) return null;
              return (
                <Section title={`Hiring ${person.currentTitle} · ${geoLabel}`} icon="📍">
                  <div style={{ fontSize: "12px", color: "#8a8fb5", lineHeight: 1.5, marginBottom: "12px" }}>
                    Companies observed hiring <strong style={{ color: "#fff" }}>{person.currentTitle}</strong> in {geoLabel} in the last 6 months, ranked by volume.*
                  </div>
                  {companies.slice(0, 10).map((c, i) => {
                    const isMulti = hiringSignals.multiSignal?.some((m) => m.name === c.name);
                    const contact = c.suggestedContact || c.contact;
                    return (
                      <div key={i} style={{ padding: "12px", marginBottom: "8px", background: "#0a0a1a", borderRadius: "10px", border: isMulti ? "1px solid #22c55e22" : "1px solid #ffffff06" }}>
                        <div className="flex items-center justify-between" style={{ marginBottom: contact ? "8px" : "0" }}>
                          <span style={{ fontSize: "13px", color: isMulti ? "#22c55e" : "#fff", fontWeight: isMulti ? 700 : 500 }}>
                            {c.name} {isMulti && <span style={{ fontSize: "10px" }}>★</span>}
                          </span>
                          <span style={{ fontSize: "12px", color: "#a5b4fc", fontWeight: 700 }}>{c.hires} hires*</span>
                        </div>
                        {contact && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: "#12122a", borderRadius: "7px" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg, #4a4f7a, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                              {(contact.name || "?")[0]}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "11px", fontWeight: 700, color: "#fff" }}>{contact.name}</div>
                              <div style={{ fontSize: "10px", color: "#6366f1" }}>{contact.title}</div>
                            </div>
                            <span style={{ fontSize: "10px", color: "#22c55e", fontWeight: 600 }}>→ reach out</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div style={{ fontSize: "9px", color: "#4a4f7a", marginTop: "6px" }}>* Observed sample from workforce.ai — directional, not official figures · ★ = appears in multiple signals</div>
                </Section>
              );
            })()}

            {/* Local Alumni — named, with current company context */}
            {hiringSignals.employerFlow?.topDestinations?.length > 0 && (
              <Section title={`Local Alumni · ${hiringSignals?.geoCity || person.location?.split(",")[0] || "Your Area"}`} icon="🤝">
                <div style={{ fontSize: "12px", color: "#8a8fb5", lineHeight: 1.5, marginBottom: "14px" }}>
                  People who worked at {(hiringSignals.employerNames || []).slice(0, 2).join(" or ")} — now nearby. These are warm introductions.
                </div>
                {(hiringSignals.employerFlow.localAlumni || hiringSignals.employerFlow.topDestinations).slice(0, 8).map((d, i) => {
                  const isNamed = !!d.personName;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", marginBottom: "8px", background: "#0a0a1a", borderRadius: "10px", border: "1px solid #6366f118" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #a5b4fc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                        {isNamed ? d.personName[0] : "?"}
                      </div>
                      <div style={{ flex: 1 }}>
                        {isNamed ? (
                          <>
                            <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{d.personName}</div>
                            <div style={{ fontSize: "11px", color: "#6366f1" }}>{d.currentTitle} @ {d.name}</div>
                            {d.sharedEmployer && <div style={{ fontSize: "10px", color: "#4a4f7a", marginTop: "1px" }}>Worked at {d.sharedEmployer} · {d.overlap || "same period"}</div>}
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{d.name}</div>
                            <div style={{ fontSize: "11px", color: "#4a4f7a" }}>{d.count} alumni from your employer network</div>
                          </>
                        )}
                      </div>
                      {isNamed && d.linkedIn && (
                        <a href={d.linkedIn} target="_blank" rel="noopener noreferrer" style={{ fontSize: "10px", color: "#a5b4fc", fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>LinkedIn →</a>
                      )}
                    </div>
                  );
                })}
              </Section>
            )}

            {/* School Network */}
            {hiringSignals.school?.topCompanies?.length > 0 && (
              <Section title={`${(hiringSignals.schools || ["Alumni"])[0]} Network`} icon="🎓">
                <div style={{ fontSize: "12px", color: "#8a8fb5", lineHeight: 1.5, marginBottom: "12px" }}>
                  Where {(hiringSignals.schools || ["your school"])[0]} alumni are landing in <strong style={{ color: "#fff" }}>{person.currentTitle}</strong> and adjacent roles — local first.
                </div>
                <div style={{ background: "#0a0a1a", borderRadius: "12px", padding: "16px" }}>
                  {hiringSignals.school.topCompanies.slice(0, 10).map((c, i) => {
                    const isMulti = hiringSignals.multiSignal?.some((m) => m.name === c.name);
                    return (
                      <div key={i} className="flex items-center justify-between" style={{ padding: "8px 4px", borderBottom: i < 9 ? "1px solid #ffffff06" : "none" }}>
                        <span style={{ fontSize: "12px", color: isMulti ? "#22c55e" : "#fff", fontWeight: isMulti ? 700 : 500 }}>
                          {c.name} {isMulti && "★"}
                        </span>
                        <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 700 }}>{c.hires} alumni*</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: "9px", color: "#4a4f7a", marginTop: "8px" }}>* Sample-based · ★ = warm door</div>
              </Section>
            )}

            <div style={{ fontSize: "10px", color: "#4a4f7a", textAlign: "center", marginTop: "8px", lineHeight: 1.5 }}>
              All figures are observed samples from workforce.ai tracking — directional trends, not census data · ★ = appears in multiple signals
            </div>
          </div>
        )}

        {/* FUTURE-PROOFING */}
        {tab === "retraining" && (
          <div className="animate-fade-in">
            <Section title={narrative?.isPreCareer ? "Career Entry Paths" : "Future-Proofing Playbook"} icon="🎯">
              {/* Tone-driven directive card */}
              {(() => {
                const tone = toneProfile(scores?.overall ?? 50);
                const geoLabel = hiringSignals?.geoCity || person.location?.split(",")[0] || "your area";
                const firstName = person.name?.split(" ")[0] || "You";
                return (
                  <div style={{ background: tone.directiveBg, border: `1px solid ${tone.directiveBorder}`, borderRadius: "16px", padding: "22px", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg, transparent, ${tone.directiveAccent}55, transparent)` }} />
                    <div style={{ fontSize: "11px", fontWeight: 700, color: tone.directiveAccent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>{tone.directiveLabel}</div>

                    {/* Prescriptive strategic narrative — role + location + network specific */}
                    <div style={{ fontSize: "14px", color: "#c4c8e0", lineHeight: 2.0, marginBottom: "16px" }}>
                      {narrative?.futureProofingNarrative || narrative?.strategicNarrative || (
                        `${firstName} is working as a ${person.currentTitle} in ${geoLabel} — a role that sits at a real inflection point. The pressure isn't abstract: the tasks that once justified this title are being compressed by AI tooling, which means the value equation is shifting. The professionals who come out ahead aren't the ones who hold on to what they've always done — they're the ones who move deliberately into territory that's genuinely harder to automate.`
                      )}
                    </div>

                    {/* What to do right now — location and network aware */}
                    {(narrative?.immediateActions || narrative?.tacticalNow) && (
                      <div style={{ marginBottom: "16px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: tone.directiveAccent, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>What to do right now — {geoLabel}</div>
                        <div style={{ fontSize: "13px", color: "#8a8fb5", lineHeight: 1.85 }}>
                          {narrative.immediateActions || narrative.tacticalNow}
                        </div>
                      </div>
                    )}

                    {/* Network lever */}
                    {(narrative?.networkStrategy || (hiringSignals?.multiSignal?.length > 0)) && (
                      <div style={{ padding: "14px", background: "#0a0a1a", borderRadius: "10px", marginBottom: "14px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#22c55e", marginBottom: "8px" }}>🤝 Your Network Lever — Use It Now</div>
                        <div style={{ fontSize: "13px", color: "#8a8fb5", lineHeight: 1.8 }}>
                          {narrative?.networkStrategy || (
                            hiringSignals?.multiSignal?.length > 0
                              ? `${hiringSignals.multiSignal.length} companies appear in both local hiring and your network — these aren't cold applications. People from your employer or school history have already opened doors there. Check the Opportunities tab for specific names to contact. A warm message referencing shared history converts at 3–5x the rate of a blind application.`
                              : `Your alumni and school networks are the most under-used asset here. A direct message to a former colleague now working at a target company outperforms any cold application. Focus on the Opportunities tab — find the name, find the shared connection, send the message this week.`
                          )}
                        </div>
                      </div>
                    )}

                    {/* Geographic context */}
                    {(narrative?.geoStrategy || narrative?.localContext) && (
                      <div style={{ padding: "14px", background: "#0a0a1a", borderRadius: "10px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#a5b4fc", marginBottom: "8px" }}>📍 {geoLabel} — What the Local Market Means for You</div>
                        <div style={{ fontSize: "13px", color: "#8a8fb5", lineHeight: 1.8 }}>
                          {narrative.geoStrategy || narrative.localContext}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Path cards */}
              {(narrative.retrainingPaths || []).map((path, i) => {
                const medals = ["🥇", "🥈", "🥉", "🎲"];
                const badgeLabels = ["Primary Path", "Strong Alternative", "Tactical Bridge", "Long Shot"];
                const colors = ["#22c55e", "#a5b4fc", "#f59e0b", "#8a8fb5"];
                const c = colors[i] || "#8a8fb5";
                return (
                  <div key={i} style={{ background: "#0a0a1a", borderRadius: "14px", padding: "20px", marginBottom: "12px", border: `1px solid ${c}22` }}>
                    <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontSize: "16px" }}>{medals[i] || "📌"}</span>
                          <span style={{ fontSize: "15px", fontWeight: 800, color: c }}>{path.title}</span>
                          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", backgroundColor: `${c}18`, color: c, fontWeight: 700 }}>{badgeLabels[i] || "Option"}</span>
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

                    {/* Core rationale — should be specific to this person's role and situation */}
                    <div style={{ fontSize: "13px", color: "#c4c8e0", lineHeight: 1.85, marginBottom: "12px" }}>{path.rationale}</div>

                    {/* Why this works for this person specifically */}
                    {path.whyThisFits && (
                      <div style={{ padding: "12px", background: "#12122a", borderRadius: "8px", marginBottom: "12px", borderLeft: `3px solid ${c}` }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: c, marginBottom: "6px" }}>Why this fits {person.name?.split(" ")[0]}</div>
                        <div style={{ fontSize: "12px", color: "#8a8fb5", lineHeight: 1.7 }}>{path.whyThisFits}</div>
                      </div>
                    )}

                    {/* Concrete first steps */}
                    {(path.actionSteps || path.firstSteps) && (
                      <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>Concrete first steps:</div>
                        {(path.actionSteps || path.firstSteps).map((step, j) => (
                          <div key={j} style={{ display: "flex", gap: "10px", marginBottom: "6px", alignItems: "flex-start" }}>
                            <span style={{ fontSize: "11px", fontWeight: 800, color: c, minWidth: "20px", marginTop: "1px" }}>{j + 1}.</span>
                            <span style={{ fontSize: "12px", color: "#8a8fb5", lineHeight: 1.65 }}>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {(path.skills || []).map((s, j) => <Tag key={j} color={c}>{s}</Tag>)}
                    </div>

                    {/* Warm door tags */}
                    {path.warmDoors?.length > 0 && (
                      <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: "10px", color: "#4a4f7a" }}>Warm doors:</span>
                        {path.warmDoors.map((d, j) => <Tag key={j} color="#22c55e">{d}</Tag>)}
                      </div>
                    )}

                    {path.salaryComparison && (
                      <div style={{ marginTop: "10px", fontSize: "11px", color: "#4a4f7a" }}>💰 {path.salaryComparison}</div>
                    )}
                  </div>
                );
              })}

              {/* Bottom Line — prescriptive closing, not just summary */}
              {narrative.bottomLine && (
                <div style={{ padding: "22px", background: "linear-gradient(135deg, #1a1a3e 0%, #12122a 100%)", borderRadius: "14px", border: "1px solid #6366f133", marginTop: "8px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#a5b4fc", marginBottom: "12px" }}>💎 The Bottom Line</div>
                  <div style={{ fontSize: "14px", color: "#c4c8e0", lineHeight: 2.0 }}>{narrative.bottomLine}</div>
                  {narrative?.closingAction && (
                    <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #6366f122", fontSize: "13px", color: "#8a8fb5", lineHeight: 1.85 }}>
                      <strong style={{ color: "#a5b4fc" }}>This week: </strong>{narrative.closingAction}
                    </div>
                  )}
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
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        // Vercel returned non-JSON (timeout, crash, 502)
        const preview = text.slice(0, 120);
        if (res.status === 504 || preview.toLowerCase().includes("timeout") || preview.toLowerCase().includes("task timed out")) {
          setError("The assessment timed out. This can happen with complex profiles — try again.");
        } else {
          setError(`Server error (${res.status}): ${preview || "No response body"}`);
        }
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setReportData(data);
      }
    } catch (err) {
      setError(`Network error: ${err.message || "Unknown"}. Check your connection and try again.`);
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
