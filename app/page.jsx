"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TASKS, TASK_ORDER, VOCAB, ETYPE } from "./data";
import TaskChart from "./TaskChart";

const C = {
  ink: "#16203A", paper: "#FCFBF7", card: "#FFFFFF",
  coral: "#FF5A4D", coralDark: "#E2402F", slate: "#5B6478",
  line: "#E7E3D8", green: "#2E9E6B", amber: "#E8A33D", red: "#D9534F",
};
const HIST_KEY = "ielts:history";

function countWords(s) { const t = s.trim(); return t ? t.split(/\s+/).length : 0; }
function bandColor(b) { if (b >= 7) return C.green; if (b >= 6) return "#7BAE4A"; if (b >= 5) return C.amber; return C.red; }
function fmt(s) { return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }
const etype = (t) => ETYPE[t] || ETYPE.grammar;

function buildSegments(essay, errors) {
  const used = [];
  (errors || []).forEach((e, i) => {
    if (!e.text) return;
    let idx = essay.indexOf(e.text);
    if (idx < 0) idx = essay.toLowerCase().indexOf(e.text.toLowerCase());
    if (idx < 0) return;
    const end = idx + e.text.length;
    if (used.some((u) => idx < u.end && end > u.start)) return;
    used.push({ start: idx, end, i });
  });
  used.sort((a, b) => a.start - b.start);
  const segs = []; let cur = 0;
  used.forEach((u) => {
    if (u.start > cur) segs.push({ text: essay.slice(cur, u.start), e: null });
    segs.push({ text: essay.slice(u.start, u.end), e: u.i });
    cur = u.end;
  });
  if (cur < essay.length) segs.push({ text: essay.slice(cur), e: null });
  return segs;
}

function BandDial({ value }) {
  const r = 60, circ = 2 * Math.PI * r, frac = Math.max(0, Math.min(1, value / 9));
  return (
    <div style={{ position: "relative", width: 156, height: 156 }}>
      <svg width="156" height="156" viewBox="0 0 156 156">
        <circle cx="78" cy="78" r={r} fill="none" stroke={C.line} strokeWidth="10" />
        <circle cx="78" cy="78" r={r} fill="none" stroke={bandColor(value)} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)} transform="rotate(-90 78 78)"
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 900, fontSize: 48, lineHeight: 1, color: C.ink }}>{Number(value).toFixed(1)}</div>
        <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: C.slate, marginTop: 2 }}>Overall band</div>
      </div>
    </div>
  );
}

function Criterion({ label, band, note }) {
  return (
    <div style={{ padding: "11px 0", borderBottom: `1px solid ${C.line}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontWeight: 600, color: C.ink, fontSize: 14 }}>{label}</span>
        <span style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 19, color: bandColor(band) }}>{Number(band).toFixed(1)}</span>
      </div>
      <div style={{ height: 6, background: C.line, borderRadius: 999, marginTop: 7, overflow: "hidden" }}>
        <div style={{ width: `${(band / 9) * 100}%`, height: "100%", background: bandColor(band), borderRadius: 999, transition: "width 800ms ease" }} />
      </div>
      {note && <p style={{ fontSize: 12.5, color: C.slate, margin: "7px 0 0", lineHeight: 1.5 }}>{note}</p>}
    </div>
  );
}

function Trend({ data }) {
  if (data.length < 2) return null;
  const w = 220, h = 44, pad = 6;
  const xs = (i) => pad + (i * (w - 2 * pad)) / (data.length - 1);
  const ys = (v) => h - pad - ((Math.max(4, v) - 4) / 5) * (h - 2 * pad);
  const pts = data.map((v, i) => `${xs(i)},${ys(v)}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={C.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => <circle key={i} cx={xs(i)} cy={ys(v)} r="3" fill={C.coral} />)}
    </svg>
  );
}

export default function Home() {
  const [tab, setTab] = useState("write");
  const [lang, setLang] = useState("en");
  const [taskType, setTaskType] = useState("t2");
  const [qIndex, setQIndex] = useState(0);
  const [essay, setEssay] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(TASKS.t2.minutes * 60);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [activeErr, setActiveErr] = useState(-1);
  const [history, setHistory] = useState([]);
  const [vocabTopic, setVocabTopic] = useState("Environment");
  const [flipped, setFlipped] = useState(-1);
  const [expanded, setExpanded] = useState(-1);
  // model answer + improve
  const [modelLoading, setModelLoading] = useState(false);
  const [modelText, setModelText] = useState("");
  const [improveLoading, setImproveLoading] = useState(false);
  const [improved, setImproved] = useState(null);

  const t = (en, uz) => (lang === "uz" ? uz : en);
  const task = TASKS[taskType];
  const bank = task.questions;
  const q = bank[qIndex];
  const words = countWords(essay);
  const minW = task.minWords;

  useEffect(() => {
    try { const raw = localStorage.getItem(HIST_KEY); if (raw) setHistory(JSON.parse(raw)); } catch (e) {}
  }, []);
  useEffect(() => {
    if (!running) return;
    if (secondsLeft <= 0) { setRunning(false); return; }
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running, secondsLeft]);

  function persist(next) {
    setHistory(next);
    try { localStorage.setItem(HIST_KEY, JSON.stringify(next)); } catch (e) {}
  }
  function clearOutputs() { setResult(null); setError(""); setActiveErr(-1); setModelText(""); setImproved(null); }
  function switchTask(tt) {
    setTaskType(tt); setQIndex(0); setEssay(""); clearOutputs();
    setSecondsLeft(TASKS[tt].minutes * 60); setRunning(false);
  }
  function newQuestion() {
    let i = qIndex; while (i === qIndex && bank.length > 1) i = Math.floor(Math.random() * bank.length);
    setQIndex(i); clearOutputs();
  }

  async function api(payload) {
    const res = await fetch("/api/score", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskType, question: q.text, qType: q.type, lang, chartSummary: q.chart ? q.chart.summary : null, ...payload }),
    });
    return res.json();
  }

  async function evaluate() {
    if (words < 40) { setError(t("Write at least a few sentences first.", "Avval bir necha jumla yozing.")); return; }
    setLoading(true); setError(""); setResult(null); setActiveErr(-1); setImproved(null);
    try {
      const parsed = await api({ mode: "score", essay, words });
      if (parsed.error) { setError(parsed.error); setLoading(false); return; }
      parsed.scoredEssay = essay;
      setResult(parsed);
      const a = { id: Date.now(), date: new Date().toISOString(), taskType, taskLabel: task.label.en, qType: q.type, qText: q.text, essay, words, overall: parsed.overall, tr: parsed.tr.band, cc: parsed.cc.band, lr: parsed.lr.band, gra: parsed.gra.band };
      persist([a, ...history].slice(0, 50));
    } catch (e) { setError(t("Network error. Try again.", "Tarmoq xatosi. Qayta urinib ko'ring.")); }
    finally { setLoading(false); }
  }

  async function showModel() {
    setModelLoading(true); setModelText("");
    try { const r = await api({ mode: "model" }); setModelText(r.essay || r.error || ""); }
    catch (e) { setModelText(t("Network error.", "Tarmoq xatosi.")); }
    finally { setModelLoading(false); }
  }

  async function improveEssay() {
    if (words < 40) { setError(t("Write something first.", "Avval biror narsa yozing.")); return; }
    setImproveLoading(true); setImproved(null);
    try { const r = await api({ mode: "improve", essay, words, targetBand: 8 }); setImproved(r); }
    catch (e) { setImproved({ improved: "", changes: [t("Network error.", "Tarmoq xatosi.")] }); }
    finally { setImproveLoading(false); }
  }

  const segments = useMemo(() => (result ? buildSegments(result.scoredEssay, result.errors) : []), [result]);
  const TABS = [["write", t("Write", "Yozish")], ["vocab", t("Vocab", "Lug'at")], ["history", t("History", "Tarix")]];
  const firstLabel = task.first[lang];

  const btn = (extra = {}) => ({ cursor: "pointer", border: "none", fontWeight: 600, ...extra });

  return (
    <main style={{ minHeight: "100vh", padding: "0 0 48px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "30px 20px 0" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 14, height: 14, background: C.coral, borderRadius: 3, transform: "rotate(45deg)" }} />
              <span style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: C.slate, fontWeight: 600 }}>IELTS Writing Coach</span>
            </div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 900, fontSize: 32, margin: "8px 0 0", lineHeight: 1.05 }}>
              {t("Write, score, ", "Yoz, baho ol, ")}<span style={{ color: C.coral }}>{t("and learn from it", "va o'rgan")}</span>
            </h1>
          </div>
          <div style={{ display: "flex", background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: 3 }}>
            {[["en", "EN"], ["uz", "UZ"]].map(([k, l]) => (
              <button key={k} onClick={() => setLang(k)} style={btn({ padding: "7px 14px", borderRadius: 8, fontSize: 13, background: lang === k ? C.ink : "transparent", color: lang === k ? "#fff" : C.slate })}>{l}</button>
            ))}
          </div>
        </header>

        <div style={{ display: "flex", gap: 4, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 4, marginBottom: 14 }}>
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={btn({ flex: 1, padding: "10px", borderRadius: 9, fontSize: 14, background: tab === k ? C.ink : "transparent", color: tab === k ? "#fff" : C.slate })}>{l}</button>
          ))}
        </div>

        {tab === "write" && (
          <>
            {/* Task type selector */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              {TASK_ORDER.map((tt) => (
                <button key={tt} onClick={() => switchTask(tt)} style={btn({ padding: "8px 14px", borderRadius: 999, fontSize: 13, border: `1px solid ${taskType === tt ? C.coral : C.line}`, background: taskType === tt ? C.coral : C.card, color: taskType === tt ? "#fff" : C.ink })}>
                  {TASKS[tt].label[lang]}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 24, alignItems: "start" }} className="iw-grid">
              <section style={{ minWidth: 0 }}>
                <div style={{ background: C.ink, color: "#fff", borderRadius: 14, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.coral, fontWeight: 700, background: "rgba(255,90,77,.14)", padding: "4px 10px", borderRadius: 999 }}>{q.type}</span>
                    <button onClick={newQuestion} style={btn({ background: "rgba(255,255,255,.1)", color: "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 12 })}>↻ {t("New", "Yangi")}</button>
                  </div>
                  {q.chart && <div style={{ marginBottom: 14 }}><TaskChart spec={q.chart} /></div>}
                  <p style={{ fontFamily: "Fraunces, serif", fontSize: 17, lineHeight: 1.5, margin: 0 }}>{q.text}</p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 10px", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 20, color: secondsLeft < 300 ? C.coral : C.ink }}>{fmt(secondsLeft)}</span>
                  <button onClick={() => setRunning((r) => !r)} style={btn({ background: C.card, border: `1px solid ${C.line}`, color: C.ink, padding: "6px 12px", borderRadius: 8, fontSize: 12 })}>{running ? t("Pause", "Pauza") : t("Start", "Boshlash")}</button>
                  <button onClick={() => { setSecondsLeft(task.minutes * 60); setRunning(false); }} style={btn({ background: "transparent", color: C.slate, padding: "6px 4px", fontSize: 12 })}>{t("Reset", "Tiklash")}</button>
                  <span style={{ marginLeft: "auto", fontSize: 13, color: words >= minW ? C.green : C.slate, fontWeight: 600 }}>
                    {words} {t("words", "so'z")} {words >= minW ? "✓" : `· ${minW - words} ${t("to go", "qoldi")}`}
                  </span>
                </div>

                <textarea value={essay} onChange={(e) => setEssay(e.target.value)}
                  placeholder={t("Start writing here…", "Shu yerga yozishni boshlang…")}
                  style={{ width: "100%", minHeight: 300, padding: "8px 18px", border: `1px solid ${C.line}`, borderRadius: 12, fontSize: 16, lineHeight: "32px", color: C.ink, outline: "none", resize: "vertical", background: "repeating-linear-gradient(#FFF,#FFF 31px,#E7E3D8 31px,#E7E3D8 32px)" }} />

                <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <button onClick={evaluate} disabled={loading} style={btn({ background: loading ? C.coralDark : C.coral, color: "#fff", padding: "14px 26px", borderRadius: 12, fontSize: 15, opacity: loading ? .85 : 1 })}>
                    {loading ? t("Scoring…", "Baholanmoqda…") : t("Score my essay →", "Baholash →")}
                  </button>
                  <button onClick={improveEssay} disabled={improveLoading} style={btn({ background: C.card, border: `1px solid ${C.line}`, color: C.ink, padding: "13px 18px", borderRadius: 12, fontSize: 14 })}>
                    {improveLoading ? t("Improving…", "Yaxshilanmoqda…") : t("Improve my essay", "Essayni yaxshilash")}
                  </button>
                  <button onClick={showModel} disabled={modelLoading} style={btn({ background: "transparent", color: C.slate, padding: "13px 6px", fontSize: 13 })}>
                    {modelLoading ? t("Loading…", "Yuklanmoqda…") : t("Model answer", "Namuna javob")}
                  </button>
                  {essay && <button onClick={() => { setEssay(""); clearOutputs(); }} style={btn({ background: "transparent", color: C.slate, fontSize: 13 })}>{t("Clear", "Tozalash")}</button>}
                </div>
                {error && <p style={{ color: C.red, fontSize: 13, marginTop: 12 }}>{error}</p>}

                {/* Highlighted essay */}
                {result && result.errors && result.errors.length > 0 && (
                  <div style={{ marginTop: 20, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: C.slate, fontWeight: 600, marginBottom: 10 }}>{t("Your answer — tap a highlight", "Javobingiz — belgini bosing")}</div>
                    <p style={{ fontSize: 15.5, lineHeight: 1.9, margin: 0, whiteSpace: "pre-wrap", color: C.ink }}>
                      {segments.map((s, i) => s.e === null
                        ? <span key={i}>{s.text}</span>
                        : <span key={i} onClick={() => setActiveErr(s.e)} style={{ cursor: "pointer", borderRadius: 2, padding: "0 1px", borderBottom: `2px solid ${etype(result.errors[s.e].type).c}`, background: activeErr === s.e ? `${etype(result.errors[s.e].type).c}22` : "transparent" }}>{s.text}</span>)}
                    </p>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 14 }}>
                      {Object.keys(ETYPE).map((k) => (
                        <span key={k} style={{ fontSize: 11, color: C.slate, display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 18, height: 3, background: ETYPE[k].c, borderRadius: 2 }} />{ETYPE[k][lang]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improved essay */}
                {improved && (
                  <div style={{ marginTop: 16, background: C.card, border: `1px solid ${C.green}`, borderRadius: 14, padding: 18 }}>
                    <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 15, margin: "0 0 10px", color: C.green }}>↑ {t("Improved version (≈ band 8)", "Yaxshilangan variant (≈ band 8)")}</h3>
                    <p style={{ fontSize: 14.5, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", color: C.ink }}>{improved.improved}</p>
                    {improved.changes && improved.changes.length > 0 && (
                      <ul style={{ margin: "12px 0 0", paddingLeft: 18, fontSize: 12.5, color: C.slate, lineHeight: 1.6 }}>
                        {improved.changes.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    )}
                  </div>
                )}

                {/* Model answer */}
                {modelText && (
                  <div style={{ marginTop: 16, background: C.ink, color: "#fff", borderRadius: 14, padding: 18 }}>
                    <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 15, margin: "0 0 10px", color: C.coral }}>★ {t("Band-9 model answer", "Band-9 namuna javob")}</h3>
                    <p style={{ fontSize: 14.5, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{modelText}</p>
                  </div>
                )}
              </section>

              {/* Results column */}
              <section style={{ minWidth: 0 }}>
                {!result && !loading && (
                  <div style={{ background: C.card, border: `1px dashed ${C.line}`, borderRadius: 14, padding: 26, textAlign: "center", color: C.slate }}>
                    <div style={{ fontFamily: "Fraunces, serif", fontSize: 38, color: C.line, fontWeight: 900 }}>?.?</div>
                    <p style={{ fontSize: 14, margin: "8px 0 0", lineHeight: 1.5 }}>{t("Your band + highlighted corrections appear here.", "Band va belgilangan tuzatishlar shu yerda chiqadi.")}</p>
                  </div>
                )}
                {loading && (
                  <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 40, textAlign: "center" }}>
                    <div style={{ width: 38, height: 38, border: `4px solid ${C.line}`, borderTopColor: C.coral, borderRadius: "50%", margin: "0 auto", animation: "spin .8s linear infinite" }} />
                    <p style={{ color: C.slate, fontSize: 14, marginTop: 14 }}>{t("The examiner is reading…", "Examiner o'qiyapti…")}</p>
                  </div>
                )}
                {result && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
                      <BandDial value={result.overall} />
                      <div>
                        <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: C.slate, fontWeight: 600 }}>{t("Your result", "Natijangiz")}</div>
                        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 20, marginTop: 4 }}>
                          {result.overall >= 7 ? t("Strong", "Kuchli") : result.overall >= 6 ? t("Solid — keep pushing", "Yaxshi — davom et") : t("Keep practising", "Davom ettiring")}
                        </div>
                      </div>
                    </div>
                    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "6px 20px 14px" }}>
                      <Criterion label={firstLabel} band={result.tr.band} note={result.tr.note} />
                      <Criterion label={t("Coherence & Cohesion", "Bog'liqlik (CC)")} band={result.cc.band} note={result.cc.note} />
                      <Criterion label={t("Lexical Resource", "Lug'at (LR)")} band={result.lr.band} note={result.lr.note} />
                      <Criterion label={t("Grammar (GRA)", "Grammatika (GRA)")} band={result.gra.band} note={result.gra.note} />
                    </div>
                    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
                      <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 15, margin: "0 0 6px", color: C.green }}>✓ {t("What worked", "Yaxshi tomonlari")}</h3>
                      <ul style={{ margin: "0 0 14px", paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>{(result.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                      <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 15, margin: "0 0 6px", color: C.coral }}>→ {t("To improve", "Yaxshilash kerak")}</h3>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>{(result.improvements || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                    {result.errors && result.errors.length > 0 && (
                      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
                        <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 15, margin: "0 0 12px" }}>{t("Corrections", "Tuzatishlar")}</h3>
                        {result.errors.map((e, i) => (
                          <div key={i} onClick={() => setActiveErr(i)} style={{ marginBottom: 12, cursor: "pointer", padding: 10, borderRadius: 10, background: activeErr === i ? `${etype(e.type).c}11` : "transparent", border: `1px solid ${activeErr === i ? etype(e.type).c : "transparent"}` }}>
                            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: etype(e.type).c, fontWeight: 700 }}>{etype(e.type)[lang]}</span>
                            <div style={{ fontSize: 13, color: C.red, textDecoration: "line-through", opacity: .8, marginTop: 2 }}>{e.text}</div>
                            <div style={{ fontSize: 14, color: C.green, fontWeight: 600 }}>{e.fix}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          </>
        )}

        {tab === "vocab" && (
          <div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {Object.keys(VOCAB).map((topic) => (
                <button key={topic} onClick={() => { setVocabTopic(topic); setFlipped(-1); }} style={btn({ padding: "9px 16px", borderRadius: 999, fontSize: 13, border: `1px solid ${vocabTopic === topic ? C.coral : C.line}`, background: vocabTopic === topic ? C.coral : C.card, color: vocabTopic === topic ? "#fff" : C.ink })}>{topic}</button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
              {VOCAB[vocabTopic].map((v, i) => (
                <div key={i} onClick={() => setFlipped(flipped === i ? -1 : i)} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, cursor: "pointer", minHeight: 120 }}>
                  <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 18, color: C.ink }}>{v.word}</div>
                  <div style={{ fontSize: 12.5, color: C.slate, marginTop: 4 }}>{v.meaning}</div>
                  {flipped === i
                    ? <div style={{ fontSize: 13.5, color: C.green, marginTop: 12, lineHeight: 1.5, fontStyle: "italic" }}>“{v.ex}”</div>
                    : <div style={{ fontSize: 11, color: C.coral, marginTop: 12, fontWeight: 600 }}>{t("Tap for example", "Misol uchun bosing")}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "history" && (
          <div>
            {history.length === 0 && (
              <div style={{ background: C.card, border: `1px dashed ${C.line}`, borderRadius: 14, padding: 30, textAlign: "center", color: C.slate }}>
                <p style={{ fontSize: 14, margin: 0 }}>{t("No essays scored yet.", "Hali baholangan essay yo'q.")}</p>
              </div>
            )}
            {history.length >= 2 && (
              <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, marginBottom: 16 }}>
                <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: C.slate, fontWeight: 600, marginBottom: 10 }}>{t("Band trend (oldest → newest)", "Band o'zgarishi (eski → yangi)")}</div>
                <Trend data={[...history].reverse().map((h) => h.overall)} />
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {history.map((h) => (
                <div key={h.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, overflow: "hidden" }}>
                  <div onClick={() => setExpanded(expanded === h.id ? -1 : h.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, cursor: "pointer" }}>
                    <div style={{ width: 50, height: 50, borderRadius: 12, background: `${bandColor(h.overall)}1A`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: "Fraunces, serif", fontWeight: 900, fontSize: 20, color: bandColor(h.overall) }}>{Number(h.overall).toFixed(1)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{h.taskLabel || "Task 2"} · {h.qType} · {h.words} {t("words", "so'z")}</div>
                      <div style={{ fontSize: 12, color: C.slate }}>{new Date(h.date).toLocaleString()}</div>
                    </div>
                    <button onClick={(ev) => { ev.stopPropagation(); persist(history.filter((x) => x.id !== h.id)); }} style={btn({ background: "transparent", color: C.red, fontSize: 13 })}>✕</button>
                  </div>
                  {expanded === h.id && (
                    <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${C.line}` }}>
                      <div style={{ display: "flex", gap: 16, margin: "12px 0", fontSize: 12, color: C.slate }}>
                        <span>TR/TA {h.tr}</span><span>CC {h.cc}</span><span>LR {h.lr}</span><span>GRA {h.gra}</span>
                      </div>
                      <p style={{ fontSize: 13, color: C.ink, fontStyle: "italic", margin: "0 0 8px" }}>{h.qText}</p>
                      <p style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{h.essay}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", color: C.slate, fontSize: 11, marginTop: 32, opacity: .7 }}>
          {t("Scores are AI estimates. History is saved in this browser.", "Baholar AI taxminiy. Tarix shu brauzerda saqlanadi.")}
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @media (max-width:760px){.iw-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}
