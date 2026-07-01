"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { TASKS, TASK_ORDER, VOCAB, ETYPE } from "./data";
import TaskChart from "./TaskChart";
import Auth from "./Auth";
import Landing from "./Landing";
import { supabase, hasSupabase } from "./lib/supabase";

const THEMES = {
  light: { ink: "#16203A", paper: "#FCFBF7", card: "#FFFFFF", coral: "#FF5A4D", coralDark: "#E2402F", slate: "#5B6478", line: "#E7E3D8", green: "#2E9E6B", amber: "#E8A33D", red: "#D9534F", navy: "#16203A" },
  dark:  { ink: "#ECEAE3", paper: "#11141A", card: "#1B2030", coral: "#FF6F62", coralDark: "#E2402F", slate: "#9099B5", line: "#2B3145", green: "#3FBE85", amber: "#E8A33D", red: "#E2675F", navy: "#0E1326" },
};
const DRAFT_KEY = "ielts:draft", VOCAB_KEY = "ielts:myvocab", THEME_KEY = "ielts:theme", HIST_KEY = "ielts:history", TARGET_KEY = "ielts:target";

function countWords(s) { const t = s.trim(); return t ? t.split(/\s+/).length : 0; }
function bandColor(b, C) { if (b >= 7) return C.green; if (b >= 6) return "#7BAE4A"; if (b >= 5) return C.amber; return C.red; }
function fmt(s) { return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }
const etype = (t) => ETYPE[t] || ETYPE.grammar;
const btn = (extra = {}) => ({ cursor: "pointer", border: "none", fontWeight: 600, fontFamily: "inherit", ...extra });
const rowToItem = (r) => ({ id: r.id, date: r.created_at, taskType: r.task_type, taskLabel: r.task_label, qType: r.q_type, qText: r.q_text, essay: r.essay, words: r.words, overall: r.overall, tr: r.tr, cc: r.cc, lr: r.lr, gra: r.gra });
const rowToVocabItem = (r) => ({ id: r.id, word: r.word, date: r.created_at });
function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

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
  used.forEach((u) => { if (u.start > cur) segs.push({ text: essay.slice(cur, u.start), e: null }); segs.push({ text: essay.slice(u.start, u.end), e: u.i }); cur = u.end; });
  if (cur < essay.length) segs.push({ text: essay.slice(cur), e: null });
  return segs;
}

function MiniCrit({ label, band, C }) {
  return (<div style={{ textAlign: "center", flex: 1 }}><div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 18, color: bandColor(band, C) }}>{Number(band).toFixed(1)}</div><div style={{ fontSize: 10, color: C.slate, marginTop: 2 }}>{label}</div></div>);
}

function Trend({ data, C }) {
  if (data.length < 2) return null;
  const w = 240, h = 44, pad = 6;
  const xs = (i) => pad + (i * (w - 2 * pad)) / (data.length - 1);
  const ys = (v) => h - pad - ((Math.max(4, v) - 4) / 5) * (h - 2 * pad);
  const pts = data.map((v, i) => `${xs(i)},${ys(v)}`).join(" ");
  return (<svg width={w} height={h} style={{ display: "block", maxWidth: "100%" }}><polyline points={pts} fill="none" stroke={C.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 600, animation: "draw 1s ease both" }} />{data.map((v, i) => <circle key={i} cx={xs(i)} cy={ys(v)} r="3" fill={C.coral} />)}</svg>);
}

function ExplainCard({ data, lang, C }) {
  if (!data || data === "loading") return null;
  const L = (en, uz) => (lang === "uz" ? uz : en);
  return (
    <div style={{ fontSize: 13, color: C.slate, lineHeight: 1.55 }}>
      {data.pos && <span style={{ fontStyle: "italic", color: C.coral, fontWeight: 600 }}>{data.pos}</span>}
      {data.meaning && <div style={{ color: C.ink, marginTop: 2 }}>{data.meaning}</div>}
      {data.usage && <div style={{ marginTop: 4 }}><b style={{ color: C.ink }}>{L("Usage", "Ishlatilishi")}:</b> {data.usage}</div>}
      {(data.synonyms || []).length > 0 && <div style={{ marginTop: 4 }}>{L("Synonyms", "Sinonimlar")}: {data.synonyms.join(", ")}</div>}
      {(data.examples || []).map((ex, i) => <div key={i} style={{ fontStyle: "italic", color: C.green, marginTop: 4 }}>“{ex}”</div>)}
    </div>
  );
}

function Section({ title, count, open, onToggle, children, accent, delay, C }) {
  return (
    <div className="anim" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, marginBottom: 12, overflow: "hidden", animationDelay: `${delay || 0}ms` }}>
      <button onClick={onToggle} style={btn({ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "transparent", color: C.ink, fontSize: 15 })}>
        <span style={{ fontFamily: "Fraunces, serif", fontWeight: 700, color: accent || C.ink }}>{title}{count != null ? ` (${count})` : ""}</span>
        <span style={{ color: C.slate, fontSize: 20, lineHeight: 1 }}>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{ padding: "0 18px 18px" }}>{children}</div>}
    </div>
  );
}

export default function Home() {
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [tab, setTab] = useState("write");
  const [phase, setPhase] = useState("edit");
  const [lang, setLang] = useState("en");
  const [taskType, setTaskType] = useState("t2");
  const [qIndex, setQIndex] = useState(0);
  const [essay, setEssay] = useState("");
  const [targetBand, setTargetBand] = useState(7);
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
  const [modelLoading, setModelLoading] = useState(false);
  const [modelText, setModelText] = useState("");
  const [improveLoading, setImproveLoading] = useState(false);
  const [improved, setImproved] = useState(null);
  const [theme, setTheme] = useState("light");
  const [accessCode, setAccessCode] = useState("");
  const [showGate, setShowGate] = useState(false);
  const [gateInput, setGateInput] = useState("");
  const [trans, setTrans] = useState(null);
  const [transLoading, setTransLoading] = useState("");
  const [open, setOpen] = useState({ target: true, corrections: true, paragraphs: false, feedback: false, synonyms: false, improved: false, model: false });
  const [myVocab, setMyVocab] = useState([]);
  const [selBtn, setSelBtn] = useState(null);
  const [vMeaning, setVMeaning] = useState({});
  const [vq, setVq] = useState("");
  const [vRes, setVRes] = useState(null);
  const [vLoad, setVLoad] = useState(false);
  // flashcard practice
  const [pMode, setPMode] = useState(null); // null | "config" | "run" | "done"
  const [pSource, setPSource] = useState("both");
  const [pDeck, setPDeck] = useState([]);
  const [pIdx, setPIdx] = useState(0);
  const [pReveal, setPReveal] = useState(false);
  const [pKnown, setPKnown] = useState(0);
  const [pTotal, setPTotal] = useState(0);
  const [pMean, setPMean] = useState({});
  const [profile, setProfile] = useState(null);
  const [adminUsers, setAdminUsers] = useState(null);
  const restored = useRef(false);

  const C = THEMES[theme];
  const t = (en, uz) => (lang === "uz" ? uz : en);
  const task = TASKS[taskType];
  const bank = task.questions;
  const q = bank[qIndex];
  const words = countWords(essay);
  const minW = task.minWords;

  useEffect(() => {
    if (!hasSupabase) { setAuthChecked(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthChecked(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (hasSupabase) {
      if (!session) { setHistory([]); return; }
      supabase.from("history").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(50)
        .then(({ data, error }) => { if (!error && data) setHistory(data.map(rowToItem)); });
    } else {
      try { const raw = localStorage.getItem(HIST_KEY); if (raw) setHistory(JSON.parse(raw)); } catch (e) {}
    }
  }, [session]);

  useEffect(() => {
    if (hasSupabase) {
      if (!session) { setMyVocab([]); return; }
      supabase.from("vocab").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(200)
        .then(({ data, error }) => { if (!error && data) setMyVocab(data.map(rowToVocabItem)); });
    } else {
      try { const mv = localStorage.getItem(VOCAB_KEY); if (mv) setMyVocab(JSON.parse(mv)); } catch (e) {}
    }
  }, [session]);

  useEffect(() => {
    if (!hasSupabase || !session) { setProfile(null); return; }
    supabase.from("profiles").select("*").eq("user_id", session.user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [session]);

  useEffect(() => {
    try { const ac = localStorage.getItem("ielts:access"); if (ac) setAccessCode(ac); } catch (e) {}
    try { const th = localStorage.getItem(THEME_KEY); if (th === "dark" || th === "light") setTheme(th); } catch (e) {}
    try { const tg = localStorage.getItem(TARGET_KEY); if (tg) setTargetBand(Number(tg)); } catch (e) {}
    try { const d = localStorage.getItem(DRAFT_KEY); if (d) { const o = JSON.parse(d); if (o.taskType && TASKS[o.taskType]) { setTaskType(o.taskType); setQIndex(o.qIndex || 0); setEssay(o.essay || ""); setSecondsLeft(TASKS[o.taskType].minutes * 60); } } } catch (e) {}
    restored.current = true;
  }, []);
  useEffect(() => { if (!restored.current) return; try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ taskType, qIndex, essay })); } catch (e) {} }, [taskType, qIndex, essay]);
  useEffect(() => { try { localStorage.setItem(THEME_KEY, theme); } catch (e) {} }, [theme]);
  useEffect(() => { try { localStorage.setItem(TARGET_KEY, String(targetBand)); } catch (e) {} }, [targetBand]);
  useEffect(() => { if (!running) return; if (secondsLeft <= 0) { setRunning(false); return; } const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000); return () => clearInterval(id); }, [running, secondsLeft]);

  function persistVocab(next) { setMyVocab(next); try { localStorage.setItem(VOCAB_KEY, JSON.stringify(next)); } catch (e) {} }
  function clearOutputs() { setResult(null); setError(""); setActiveErr(-1); setModelText(""); setImproved(null); setTrans(null); }
  function switchTask(tt) { setTaskType(tt); setQIndex(0); setEssay(""); clearOutputs(); setSecondsLeft(TASKS[tt].minutes * 60); setRunning(false); setPhase("edit"); }
  function newQuestion() { let i = qIndex; while (i === qIndex && bank.length > 1) i = Math.floor(Math.random() * bank.length); setQIndex(i); setEssay(""); clearOutputs(); }
  async function logout() { setHistory([]); setMyVocab([]); setProfile(null); setAdminUsers(null); if (supabase) await supabase.auth.signOut(); }

  async function api(payload) {
    const res = await fetch("/api/score", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskType, question: q.text, qType: q.type, lang, chartSummary: q.chart ? q.chart.summary : null, password: accessCode, ...payload }) });
    return res.json();
  }

  async function saveAttempt(parsed) {
    const item = { id: Date.now(), date: new Date().toISOString(), taskType, taskLabel: task.label.en, qType: q.type, qText: q.text, essay, words, overall: parsed.overall, tr: parsed.tr.band, cc: parsed.cc.band, lr: parsed.lr.band, gra: parsed.gra.band };
    if (hasSupabase && session) {
      const row = { user_id: session.user.id, task_type: taskType, task_label: task.label.en, q_type: q.type, q_text: q.text, essay, words, overall: parsed.overall, tr: parsed.tr.band, cc: parsed.cc.band, lr: parsed.lr.band, gra: parsed.gra.band };
      const { data, error } = await supabase.from("history").insert(row).select().single();
      if (!error && data) setHistory((h) => [rowToItem(data), ...h].slice(0, 50));
      else setHistory((h) => [item, ...h].slice(0, 50));
    } else {
      const next = [item, ...history].slice(0, 50);
      setHistory(next); try { localStorage.setItem(HIST_KEY, JSON.stringify(next)); } catch (e) {}
    }
  }
  async function deleteAttempt(id) {
    if (hasSupabase && session) { await supabase.from("history").delete().eq("id", id); }
    setHistory((h) => { const next = h.filter((x) => x.id !== id); if (!hasSupabase) { try { localStorage.setItem(HIST_KEY, JSON.stringify(next)); } catch (e) {} } return next; });
  }

  async function evaluate() {
    if (words < 40) { setError(t("Write at least a few sentences first.", "Avval bir necha jumla yozing.")); return; }
    setLoading(true); setError(""); setResult(null); setActiveErr(-1); setImproved(null);
    try {
      const parsed = await api({ mode: "score", essay, words, targetBand });
      if (parsed.needPassword) { setShowGate(true); setLoading(false); return; }
      if (parsed.error) { setError(parsed.error); setLoading(false); return; }
      parsed.scoredEssay = essay; setResult(parsed); setPhase("review");
      setOpen({ target: true, corrections: true, paragraphs: false, feedback: false, synonyms: false, improved: false, model: false });
      await saveAttempt(parsed);
    } catch (e) { setError(t("Network error. Try again.", "Tarmoq xatosi. Qayta urinib ko'ring.")); }
    finally { setLoading(false); }
  }
  async function showModel() { setModelLoading(true); setModelText(""); try { const r = await api({ mode: "model" }); if (r.needPassword) { setShowGate(true); setModelLoading(false); return; } setModelText(r.essay || r.error || ""); } catch (e) { setModelText(t("Network error.", "Tarmoq xatosi.")); } finally { setModelLoading(false); } }
  async function improveEssay() { const src = result ? result.scoredEssay : essay; if (countWords(src) < 40) { setError(t("Write something first.", "Avval biror narsa yozing.")); return; } setImproveLoading(true); setImproved(null); try { const r = await api({ mode: "improve", essay: src, words: countWords(src), targetBand }); if (r.needPassword) { setShowGate(true); setImproveLoading(false); return; } setImproved(r); } catch (e) { setImproved({ improved: "", changes: [t("Network error.", "Tarmoq xatosi.")] }); } finally { setImproveLoading(false); } }
  async function translate(target) { if (trans && trans.lang === target) { setTrans(null); return; } setTransLoading(target); try { const r = await api({ mode: "translate", target }); if (r.needPassword) { setShowGate(true); setTransLoading(""); return; } setTrans({ lang: target, text: r.text }); } catch (e) { setTrans({ lang: target, text: t("Translation failed.", "Tarjima xatosi.") }); } finally { setTransLoading(""); } }
  function saveGate() { setAccessCode(gateInput); try { localStorage.setItem("ielts:access", gateInput); } catch (e) {} setShowGate(false); setError(""); }

  async function addVocab(word) {
    const w = (word || "").trim();
    setSelBtn(null);
    try { window.getSelection().removeAllRanges(); } catch (e) {}
    if (!w || w.length > 60 || myVocab.some((x) => x.word.toLowerCase() === w.toLowerCase())) return;
    if (hasSupabase && session) {
      const { data, error } = await supabase.from("vocab").insert({ user_id: session.user.id, word: w }).select().single();
      if (!error && data) setMyVocab((v) => [rowToVocabItem(data), ...v].slice(0, 200));
      else if (error && error.code !== "23505") setMyVocab((v) => [{ word: w, date: Date.now() }, ...v].slice(0, 200));
    } else {
      persistVocab([{ word: w, date: Date.now() }, ...myVocab].slice(0, 200));
    }
  }
  async function deleteVocab(item, index) {
    if (hasSupabase && session && item.id) { await supabase.from("vocab").delete().eq("id", item.id); }
    setMyVocab((v) => { const next = v.filter((_, j) => j !== index); if (!hasSupabase) { try { localStorage.setItem(VOCAB_KEY, JSON.stringify(next)); } catch (e) {} } return next; });
  }
  function handleSelect(e) { try { const sel = window.getSelection(); const text = sel ? sel.toString().trim() : ""; const inSel = e.target.closest && e.target.closest(".sel"); if (text && text.length > 1 && text.length < 60 && inSel) { const rect = sel.getRangeAt(0).getBoundingClientRect(); setSelBtn({ text, x: rect.left + rect.width / 2, y: rect.top }); } else setSelBtn(null); } catch (err) { setSelBtn(null); } }
  async function explainWord(w) { if (vMeaning[w] && vMeaning[w] !== "loading") { setVMeaning((m) => ({ ...m, [w]: null })); return; } setVMeaning((m) => ({ ...m, [w]: "loading" })); try { const r = await api({ mode: "explain", word: w }); setVMeaning((m) => ({ ...m, [w]: r })); } catch (e) { setVMeaning((m) => ({ ...m, [w]: { meaning: t("Failed.", "Xatolik."), examples: [] } })); } }
  async function searchVocab() { const w = vq.trim(); if (!w) return; setVLoad(true); setVRes(null); try { const r = await api({ mode: "explain", word: w }); if (r.needPassword) { setShowGate(true); setVLoad(false); return; } setVRes({ word: w, data: r }); } catch (e) { setVRes({ word: w, data: { meaning: t("Failed.", "Xatolik."), examples: [] } }); } finally { setVLoad(false); } }

  // ---- flashcard practice ----
  function startPractice(source) {
    let pool = [];
    if (source !== "topics") pool = pool.concat(myVocab.map((v) => ({ word: v.word, meaning: null })));
    if (source !== "mine") Object.values(VOCAB).forEach((arr) => arr.forEach((v) => pool.push({ word: v.word, meaning: v.meaning })));
    const seen = new Set();
    pool = pool.filter((c) => { const k = c.word.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
    pool = shuffle(pool).slice(0, 20).map((c) => ({ ...c, dir: Math.random() < 0.5 ? "w2m" : "m2w" }));
    if (pool.length === 0) return;
    setPDeck(pool); setPTotal(pool.length); setPIdx(0); setPReveal(false); setPKnown(0); setPMode("run");
  }
  async function fetchMeaning(word) {
    if (pMean[word]) return;
    setPMean((m) => ({ ...m, [word]: "loading" }));
    try { const r = await api({ mode: "explain", word }); setPMean((m) => ({ ...m, [word]: (r && r.meaning) || "—" })); }
    catch (e) { setPMean((m) => ({ ...m, [word]: "—" })); }
  }
  function gradeCard(known) {
    let deck = pDeck;
    if (known) setPKnown((k) => k + 1);
    else deck = [...pDeck, pDeck[pIdx]];
    if (!known) setPDeck(deck);
    if (pIdx + 1 >= deck.length) setPMode("done");
    else { setPIdx((i) => i + 1); setPReveal(false); }
  }

  useEffect(() => {
    if (pMode !== "run") return;
    const c = pDeck[pIdx];
    if (c && !c.meaning && !pMean[c.word]) fetchMeaning(c.word);
  }, [pMode, pIdx]);

  const segments = useMemo(() => (result ? buildSegments(result.scoredEssay, result.errors) : []), [result]);
  const isAdmin = !!(profile && profile.is_admin);
  const TABS = [["write", t("Write", "Yozish")], ["vocab", t("Vocab", "Lug'at")], ["history", t("History", "Tarix")]];
  if (isAdmin) TABS.push(["admin", t("Admin", "Admin")]);
  async function loadAdmin() {
    if (!isAdmin || !supabase) return;
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setAdminUsers(data || []);
  }
  useEffect(() => { if (tab === "admin" && isAdmin && adminUsers === null) loadAdmin(); }, [tab, isAdmin]);
  const firstLabel = task.first[lang];
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const BANDS = [5.5, 6, 6.5, 7, 7.5, 8];

  if (!authChecked) return <main style={{ minHeight: "100vh", background: C.paper, color: C.slate, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>…</main>;
  if (hasSupabase && !session) {
    return showAuth
      ? <Auth C={C} lang={lang} onLang={setLang} initialMode={authMode} onBack={() => setShowAuth(false)} />
      : <Landing C={C} lang={lang} onLang={setLang} onStart={(m) => { setAuthMode(m || "login"); setShowAuth(true); }} />;
  }

  return (
    <main onMouseUp={handleSelect} style={{ minHeight: "100vh", padding: "0 0 56px", background: C.paper, color: C.ink, transition: "background .25s ease, color .25s ease" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes pop{from{opacity:0;transform:translateX(-50%) scale(.85)}to{opacity:1;transform:translateX(-50%) scale(1)}}
        @keyframes draw{from{stroke-dashoffset:600}to{stroke-dashoffset:0}}
        .anim{animation:fadeUp .45s ease both}
        textarea:focus,input:focus{box-shadow:0 0 0 3px rgba(255,90,77,.16)}
        @media (max-width:480px){
          .wrap{padding:20px 12px 0 !important}
          .qcard{padding:14px !important}
          .brand{font-size:18px !important}
          .review-band{flex-direction:column;align-items:stretch !important}
          .review-band .edit-btn{width:100%}
        }
      `}</style>

      {showGate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(20,30,55,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }}>
          <div className="anim" style={{ background: C.card, borderRadius: 16, padding: 26, width: 340, maxWidth: "100%" }}>
            <h3 style={{ margin: "0 0 6px", fontFamily: "Fraunces, serif", fontSize: 20, color: C.ink }}>{t("Enter access code", "Kirish kodini kiriting")}</h3>
            <p style={{ fontSize: 13, color: C.slate, margin: "0 0 14px", lineHeight: 1.5 }}>{t("This app is protected to prevent misuse.", "Bu app suiiste'molni oldini olish uchun himoyalangan.")}</p>
            <input value={gateInput} onChange={(e) => setGateInput(e.target.value)} type="password" placeholder="••••••••" onKeyDown={(e) => { if (e.key === "Enter") saveGate(); }} style={{ width: "100%", padding: "11px 13px", border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 15, outline: "none", color: C.ink, background: C.card }} />
            <button onClick={saveGate} style={btn({ marginTop: 12, width: "100%", background: C.coral, color: "#fff", padding: "12px", borderRadius: 10, fontSize: 14 })}>{t("Save & continue", "Saqlash va davom etish")}</button>
          </div>
        </div>
      )}

      {selBtn && (<button onMouseDown={(e) => { e.preventDefault(); addVocab(selBtn.text); }} style={btn({ position: "fixed", left: selBtn.x, top: selBtn.y - 42, transform: "translateX(-50%)", zIndex: 55, background: C.navy, color: "#fff", padding: "7px 12px", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 14px rgba(0,0,0,.2)", whiteSpace: "nowrap", animation: "pop .15s ease both" })}>＋ {t("Add to my vocab", "Lug'atimga qo'shish")}</button>)}

      <div className="wrap" style={{ maxWidth: 760, margin: "0 auto", padding: "28px 18px 0" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 14, height: 14, background: C.coral, borderRadius: 3, transform: "rotate(45deg)" }} />
            <span className="brand" style={{ fontFamily: "Fraunces, serif", fontWeight: 900, fontSize: 22, color: C.ink }}>IELTS Writing Coach</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: 3 }}>
              {[["en", "EN"], ["uz", "UZ"]].map(([k, l]) => (<button key={k} onClick={() => setLang(k)} style={btn({ padding: "6px 13px", borderRadius: 8, fontSize: 13, background: lang === k ? C.navy : "transparent", color: lang === k ? "#fff" : C.slate })}>{l}</button>))}
            </div>
            <div style={{ display: "flex", background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: 3 }}>
              <button onClick={() => setTheme("light")} style={btn({ padding: "6px 11px", borderRadius: 8, fontSize: 13, background: theme === "light" ? C.navy : "transparent", color: theme === "light" ? "#fff" : C.slate })}>☀</button>
              <button onClick={() => setTheme("dark")} style={btn({ padding: "6px 11px", borderRadius: 8, fontSize: 13, background: theme === "dark" ? C.navy : "transparent", color: theme === "dark" ? "#fff" : C.slate })}>☾</button>
            </div>
            {hasSupabase && session && (<button onClick={logout} title={session.user.email} style={btn({ padding: "6px 12px", borderRadius: 8, fontSize: 12, background: C.card, border: `1px solid ${C.line}`, color: C.slate })}>{t("Log out", "Chiqish")}</button>)}
          </div>
        </header>

        <div style={{ display: "flex", gap: 4, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 4, marginBottom: 18 }}>
          {TABS.map(([k, l]) => (<button key={k} onClick={() => setTab(k)} style={btn({ flex: 1, padding: "10px", borderRadius: 9, fontSize: 14, background: tab === k ? C.navy : "transparent", color: tab === k ? "#fff" : C.slate })}>{l}</button>))}
        </div>

        {tab === "write" && phase === "edit" && (
          <div className="anim">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
              {TASK_ORDER.map((tt) => (<button key={tt} onClick={() => switchTask(tt)} style={btn({ padding: "8px 14px", borderRadius: 999, fontSize: 13, border: `1px solid ${taskType === tt ? C.coral : C.line}`, background: taskType === tt ? C.coral : C.card, color: taskType === tt ? "#fff" : C.ink })}>{TASKS[tt].label[lang]}</button>))}
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: C.slate }}>🎯 {t("Target", "Maqsad")}</span>
                <select value={targetBand} onChange={(e) => setTargetBand(Number(e.target.value))} style={{ padding: "6px 8px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: 13, fontFamily: "inherit", cursor: "pointer", outline: "none" }}>
                  {BANDS.map((b) => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="qcard" style={{ background: C.navy, color: "#fff", borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.coral, fontWeight: 700, background: "rgba(255,90,77,.14)", padding: "4px 10px", borderRadius: 999 }}>{q.type}</span>
                <button onClick={newQuestion} style={btn({ background: "rgba(255,255,255,.1)", color: "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 12 })}>↻ {t("New question", "Yangi savol")}</button>
              </div>
              {q.chart && <div style={{ marginBottom: 12 }}><TaskChart spec={q.chart} dark={theme === "dark"} /></div>}
              <p style={{ fontFamily: "Fraunces, serif", fontSize: 16.5, lineHeight: 1.5, margin: 0 }}>{q.text}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.55)" }}>{t("Translate:", "Tarjima:")}</span>
                <button onClick={() => translate("uz")} style={btn({ background: trans && trans.lang === "uz" ? C.coral : "rgba(255,255,255,.12)", color: "#fff", padding: "5px 11px", borderRadius: 7, fontSize: 12 })}>{transLoading === "uz" ? "…" : "O'zbekcha"}</button>
                <button onClick={() => translate("ru")} style={btn({ background: trans && trans.lang === "ru" ? C.coral : "rgba(255,255,255,.12)", color: "#fff", padding: "5px 11px", borderRadius: 7, fontSize: 12 })}>{transLoading === "ru" ? "…" : "Русский"}</button>
              </div>
              {trans && <p className="anim" style={{ fontSize: 14, lineHeight: 1.55, margin: "12px 0 0", padding: "10px 12px", background: "rgba(255,255,255,.08)", borderRadius: 8, color: "rgba(255,255,255,.92)" }}>{trans.text}</p>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 10px", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 20, color: secondsLeft < 300 ? C.coral : C.ink }}>{fmt(secondsLeft)}</span>
              <button onClick={() => setRunning((r) => !r)} style={btn({ background: C.card, border: `1px solid ${C.line}`, color: C.ink, padding: "6px 12px", borderRadius: 8, fontSize: 12 })}>{running ? t("Pause", "Pauza") : t("Start", "Boshlash")}</button>
              <button onClick={() => { setSecondsLeft(task.minutes * 60); setRunning(false); }} style={btn({ background: "transparent", color: C.slate, padding: "6px 4px", fontSize: 12 })}>{t("Reset", "Tiklash")}</button>
              <span style={{ marginLeft: "auto", fontSize: 13, color: words >= minW ? C.green : C.slate, fontWeight: 600 }}>{words} {t("words", "so'z")} {words >= minW ? "✓" : `· ${minW - words}`}</span>
            </div>
            <textarea value={essay} onChange={(e) => setEssay(e.target.value)} placeholder={t("Start writing here…", "Shu yerga yozishni boshlang…")} style={{ width: "100%", minHeight: 300, padding: "8px 18px", border: `1px solid ${C.line}`, borderRadius: 12, fontSize: 16, lineHeight: "32px", color: C.ink, outline: "none", resize: "vertical", background: `repeating-linear-gradient(${C.card},${C.card} 31px,${C.line} 31px,${C.line} 32px)` }} />
            <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={evaluate} disabled={loading} style={btn({ background: loading ? C.coralDark : C.coral, color: "#fff", padding: "14px 26px", borderRadius: 12, fontSize: 15, opacity: loading ? .85 : 1 })}>{loading ? t("Scoring…", "Baholanmoqda…") : t("Score my essay →", "Baholash →")}</button>
              {result && <button onClick={() => setPhase("review")} style={btn({ background: C.card, border: `1px solid ${C.line}`, color: C.ink, padding: "12px 16px", borderRadius: 10, fontSize: 13 })}>{t("View my result →", "Natijamni ko'rish →")}</button>}
              <button onClick={showModel} disabled={modelLoading} style={btn({ background: "transparent", color: C.slate, padding: "13px 6px", fontSize: 13 })}>{modelLoading ? "…" : t("Model answer", "Namuna javob")}</button>
              {essay && <button onClick={() => { setEssay(""); clearOutputs(); }} style={btn({ background: "transparent", color: C.slate, fontSize: 13, marginLeft: "auto" })}>{t("Clear", "Tozalash")}</button>}
            </div>
            {error && <p style={{ color: C.red, fontSize: 13, marginTop: 12 }}>{error}</p>}
            {modelText && (<div className="sel anim" style={{ marginTop: 16, background: C.navy, color: "#fff", borderRadius: 14, padding: 18 }}><h3 style={{ fontFamily: "Fraunces, serif", fontSize: 15, margin: "0 0 10px", color: C.coral }}>★ {t("Band-9 model answer", "Band-9 namuna javob")}</h3><p style={{ fontSize: 14.5, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{modelText}</p><p style={{ fontSize: 11, color: "rgba(255,255,255,.5)", margin: "10px 0 0" }}>{t("Tip: select any phrase to add it to your vocab.", "Maslahat: istalgan iborani belgilab lug'atingizga qo'shing.")}</p></div>)}
          </div>
        )}

        {tab === "write" && phase === "review" && result && (
          <>
            <div className="anim" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 18px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: `${bandColor(result.overall, C)}1A`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}><span style={{ fontFamily: "Fraunces, serif", fontWeight: 900, fontSize: 26, color: bandColor(result.overall, C), lineHeight: 1 }}>{Number(result.overall).toFixed(1)}</span><span style={{ fontSize: 8, color: C.slate, textTransform: "uppercase", letterSpacing: 1 }}>band</span></div>
                <div style={{ display: "flex", flex: 1, minWidth: 200, gap: 6 }}><MiniCrit label={taskType.startsWith("t1") ? "TA" : "TR"} band={result.tr.band} C={C} /><MiniCrit label="CC" band={result.cc.band} C={C} /><MiniCrit label="LR" band={result.lr.band} C={C} /><MiniCrit label="GRA" band={result.gra.band} C={C} /></div>
                <button onClick={() => setPhase("edit")} style={btn({ background: C.navy, color: "#fff", padding: "9px 16px", borderRadius: 10, fontSize: 13 })}>← {t("Edit", "Tahrir")}</button>
              </div>
            </div>

            {result.toTarget && (
              <div className="anim" style={{ background: `${C.coral}10`, border: `1px solid ${C.coral}`, borderRadius: 14, padding: "14px 18px", marginBottom: 12 }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: C.coral, fontWeight: 700, marginBottom: 4 }}>🎯 {t(`To reach band ${Number(targetBand).toFixed(1)}`, `Band ${Number(targetBand).toFixed(1)} uchun`)}</div>
                <p style={{ fontSize: 14, color: C.ink, margin: 0, lineHeight: 1.55 }}>{result.toTarget}</p>
              </div>
            )}

            <Section title={t("Corrections", "Tuzatishlar")} count={(result.errors || []).length} open={open.corrections} onToggle={() => toggle("corrections")} delay={40} C={C}>
              <div className="sel"><p style={{ fontSize: 15.5, lineHeight: 1.9, margin: "0 0 14px", whiteSpace: "pre-wrap", color: C.ink }}>{segments.map((s, i) => s.e === null ? <span key={i}>{s.text}</span> : <span key={i} onClick={() => setActiveErr(s.e)} style={{ cursor: "pointer", borderRadius: 2, padding: "0 1px", borderBottom: `2px solid ${etype(result.errors[s.e].type).c}`, background: activeErr === s.e ? `${etype(result.errors[s.e].type).c}22` : "transparent" }}>{s.text}</span>)}</p></div>
              {(result.errors || []).map((e, i) => (<div key={i} onClick={() => setActiveErr(i)} style={{ marginBottom: 10, cursor: "pointer", padding: 12, borderRadius: 10, background: activeErr === i ? `${etype(e.type).c}11` : "transparent", border: `1px solid ${activeErr === i ? etype(e.type).c : C.line}` }}><span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: etype(e.type).c, fontWeight: 700 }}>{etype(e.type)[lang]}</span><div style={{ fontSize: 13, color: C.red, textDecoration: "line-through", opacity: .8, marginTop: 2 }}>{e.text}</div><div style={{ fontSize: 14, color: C.green, fontWeight: 600 }}>{e.fix}</div>{e.rule && <div style={{ fontSize: 12, color: C.slate, marginTop: 5, paddingTop: 5, borderTop: `1px dashed ${C.line}` }}>💡 {e.rule}</div>}</div>))}
            </Section>

            {result.paragraphs && result.paragraphs.length > 0 && (
              <Section title={t("Paragraph feedback", "Abzatslar bo'yicha")} count={result.paragraphs.length} open={open.paragraphs} onToggle={() => toggle("paragraphs")} accent={C.green} delay={70} C={C}>
                {result.paragraphs.map((p, i) => (
                  <div key={i} style={{ marginBottom: 12, paddingLeft: 12, borderLeft: `3px solid ${C.green}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: .5 }}>{p.label}</div>
                    <div style={{ fontSize: 13.5, color: C.ink, marginTop: 2, lineHeight: 1.5 }}>{p.note}</div>
                  </div>
                ))}
              </Section>
            )}

            <Section title={t("Feedback", "Fikr-mulohaza")} open={open.feedback} onToggle={() => toggle("feedback")} delay={100} C={C}>
              <h4 style={{ fontFamily: "Fraunces, serif", fontSize: 14, margin: "0 0 6px", color: C.green }}>✓ {t("What worked", "Yaxshi tomonlari")}</h4>
              <ul style={{ margin: "0 0 14px", paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>{(result.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
              <h4 style={{ fontFamily: "Fraunces, serif", fontSize: 14, margin: "0 0 6px", color: C.coral }}>→ {t("To improve", "Yaxshilash kerak")}</h4>
              <ul style={{ margin: "0 0 14px", paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>{(result.improvements || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
              <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 10, fontSize: 12.5, color: C.slate, lineHeight: 1.6 }}><div><b style={{ color: C.ink }}>{firstLabel}:</b> {result.tr.note}</div><div><b style={{ color: C.ink }}>CC:</b> {result.cc.note}</div><div><b style={{ color: C.ink }}>LR:</b> {result.lr.note}</div><div><b style={{ color: C.ink }}>GRA:</b> {result.gra.note}</div></div>
            </Section>
            {result.synonyms && result.synonyms.length > 0 && (
              <Section title={t("Word variety", "So'z xilma-xilligi")} count={result.synonyms.length} open={open.synonyms} onToggle={() => toggle("synonyms")} accent={C.coral} delay={130} C={C}>
                <p style={{ fontSize: 12.5, color: C.slate, margin: "0 0 12px" }}>{t("Basic or repeated words — try these stronger alternatives:", "Oddiy yoki takror so'zlar — kuchliroq variantlar:")}</p>
                {result.synonyms.map((s, i) => (<div key={i} style={{ marginBottom: 12 }}><span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{s.word}</span><span style={{ color: C.slate }}> → </span>{(s.alts || []).map((a, j) => <span key={j} style={{ display: "inline-block", fontSize: 13, color: C.green, fontWeight: 600, background: `${C.green}12`, padding: "3px 9px", borderRadius: 999, margin: "0 6px 6px 0" }}>{a}</span>)}</div>))}
              </Section>
            )}
            <Section title={t("Improved version", "Yaxshilangan variant")} open={open.improved} onToggle={() => toggle("improved")} accent={C.green} delay={160} C={C}>
              {!improved && <button onClick={improveEssay} disabled={improveLoading} style={btn({ background: C.green, color: "#fff", padding: "11px 18px", borderRadius: 10, fontSize: 14 })}>{improveLoading ? t("Rewriting…", "Qayta yozilmoqda…") : t(`Rewrite at band ${Number(targetBand).toFixed(1)} →`, `Band ${Number(targetBand).toFixed(1)} darajada qayta yozish →`)}</button>}
              {improved && (<div className="sel"><p style={{ fontSize: 14.5, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", color: C.ink }}>{improved.improved}</p>{improved.changes && improved.changes.length > 0 && <ul style={{ margin: "12px 0 0", paddingLeft: 18, fontSize: 12.5, color: C.slate, lineHeight: 1.6 }}>{improved.changes.map((c, i) => <li key={i}>{c}</li>)}</ul>}</div>)}
            </Section>
            <Section title={t("Model answer", "Namuna javob")} open={open.model} onToggle={() => toggle("model")} accent={C.coral} delay={200} C={C}>
              {!modelText && <button onClick={showModel} disabled={modelLoading} style={btn({ background: C.navy, color: "#fff", padding: "11px 18px", borderRadius: 10, fontSize: 14 })}>{modelLoading ? t("Loading…", "Yuklanmoqda…") : t("Show band-9 answer →", "Band-9 namuna →")}</button>}
              {modelText && <div className="sel"><p style={{ fontSize: 14.5, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", color: C.ink }}>{modelText}</p></div>}
            </Section>
            <p style={{ textAlign: "center", fontSize: 12, color: C.slate, marginTop: 8 }}>{t("Tip: select any text above to add it to your vocab.", "Maslahat: yuqoridagi istalgan matnni belgilab lug'atingizga qo'shing.")}</p>
          </>
        )}

        {tab === "vocab" && pMode === "config" && (
          <div className="anim" style={{ maxWidth: 460, margin: "20px auto" }}>
            <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: C.ink, textAlign: "center", margin: "0 0 4px" }}>🎴 {t("Flashcards", "Kartochka mashqi")}</h3>
            <p style={{ textAlign: "center", color: C.slate, fontSize: 13, margin: "0 0 18px" }}>{t("Choose which words to practise", "Qaysi so'zlarni mashq qilamiz")}</p>
            {[["mine", t("My vocab only", "Faqat mening lug'atim"), myVocab.length], ["topics", t("Topic words", "Mavzuli so'zlar"), Object.values(VOCAB).reduce((n, a) => n + a.length, 0)], ["both", t("Both mixed", "Ikkalasi aralash"), null]].map(([k, l, n]) => (
              <button key={k} onClick={() => setPSource(k)} style={btn({ width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: 12, marginBottom: 10, border: `1px solid ${pSource === k ? C.coral : C.line}`, background: pSource === k ? `${C.coral}10` : C.card, color: C.ink, fontSize: 14, display: "flex", justifyContent: "space-between" })}><span>{l}</span>{n != null && <span style={{ color: C.slate, fontSize: 13 }}>{n}</span>}</button>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => setPMode(null)} style={btn({ flex: 1, padding: "12px", borderRadius: 10, background: C.card, border: `1px solid ${C.line}`, color: C.slate, fontSize: 14 })}>{t("Cancel", "Bekor")}</button>
              <button onClick={() => startPractice(pSource)} style={btn({ flex: 2, padding: "12px", borderRadius: 10, background: C.coral, color: "#fff", fontSize: 14 })}>{t("Start →", "Boshlash →")}</button>
            </div>
            {pSource !== "topics" && myVocab.length === 0 && <p style={{ textAlign: "center", color: C.amber, fontSize: 12, marginTop: 12 }}>{t("Your vocab is empty — add words or pick Topic words.", "Lug'atingiz bo'sh — so'z qo'shing yoki mavzuli so'zlarni tanlang.")}</p>}
          </div>
        )}

        {tab === "vocab" && pMode === "run" && pDeck[pIdx] && (() => {
          const card = pDeck[pIdx];
          const isW2M = card.dir === "w2m";
          const meaning = card.meaning || pMean[card.word];
          const mLoading = meaning === "loading" || meaning === undefined;
          const front = isW2M ? card.word : (mLoading ? "…" : meaning);
          const back = isW2M ? (mLoading ? "…" : meaning) : card.word;
          const frontLabel = isW2M ? t("Word", "So'z") : t("Meaning", "Ma'no");
          const backLabel = isW2M ? t("Meaning", "Ma'no") : t("Word", "So'z");
          return (
            <div className="anim" style={{ maxWidth: 460, margin: "12px auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <button onClick={() => setPMode(null)} style={btn({ background: "transparent", color: C.slate, fontSize: 13 })}>✕ {t("Quit", "Chiqish")}</button>
                <span style={{ fontSize: 13, color: C.slate, fontWeight: 600 }}>{pIdx + 1} / {pDeck.length}</span>
                <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>✓ {pKnown}</span>
              </div>
              <div style={{ height: 4, background: C.line, borderRadius: 999, marginBottom: 18, overflow: "hidden" }}><div style={{ height: "100%", width: `${(pIdx / pDeck.length) * 100}%`, background: C.coral, transition: "width .3s" }} /></div>

              <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: "36px 24px", minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: C.coral, fontWeight: 700, marginBottom: 12 }}>{frontLabel}</span>
                <span style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: front.length > 22 ? 18 : 24, color: C.ink, lineHeight: 1.35 }}>{front}</span>
                {pReveal && (
                  <div className="anim" style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${C.line}`, width: "100%" }}>
                    <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: C.green, fontWeight: 700 }}>{backLabel}</span>
                    <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: back.length > 22 ? 17 : 22, color: C.ink, marginTop: 8, lineHeight: 1.35 }}>{back}</div>
                  </div>
                )}
              </div>

              {!pReveal ? (
                <button onClick={() => { if (!isW2M && mLoading) return; setPReveal(true); if (card.meaning == null) fetchMeaning(card.word); }} style={btn({ width: "100%", marginTop: 16, padding: "14px", borderRadius: 12, background: C.navy, color: "#fff", fontSize: 15 })}>{t("Show answer", "Javobni ko'rsat")}</button>
              ) : (
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button onClick={() => gradeCard(false)} style={btn({ flex: 1, padding: "14px", borderRadius: 12, background: C.card, border: `1px solid ${C.line}`, color: C.slate, fontSize: 14 })}>↻ {t("Again", "Yana")}</button>
                  <button onClick={() => gradeCard(true)} style={btn({ flex: 1, padding: "14px", borderRadius: 12, background: C.green, color: "#fff", fontSize: 14 })}>✓ {t("Got it", "Bildim")}</button>
                </div>
              )}
            </div>
          );
        })()}

        {tab === "vocab" && pMode === "done" && (
          <div className="anim" style={{ maxWidth: 460, margin: "30px auto", textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>{pKnown === pTotal ? "🏆" : pKnown >= pTotal * 0.7 ? "🎉" : "💪"}</div>
            <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: C.ink, margin: "0 0 6px" }}>{t("Practice complete!", "Mashq tugadi!")}</h3>
            <p style={{ fontSize: 16, color: C.slate, margin: "0 0 22px" }}>{t(`You knew ${pKnown} of ${pTotal} words`, `${pTotal} ta so'zdan ${pKnown} tasini bildingiz`)}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setPMode(null)} style={btn({ padding: "12px 22px", borderRadius: 10, background: C.card, border: `1px solid ${C.line}`, color: C.slate, fontSize: 14 })}>{t("Done", "Tayyor")}</button>
              <button onClick={() => startPractice(pSource)} style={btn({ padding: "12px 22px", borderRadius: 10, background: C.coral, color: "#fff", fontSize: 14 })}>↻ {t("Practice again", "Yana mashq")}</button>
            </div>
          </div>
        )}

        {tab === "vocab" && !pMode && (
          <div className="anim">
            <button onClick={() => setPMode("config")} style={btn({ width: "100%", marginBottom: 16, padding: "14px", borderRadius: 14, background: C.navy, color: "#fff", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 })}>🎴 {t("Practice flashcards", "Kartochka mashqi")}</button>
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, marginBottom: 18 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={vq} onChange={(e) => setVq(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") searchVocab(); }} placeholder={t("Search any English word…", "Istalgan inglizcha so'zni qidiring…")} style={{ flex: 1, padding: "11px 14px", border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 15, outline: "none", color: C.ink, background: C.card }} />
                <button onClick={searchVocab} disabled={vLoad} style={btn({ background: C.coral, color: "#fff", padding: "11px 18px", borderRadius: 10, fontSize: 14 })}>{vLoad ? "…" : t("Search", "Qidir")}</button>
              </div>
              {vRes && (<div className="anim" style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}` }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 18, color: C.ink }}>{vRes.word}</span><button onMouseDown={(e) => { e.preventDefault(); addVocab(vRes.word); }} style={btn({ background: C.navy, color: "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 12 })}>＋ {t("Save", "Saqlash")}</button></div><ExplainCard data={vRes.data} lang={lang} C={C} /></div>)}
            </div>
            {myVocab.length > 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.coral}`, borderRadius: 14, padding: 18, marginBottom: 20 }}>
                <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 16, margin: "0 0 12px", color: C.ink }}>★ {t("My vocab", "Mening lug'atim")} ({myVocab.length})</h3>
                {myVocab.map((v, i) => (<div key={i} style={{ borderBottom: `1px solid ${C.line}`, padding: "8px 0" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontWeight: 600, fontSize: 14, color: C.ink, flex: 1 }}>{v.word}</span><button onClick={() => explainWord(v.word)} style={btn({ background: "transparent", color: C.coral, fontSize: 12 })}>{vMeaning[v.word] === "loading" ? "…" : t("Explain", "Izoh")}</button><button onClick={() => deleteVocab(v, i)} style={btn({ background: "transparent", color: C.red, fontSize: 13 })}>✕</button></div>{vMeaning[v.word] && vMeaning[v.word] !== "loading" && <div style={{ marginTop: 4 }}><ExplainCard data={vMeaning[v.word]} lang={lang} C={C} /></div>}</div>))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>{Object.keys(VOCAB).map((topic) => (<button key={topic} onClick={() => { setVocabTopic(topic); setFlipped(-1); }} style={btn({ padding: "9px 16px", borderRadius: 999, fontSize: 13, border: `1px solid ${vocabTopic === topic ? C.coral : C.line}`, background: vocabTopic === topic ? C.coral : C.card, color: vocabTopic === topic ? "#fff" : C.ink })}>{topic}</button>))}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>{VOCAB[vocabTopic].map((v, i) => (<div key={i} className="anim" onClick={() => setFlipped(flipped === i ? -1 : i)} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, cursor: "pointer", minHeight: 120, animationDelay: `${i * 40}ms` }}><div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 18, color: C.ink }}>{v.word}</div><div style={{ fontSize: 12.5, color: C.slate, marginTop: 4 }}>{v.meaning}</div>{flipped === i ? <div style={{ fontSize: 13.5, color: C.green, marginTop: 12, lineHeight: 1.5, fontStyle: "italic" }}>“{v.ex}”</div> : <div style={{ fontSize: 11, color: C.coral, marginTop: 12, fontWeight: 600 }}>{t("Tap for example", "Misol uchun bosing")}</div>}</div>))}</div>
          </div>
        )}

        {tab === "history" && (
          <div className="anim">
            {history.length === 0 && <div style={{ background: C.card, border: `1px dashed ${C.line}`, borderRadius: 14, padding: 30, textAlign: "center", color: C.slate }}><p style={{ fontSize: 14, margin: 0 }}>{t("No essays scored yet.", "Hali baholangan essay yo'q.")}</p></div>}
            {history.length >= 2 && (<div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, marginBottom: 16 }}><div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: C.slate, fontWeight: 600, marginBottom: 10 }}>{t("Band trend (oldest → newest)", "Band o'zgarishi (eski → yangi)")}</div><Trend data={[...history].reverse().map((h) => h.overall)} C={C} /></div>)}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {history.map((h) => (
                <div key={h.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, overflow: "hidden" }}>
                  <div onClick={() => setExpanded(expanded === h.id ? -1 : h.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, cursor: "pointer" }}>
                    <div style={{ width: 50, height: 50, borderRadius: 12, background: `${bandColor(h.overall, C)}1A`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontFamily: "Fraunces, serif", fontWeight: 900, fontSize: 20, color: bandColor(h.overall, C) }}>{Number(h.overall).toFixed(1)}</span></div>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{h.taskLabel || "Task 2"} · {h.qType} · {h.words} {t("words", "so'z")}</div><div style={{ fontSize: 12, color: C.slate }}>{new Date(h.date).toLocaleString()}</div></div>
                    <button onClick={(ev) => { ev.stopPropagation(); deleteAttempt(h.id); }} style={btn({ background: "transparent", color: C.red, fontSize: 13 })}>✕</button>
                  </div>
                  {expanded === h.id && (<div style={{ padding: "0 16px 16px", borderTop: `1px solid ${C.line}` }}><div style={{ display: "flex", gap: 16, margin: "12px 0", fontSize: 12, color: C.slate }}><span>TR/TA {h.tr}</span><span>CC {h.cc}</span><span>LR {h.lr}</span><span>GRA {h.gra}</span></div><p style={{ fontSize: 13, color: C.ink, fontStyle: "italic", margin: "0 0 8px" }}>{h.qText}</p><p style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{h.essay}</p></div>)}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "admin" && isAdmin && (
          <div className="anim">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: C.ink, margin: 0 }}>👥 {t("All users", "Barcha foydalanuvchilar")} {adminUsers ? `(${adminUsers.length})` : ""}</h3>
              <button onClick={() => { setAdminUsers(null); loadAdmin(); }} style={btn({ background: C.card, border: `1px solid ${C.line}`, color: C.slate, padding: "7px 12px", borderRadius: 8, fontSize: 12 })}>↻ {t("Refresh", "Yangilash")}</button>
            </div>
            {adminUsers === null && <div style={{ textAlign: "center", color: C.slate, padding: 30 }}>…</div>}
            {adminUsers && adminUsers.length === 0 && <div style={{ background: C.card, border: `1px dashed ${C.line}`, borderRadius: 14, padding: 30, textAlign: "center", color: C.slate }}>{t("No users yet.", "Hali foydalanuvchi yo'q.")}</div>}
            {adminUsers && adminUsers.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {adminUsers.map((u) => (
                  <div key={u.user_id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{u.full_name || t("(no name)", "(ismsiz)")}</span>
                      {u.target != null && <span style={{ fontSize: 12, color: C.coral, fontWeight: 700 }}>🎯 {Number(u.target).toFixed(1)}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 6, fontSize: 12.5, color: C.slate }}>
                      {u.phone && <span>📞 {u.phone}</span>}
                      {u.email && <span>✉ {u.email}</span>}
                      {u.level && <span>📊 {u.level}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: C.slate, marginTop: 6, opacity: .7 }}>{t("Joined", "Qo'shilgan")}: {new Date(u.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
            <p style={{ textAlign: "center", color: C.slate, fontSize: 11, marginTop: 20, opacity: .7 }}>{t("Visible to admins only.", "Faqat adminlarga ko'rinadi.")}</p>
          </div>
        )}

        <p style={{ textAlign: "center", color: C.slate, fontSize: 11, marginTop: 30, opacity: .7 }}>{hasSupabase && session ? t("Signed in. Your history is saved to your account.", "Kirdingiz. Tarixingiz hisobingizga saqlanadi.") : t("Scores are AI estimates.", "Baholar AI taxminiy.")}</p>
      </div>
    </main>
  );
}
