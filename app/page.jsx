"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { TASKS, TASK_ORDER, VOCAB, ETYPE } from "./data";
import TaskChart from "./TaskChart";
import Auth from "./Auth";
import Landing from "./Landing";
import Speaking from "./Speaking";
import Reading from "./Reading";
import Listening from "./Listening";
import Logo from "./Logo";
import VocabChallenge from "./VocabChallenge";
import { supabase, hasSupabase } from "./lib/supabase";

// CSS-variable palette (tokens live in globals.css .app-root)
const V = {
  bg: "var(--app-bg)", surface: "var(--surface)", surface2: "var(--surface-2)", elev: "var(--elev)",
  text: "var(--text)", muted: "var(--muted)", faint: "var(--faint)",
  border: "var(--border)", border2: "var(--border-2)",
  accent: "var(--accent)", accent2: "var(--accent2)", accentSoft: "var(--accent-soft)",
  good: "var(--good)", bad: "var(--bad)", shadow: "var(--shadow)",
  promptBg: "var(--prompt-bg)", promptText: "var(--prompt-text)", track: "var(--track)",
};
const GRAD = "linear-gradient(120deg,var(--accent),var(--accent2))";
const serif = "'DM Serif Display', serif";

const DRAFT_KEY = "ielts:draft", VOCAB_KEY = "ielts:myvocab", THEME_KEY = "ielts:theme", HIST_KEY = "ielts:history", TARGET_KEY = "ielts:target";
const PROFILE_LEVELS = ["Beginner", "4.5 – 5.0", "5.5 – 6.0", "6.5 – 7.0", "7.5+", "Not sure"];
const PROFILE_TARGETS = [5.5, 6, 6.5, 7, 7.5, 8];

function countWords(s) { const t = s.trim(); return t ? t.split(/\s+/).length : 0; }
function bandColor(b) { if (b >= 7) return "var(--good)"; if (b >= 6) return "#7BAE4A"; if (b >= 5) return "var(--accent2)"; return "var(--bad)"; }
function fmt(s) { return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }
const etype = (t) => ETYPE[t] || ETYPE.grammar;
const btn = (extra = {}) => ({ cursor: "pointer", border: "none", fontWeight: 700, fontFamily: "inherit", transition: "all .18s ease", ...extra });
const rowToItem = (r) => ({ id: r.id, date: r.created_at, taskType: r.task_type, taskLabel: r.task_label, qType: r.q_type, qText: r.q_text, essay: r.essay, words: r.words, overall: r.overall, tr: r.tr, cc: r.cc, lr: r.lr, gra: r.gra, audioUrl: r.audio_url, errors: r.errors || [] });
const rowToVocabItem = (r) => ({ id: r.id, word: r.word, date: r.created_at });
function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function extractSentence(full, needle) {
  if (!full || !needle) return needle || "";
  const idx = full.indexOf(needle);
  if (idx < 0) return needle;
  let start = idx;
  while (start > 0 && ".!?\n".indexOf(full[start - 1]) === -1) start--;
  let end = idx + needle.length;
  while (end < full.length && ".!?\n".indexOf(full[end]) === -1) end++;
  let sent = full.slice(start, end + (full[end] && ".!?".indexOf(full[end]) !== -1 ? 1 : 0)).trim();
  sent = sent.replace(/^Candidate:\s*/i, "").replace(/^Examiner:\s*/i, "");
  return sent || needle;
}

function buildWeaknessProfile(history) {
  const counts = {};
  const flat = [];
  history.forEach((h) => {
    (h.errors || []).forEach((e) => {
      if (!e || !e.text) return;
      counts[e.type] = (counts[e.type] || 0) + 1;
      flat.push({ type: e.type, rule: e.rule, fix: e.fix, sentence: extractSentence(h.essay, e.text) });
    });
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return { counts, top, flat };
}

function NavIcon({ name }) {
  const common = { width: 21, height: 21, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "write") return (<svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>);
  if (name === "speaking") return (<svg {...common}><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" /><path d="M19 11a7 7 0 0 1-14 0" /><path d="M12 18v3" /></svg>);
  if (name === "vocab") return (<svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" /><path d="M4 5.5v15" /></svg>);
  if (name === "history") return (<svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>);
  if (name === "profile") return (<svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" /></svg>);
  if (name === "reading") return (<svg {...common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>);
  if (name === "listening") return (<svg {...common}><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" /><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z" /></svg>);
  if (name === "mock") return (<svg {...common}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></svg>);
  return null;
}

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

function MiniCrit({ label, band }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ fontFamily: serif, fontSize: 20, color: bandColor(band) }}>{Number(band).toFixed(1)}</div>
      <div style={{ fontSize: 10, color: V.muted, marginTop: 2, fontWeight: 700, letterSpacing: .5 }}>{label}</div>
    </div>
  );
}

function Trend({ data }) {
  if (data.length < 2) return null;
  const w = 240, h = 44, pad = 6;
  const xs = (i) => pad + (i * (w - 2 * pad)) / (data.length - 1);
  const ys = (v) => h - pad - ((Math.max(4, v) - 4) / 5) * (h - 2 * pad);
  const pts = data.map((v, i) => `${xs(i)},${ys(v)}`).join(" ");
  return (<svg width={w} height={h} style={{ display: "block", maxWidth: "100%" }}><polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 600, animation: "draw 1s ease both" }} />{data.map((v, i) => <circle key={i} cx={xs(i)} cy={ys(v)} r="3" fill="var(--accent)" />)}</svg>);
}

function ExplainCard({ data, lang }) {
  if (!data || data === "loading") return null;
  const L = (en, uz) => (lang === "uz" ? uz : en);
  return (
    <div style={{ fontSize: 13, color: V.muted, lineHeight: 1.55 }}>
      {data.pos && <span style={{ fontStyle: "italic", color: V.accent, fontWeight: 700 }}>{data.pos}</span>}
      {data.meaning && <div style={{ color: V.text, marginTop: 2 }}>{data.meaning}</div>}
      {data.usage && <div style={{ marginTop: 4 }}><b style={{ color: V.text }}>{L("Usage", "Ishlatilishi")}:</b> {data.usage}</div>}
      {(data.synonyms || []).length > 0 && <div style={{ marginTop: 4 }}>{L("Synonyms", "Sinonimlar")}: {data.synonyms.join(", ")}</div>}
      {(data.examples || []).map((ex, i) => <div key={i} style={{ fontStyle: "italic", color: V.good, marginTop: 4 }}>"{ex}"</div>)}
    </div>
  );
}

function Section({ title, count, open, onToggle, children, accent, delay }) {
  return (
    <div className="anim" style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 18, marginBottom: 12, overflow: "hidden", animationDelay: `${delay || 0}ms`, boxShadow: "0 6px 22px rgba(42,33,30,0.05)" }}>
      <button onClick={onToggle} style={btn({ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 19px", background: "transparent", color: V.text, fontSize: 15 })}>
        <span style={{ fontFamily: serif, color: accent || V.text, letterSpacing: .2 }}>{title}{count != null ? ` (${count})` : ""}</span>
        <span style={{ color: V.muted, fontSize: 20, lineHeight: 1 }}>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{ padding: "0 19px 19px" }}>{children}</div>}
    </div>
  );
}

export default function Home() {
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [tab, setTab] = useState("write");
  const [drawerOpen, setDrawerOpen] = useState(false);
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
  const [open, setOpen] = useState({ corrections: true, paragraphs: false, feedback: false, synonyms: false, improved: false, model: false });
  const [myVocab, setMyVocab] = useState([]);
  const [selBtn, setSelBtn] = useState(null);
  const [vMeaning, setVMeaning] = useState({});
  const [vq, setVq] = useState("");
  const [vRes, setVRes] = useState(null);
  const [vLoad, setVLoad] = useState(false);
  const [pMode, setPMode] = useState(null);
  const [pSource, setPSource] = useState("both");
  const [pDeck, setPDeck] = useState([]);
  const [pIdx, setPIdx] = useState(0);
  const [pReveal, setPReveal] = useState(false);
  const [pKnown, setPKnown] = useState(0);
  const [pTotal, setPTotal] = useState(0);
  const [pMean, setPMean] = useState({});
  const [profile, setProfile] = useState(null);
  const [adminUsers, setAdminUsers] = useState(null);
  const [histTab, setHistTab] = useState("writing");
  const [profEdit, setProfEdit] = useState(false);
  const [profForm, setProfForm] = useState({ full_name: "", phone: "", level: "", target: "" });
  const [profMode, setProfMode] = useState(null);
  const [upgradeInfo, setUpgradeInfo] = useState(null);
  const [gapDeck, setGapDeck] = useState([]);
  const [gapIdx, setGapIdx] = useState(0);
  const [gapAnswer, setGapAnswer] = useState("");
  const [gapChecking, setGapChecking] = useState(false);
  const [gapResult, setGapResult] = useState(null);
  const [gapGoodCount, setGapGoodCount] = useState(0);
  const [vcOpen, setVcOpen] = useState(false);
  const [vcJoinRoom, setVcJoinRoom] = useState(null);
  const [vcInitialView, setVcInitialView] = useState("entry");
  const [vcInviteCount, setVcInviteCount] = useState(0);
  const restored = useRef(false);

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

  // pending Vocab Challenge invites → small badge on the nav card, kept live via Realtime
  useEffect(() => {
    if (!hasSupabase || !session) { setVcInviteCount(0); return; }
    let active = true;
    async function refreshInvites() {
      const { count } = await supabase.from("vocab_challenge_invites").select("id", { count: "exact", head: true }).eq("to_user", session.user.id).eq("status", "pending");
      if (active) setVcInviteCount(count || 0);
    }
    refreshInvites();
    const ch = supabase
      .channel(`vc-invite-badge-${session.user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "vocab_challenge_invites", filter: `to_user=eq.${session.user.id}` }, refreshInvites)
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [session]);

  useEffect(() => {
    try { const ac = localStorage.getItem("ielts:access"); if (ac) setAccessCode(ac); } catch (e) {}
    try { const th = localStorage.getItem(THEME_KEY); if (th === "dark" || th === "light") setTheme(th); } catch (e) {}
    try { const tg = localStorage.getItem(TARGET_KEY); if (tg) setTargetBand(Number(tg)); } catch (e) {}
    try { const d = localStorage.getItem(DRAFT_KEY); if (d) { const o = JSON.parse(d); if (o.taskType && TASKS[o.taskType]) { setTaskType(o.taskType); setQIndex(o.qIndex || 0); setEssay(o.essay || ""); setSecondsLeft(TASKS[o.taskType].minutes * 60); } } } catch (e) {}
    // Vocab Challenge invite link: /?vocabRoom=<id> auto-opens the challenge and joins the room
    try {
      const params = new URLSearchParams(window.location.search);
      const vr = params.get("vocabRoom");
      if (vr) {
        setVcJoinRoom(vr); setVcOpen(true); setTab("vocab"); setPMode(null);
        params.delete("vocabRoom");
        const rest = params.toString();
        window.history.replaceState({}, "", window.location.pathname + (rest ? "?" + rest : ""));
      }
    } catch (e) {}
    restored.current = true;
  }, []);
  useEffect(() => { if (!restored.current) return; try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ taskType, qIndex, essay })); } catch (e) {} }, [taskType, qIndex, essay]);
  useEffect(() => { try { localStorage.setItem(THEME_KEY, theme); } catch (e) {} }, [theme]);
  useEffect(() => { try { localStorage.setItem(TARGET_KEY, String(targetBand)); } catch (e) {} }, [targetBand]);
  useEffect(() => { if (!running) return; if (secondsLeft <= 0) { setRunning(false); return; } const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000); return () => clearInterval(id); }, [running, secondsLeft]);
  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e) { if (e.key === "Escape") setDrawerOpen(false); }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [drawerOpen]);

  function persistVocab(next) { setMyVocab(next); try { localStorage.setItem(VOCAB_KEY, JSON.stringify(next)); } catch (e) {} }
  function clearOutputs() { setResult(null); setError(""); setActiveErr(-1); setModelText(""); setImproved(null); setTrans(null); }
  function switchTask(tt) { setTaskType(tt); setQIndex(0); setEssay(""); clearOutputs(); setSecondsLeft(TASKS[tt].minutes * 60); setRunning(false); setPhase("edit"); }
  function newQuestion() { let i = qIndex; while (i === qIndex && bank.length > 1) i = Math.floor(Math.random() * bank.length); setQIndex(i); setEssay(""); clearOutputs(); }
  async function logout() { setHistory([]); setMyVocab([]); setProfile(null); setAdminUsers(null); if (supabase) await supabase.auth.signOut(); }

  async function api(payload) {
    const headers = { "Content-Type": "application/json" };
    if (hasSupabase && session && session.access_token) headers["Authorization"] = "Bearer " + session.access_token;
    const res = await fetch("/api/score", { method: "POST", headers,
      body: JSON.stringify({ taskType, question: q.text, qType: q.type, lang, chartSummary: q.chart ? q.chart.summary : null, password: accessCode, ...payload }) });
    const data = await res.json();
    if (res.status === 402 && data.limitReached) { setUpgradeInfo(data); }
    return data;
  }

  async function saveAttempt(parsed) {
    const item = { id: Date.now(), date: new Date().toISOString(), taskType, taskLabel: task.label.en, qType: q.type, qText: q.text, essay, words, overall: parsed.overall, tr: parsed.tr.band, cc: parsed.cc.band, lr: parsed.lr.band, gra: parsed.gra.band, errors: parsed.errors || [] };
    if (hasSupabase && session) {
      const row = { user_id: session.user.id, task_type: taskType, task_label: task.label.en, q_type: q.type, q_text: q.text, essay, words, overall: parsed.overall, tr: parsed.tr.band, cc: parsed.cc.band, lr: parsed.lr.band, gra: parsed.gra.band, errors: parsed.errors || [] };
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
      setOpen({ corrections: true, paragraphs: false, feedback: false, synonyms: false, improved: false, model: false });
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

  const isAdmin = !!(profile && profile.is_admin);
  const MOCK_ITEMS = [
    ["write", "✍️", t("Writing", "Yozish")],
    ["speaking", "🎙", t("Speaking", "Speaking")],
    ["reading", "📖", t("Reading", "O'qish")],
    ["listening", "🎧", t("Listening", "Tinglash")],
  ];
  const OTHER_ITEMS = [
    ["vocab", "🎴", t("Vocab", "Lug'at")],
    ["history", "📈", t("History", "Tarix")],
    ["profile", "👤", t("Profile", "Profil")],
  ];
  if (isAdmin) OTHER_ITEMS.push(["admin", "🛠️", "Admin"]);
  const MOCK_TAB_KEYS = ["write", "speaking", "reading", "listening"];
  async function loadAdmin() {
    if (!isAdmin || !supabase) return;
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setAdminUsers(data || []);
  }
  useEffect(() => { if (tab === "admin" && isAdmin && adminUsers === null) loadAdmin(); }, [tab, isAdmin]);

  function startProfEdit() {
    setProfForm({
      full_name: (profile && profile.full_name) || "",
      phone: (profile && profile.phone) || "",
      level: (profile && profile.level) || "",
      target: profile && profile.target != null ? String(profile.target) : "",
    });
    setProfEdit(true);
  }
  async function saveProfile() {
    if (!hasSupabase || !session) { setProfEdit(false); return; }
    const updates = { full_name: profForm.full_name.trim(), phone: profForm.phone.trim(), level: profForm.level || null, target: profForm.target ? Number(profForm.target) : null };
    const { data, error } = await supabase.from("profiles").update(updates).eq("user_id", session.user.id).select().single();
    if (!error && data) setProfile(data);
    setProfEdit(false);
  }

  const profStats = useMemo(() => {
    const writingHist = history.filter((h) => h.taskType !== "spk" && h.taskType !== "reading" && h.taskType !== "listening");
    const speakingHist = history.filter((h) => h.taskType === "spk");
    const avgBand = writingHist.length ? writingHist.reduce((a, h) => a + (h.overall || 0), 0) / writingHist.length : null;
    const bestBand = history.length ? Math.max(...history.map((h) => h.overall || 0)) : null;
    let streak = 0;
    if (history.length) {
      const daySet = new Set(history.map((h) => new Date(h.date).toDateString()));
      let checkDate = new Date();
      if (!daySet.has(checkDate.toDateString())) checkDate.setDate(checkDate.getDate() - 1);
      while (daySet.has(checkDate.toDateString())) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
    }
    return { totalEssays: writingHist.length, avgBand, bestBand, speakingCount: speakingHist.length, streak };
  }, [history]);

  const weakness = useMemo(() => buildWeaknessProfile(history), [history]);

  function startGapZali() {
    const pool = shuffle(weakness.flat.filter((x) => x.sentence && x.sentence.length > 5)).slice(0, 5);
    if (pool.length === 0) return;
    setGapDeck(pool); setGapIdx(0); setGapAnswer(""); setGapResult(null); setGapGoodCount(0);
    setProfMode("gap-run");
  }
  async function submitGap() {
    if (!gapAnswer.trim()) return;
    setGapChecking(true); setGapResult(null);
    try {
      const r = await api({ mode: "gapCheck", original: gapDeck[gapIdx].sentence, rewrite: gapAnswer.trim(), targetBand });
      if (r.needPassword) { setShowGate(true); setGapChecking(false); return; }
      setGapResult(r);
      if (r.good) setGapGoodCount((c) => c + 1);
    } catch (e) { setGapResult({ feedback: t("Network error.", "Tarmoq xatosi."), good: false, idealRewrite: "" }); }
    finally { setGapChecking(false); }
  }
  function nextGap() {
    if (gapIdx + 1 >= gapDeck.length) { setProfMode("gap-done"); return; }
    setGapIdx((i) => i + 1); setGapAnswer(""); setGapResult(null);
  }

  const segments = useMemo(() => (result ? buildSegments(result.scoredEssay, result.errors) : []), [result]);
  const firstLabel = task.first[lang];
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const BANDS = [6.5, 7, 7.5, 8];

  if (!authChecked) return <main style={{ minHeight: "100vh", background: "#FFF6ED", color: "#7A6A61", display: "flex", alignItems: "center", justifyContent: "center" }}>…</main>;
  if (hasSupabase && !session) {
    return showAuth
      ? <Auth lang={lang} onLang={setLang} initialMode={authMode} onBack={() => setShowAuth(false)} />
      : <Landing lang={lang} onLang={setLang} onStart={(m) => { setAuthMode(m || "login"); setShowAuth(true); }} />;
  }

  const chip = (active) => btn({ padding: "9px 16px", borderRadius: 100, fontSize: 13.5, border: `1px solid ${active ? "transparent" : V.border}`, background: active ? GRAD : V.surface, color: active ? "#fff" : V.text, boxShadow: active ? "0 8px 20px rgba(255,106,77,0.30)" : "none" });
  const tpill = (active) => btn({ padding: "6px 12px", borderRadius: 8, fontSize: 12.5, background: active ? GRAD : "transparent", color: active ? "#fff" : V.muted });

  return (
    <main className="app-root" data-theme={theme} onMouseUp={handleSelect} style={{ minHeight: "100vh", background: V.bg, color: V.text, transition: "background .35s ease, color .35s ease", paddingBottom: 60 }}>

      {showGate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(20,14,10,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }}>
          <div className="anim" style={{ background: V.surface, borderRadius: 18, padding: 26, width: 340, maxWidth: "100%", boxShadow: V.shadow }}>
            <h3 style={{ margin: "0 0 6px", fontFamily: serif, fontSize: 20, color: V.text }}>{t("Enter access code", "Kirish kodini kiriting")}</h3>
            <p style={{ fontSize: 13, color: V.muted, margin: "0 0 14px", lineHeight: 1.5 }}>{t("This app is protected to prevent misuse.", "Bu app suiiste'molni oldini olish uchun himoyalangan.")}</p>
            <input value={gateInput} onChange={(e) => setGateInput(e.target.value)} type="password" placeholder="••••••••" onKeyDown={(e) => { if (e.key === "Enter") saveGate(); }} style={{ width: "100%", padding: "11px 13px", border: `1px solid ${V.border}`, borderRadius: 11, fontSize: 15, outline: "none", color: V.text, background: V.surface }} />
            <button onClick={saveGate} style={btn({ marginTop: 12, width: "100%", background: GRAD, color: "#fff", padding: "12px", borderRadius: 11, fontSize: 14 })}>{t("Save & continue", "Saqlash va davom etish")}</button>
          </div>
        </div>
      )}

      {upgradeInfo && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(20,14,10,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }}>
          <div className="anim" style={{ background: V.surface, borderRadius: 18, padding: 26, width: 360, maxWidth: "100%", boxShadow: V.shadow, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🚀</div>
            <h3 style={{ margin: "0 0 8px", fontFamily: serif, fontSize: 20, color: V.text }}>{t("Weekly free limit reached", "Haftalik bepul limit tugadi")}</h3>
            <p style={{ fontSize: 13.5, color: V.muted, margin: "0 0 18px", lineHeight: 1.5 }}>{t("Upgrade to Pro for unlimited essays and speaking sessions.", "Cheksiz essay va speaking uchun Pro rejaga o'ting.")}</p>
            <button onClick={() => setUpgradeInfo(null)} style={btn({ width: "100%", background: GRAD, color: "#fff", padding: "12px", borderRadius: 11, fontSize: 14 })}>{t("Got it", "Tushunarli")}</button>
          </div>
        </div>
      )}

      {selBtn && (<button onMouseDown={(e) => { e.preventDefault(); addVocab(selBtn.text); }} style={btn({ position: "fixed", left: selBtn.x, top: selBtn.y - 42, transform: "translateX(-50%)", zIndex: 55, background: V.text, color: V.bg, padding: "7px 13px", borderRadius: 9, fontSize: 12, boxShadow: "0 6px 18px rgba(0,0,0,.25)", whiteSpace: "nowrap", animation: "pop .15s ease both" })}>＋ {t("Add to my vocab", "Lug'atimga qo'shish")}</button>)}

      {/* ===== TOP BAR ===== */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: V.surface, borderBottom: `1px solid ${V.border}`, backdropFilter: "blur(12px)" }}>
        <div className="header-inner" style={{ maxWidth: 1180, margin: "0 auto", padding: "13px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div className="header-brand" style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <button onClick={() => setDrawerOpen(true)} aria-label={t("Open menu", "Menyuni ochish")} className="header-burger">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <Logo size={24} />
            <span className="brand" style={{ fontFamily: serif, fontSize: 21, color: V.text }}>IELTS Writing Coach</span>
          </div>
          <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ display: "flex", background: V.surface2, borderRadius: 10, padding: 3 }}>
              {[["en", "EN"], ["uz", "UZ"]].map(([k, l]) => (<button key={k} onClick={() => setLang(k)} style={btn({ padding: "5px 11px", borderRadius: 8, fontSize: 12.5, background: lang === k ? V.text : "transparent", color: lang === k ? V.bg : V.muted })}>{l}</button>))}
            </div>
            <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} style={btn({ width: 36, height: 36, borderRadius: 10, background: V.surface2, color: V.text, fontSize: 15 })}>{theme === "light" ? "☾" : "☀"}</button>
            {hasSupabase && session && (<button onClick={logout} title={session.user.email} style={btn({ padding: "8px 15px", borderRadius: 10, fontSize: 13, background: V.surface, border: `1px solid ${V.border}`, color: V.text })}>{t("Log out", "Chiqish")}</button>)}
          </div>
        </div>
      </header>

      {/* ===== LEFT NAV DRAWER ===== */}
      {drawerOpen && <div className="nav-drawer-overlay" onClick={() => setDrawerOpen(false)} />}
      <aside className={"nav-drawer" + (drawerOpen ? " open" : "")} role="dialog" aria-hidden={!drawerOpen}>
        <div className="nav-drawer-head">
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: serif, fontSize: 17, color: V.text }}><Logo size={22} /> IELTS Coach</span>
          <button onClick={() => setDrawerOpen(false)} aria-label={t("Close menu", "Menyuni yopish")} className="nav-drawer-close">✕</button>
        </div>
        <div className="nav-drawer-body">
          <div className="nav-drawer-label">IELTS MOCK</div>
          {MOCK_ITEMS.map(([k, icon, label]) => (
            <button key={k} className={"nav-drawer-item" + (tab === k ? " active" : "")} onClick={() => { setTab(k); setDrawerOpen(false); }}>
              <span className="nav-drawer-icon">{icon}</span>{label}
            </button>
          ))}
          <div className="nav-drawer-divider" />
          {OTHER_ITEMS.map(([k, icon, label]) => (
            <button key={k} className={"nav-drawer-item" + (tab === k ? " active" : "")} onClick={() => { setTab(k); setDrawerOpen(false); }}>
              <span className="nav-drawer-icon">{icon}</span>{label}
            </button>
          ))}
        </div>
      </aside>

      <div className="wrap" style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 26px 0" }}>

        {/* ============ WRITE — EDIT ============ */}
        {tab === "write" && phase === "edit" && (
          <div className="anim">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {TASK_ORDER.map((tt) => (<button key={tt} onClick={() => switchTask(tt)} style={chip(taskType === tt)}>{TASKS[tt].label[lang]}</button>))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, fontWeight: 700, color: V.muted }}>
                <span>🎯 {t("Target band", "Maqsad band")}</span>
                <div style={{ display: "flex", background: V.surface2, border: `1px solid ${V.border}`, borderRadius: 10, padding: 3, gap: 2 }}>
                  {BANDS.map((b) => <button key={b} onClick={() => setTargetBand(b)} style={tpill(targetBand === b)}>{b === 8 ? "8.0+" : b.toFixed(1)}</button>)}
                </div>
              </div>
            </div>

            <div className="work-grid" style={{ display: "grid", gridTemplateColumns: "0.92fr 1.08fr", gap: 22, alignItems: "start" }}>
              {/* QUESTION CARD */}
              <section key={taskType + qIndex} className="cardin" style={{ position: "relative", overflow: "hidden", borderRadius: 22, background: V.promptBg, color: V.promptText, boxShadow: V.shadow }}>
                <div style={{ position: "absolute", top: -70, right: -50, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,var(--accent) 0%,transparent 70%)", opacity: .28, pointerEvents: "none" }} />
                <div style={{ position: "relative", padding: "22px 24px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#fff", background: GRAD, padding: "6px 12px", borderRadius: 100 }}>{q.type}</span>
                    <button onClick={newQuestion} style={btn({ border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 12.5, padding: "8px 13px", borderRadius: 10 })}>↻ {t("New question", "Yangi savol")}</button>
                  </div>
                  {q.chart && <div style={{ background: "#fff", borderRadius: 14, padding: 4, marginBottom: 16 }}><TaskChart spec={q.chart} dark={false} /></div>}
                  <p style={{ fontFamily: serif, fontSize: "clamp(16px,1.6vw,19px)", lineHeight: 1.5, margin: 0 }}>{q.text}</p>
                  <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)", fontWeight: 700 }}>{t("Translate:", "Tarjima:")}</span>
                    <button onClick={() => translate("uz")} style={btn({ background: trans && trans.lang === "uz" ? GRAD : "rgba(255,255,255,.10)", color: "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 12 })}>{transLoading === "uz" ? "…" : "O'zbekcha"}</button>
                    <button onClick={() => translate("ru")} style={btn({ background: trans && trans.lang === "ru" ? GRAD : "rgba(255,255,255,.10)", color: "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 12 })}>{transLoading === "ru" ? "…" : "Русский"}</button>
                  </div>
                  {trans && <p className="anim" style={{ fontSize: 14, lineHeight: 1.55, margin: "14px 0 0", padding: "11px 13px", background: "rgba(255,255,255,.08)", borderRadius: 10, color: "rgba(255,255,255,.92)" }}>{trans.text}</p>}
                </div>
              </section>

              {/* WRITE PANEL */}
              <section>
                <div style={{ display: "flex", alignItems: "center", gap: 12, background: V.surface, border: `1px solid ${V.border}`, borderRadius: 16, padding: "12px 16px", marginBottom: 12, flexWrap: "wrap", boxShadow: "0 6px 22px rgba(42,33,30,0.05)" }}>
                  <span style={{ fontFamily: serif, fontSize: 24, color: secondsLeft < 300 ? V.accent : V.text, minWidth: 76 }}>{fmt(secondsLeft)}</span>
                  <button onClick={() => setRunning((r) => !r)} style={btn({ background: running ? V.surface2 : GRAD, color: running ? V.text : "#fff", padding: "8px 16px", borderRadius: 10, fontSize: 13, boxShadow: running ? "none" : "0 6px 16px rgba(255,106,77,0.3)" })}>{running ? t("Pause", "Pauza") : t("Start", "Boshlash")}</button>
                  <button onClick={() => { setSecondsLeft(task.minutes * 60); setRunning(false); }} style={btn({ background: V.surface, border: `1px solid ${V.border}`, color: V.muted, padding: "8px 14px", borderRadius: 10, fontSize: 13 })}>{t("Reset", "Tiklash")}</button>
                  <span style={{ marginLeft: "auto", textAlign: "right", lineHeight: 1.1 }}>
                    <span style={{ fontFamily: serif, fontSize: 20, color: words >= minW ? V.good : V.text }}>{words}</span>
                    <span style={{ fontSize: 12, color: V.faint, fontWeight: 700 }}> / {minW}<br /><span style={{ fontSize: 10, letterSpacing: 1 }}>{t("WORDS", "SO'Z")}</span></span>
                  </span>
                </div>

                <textarea value={essay} onChange={(e) => setEssay(e.target.value)} placeholder={t("Start writing your response here…", "Javobingizni shu yerga yozing…")} style={{ width: "100%", minHeight: 380, padding: "18px 20px", border: `1px solid ${V.border}`, borderRadius: 18, fontSize: 15.5, lineHeight: 1.75, color: V.text, outline: "none", resize: "vertical", background: V.surface, boxShadow: "0 6px 22px rgba(42,33,30,0.05)" }} />

                <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <button onClick={evaluate} disabled={loading} style={btn({ background: GRAD, color: "#fff", padding: "14px 26px", borderRadius: 13, fontSize: 15, opacity: loading ? .85 : 1, boxShadow: "0 10px 26px rgba(255,106,77,0.35)" })}>{loading ? t("Scoring…", "Baholanmoqda…") : t("Score my essay →", "Baholash →")}</button>
                  {result && <button onClick={() => setPhase("review")} style={btn({ background: V.surface, border: `1px solid ${V.border}`, color: V.text, padding: "13px 17px", borderRadius: 12, fontSize: 13 })}>{t("View my result →", "Natijamni ko'rish →")}</button>}
                  <button onClick={showModel} disabled={modelLoading} style={btn({ background: V.surface, border: `1px solid ${V.border}`, color: V.text, padding: "13px 17px", borderRadius: 12, fontSize: 13 })}>{modelLoading ? "…" : t("Model answer", "Namuna javob")}</button>
                  {essay && <button onClick={() => { setEssay(""); clearOutputs(); }} style={btn({ background: "transparent", color: V.faint, fontSize: 13, marginLeft: "auto" })}>{t("Clear", "Tozalash")}</button>}
                </div>
                {hasSupabase && session && <p style={{ fontSize: 12, color: V.faint, marginTop: 10 }}>{t("Signed in · history saved", "Kirdingiz · tarix saqlanadi")}</p>}
                {error && <p style={{ color: V.bad, fontSize: 13, marginTop: 10 }}>{error}</p>}
                {modelText && (
                  <div className="sel anim" style={{ marginTop: 16, background: V.promptBg, color: V.promptText, borderRadius: 18, padding: 20, boxShadow: V.shadow }}>
                    <h3 style={{ fontFamily: serif, fontSize: 16, margin: "0 0 10px", color: V.accent2 }}>★ {t("Band-9 model answer", "Band-9 namuna javob")}</h3>
                    <p style={{ fontSize: 14.5, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{modelText}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,.5)", margin: "10px 0 0" }}>{t("Tip: select any phrase to add it to your vocab.", "Maslahat: istalgan iborani belgilab lug'atingizga qo'shing.")}</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* ============ WRITE — REVIEW ============ */}
        {tab === "write" && phase === "review" && result && (
          <>
            <div className="cardin" style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 20, padding: "18px 20px", marginBottom: 14, boxShadow: V.shadow }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                <div style={{ width: 70, height: 70, borderRadius: 18, background: `${"var(--accent-soft)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `1px solid ${V.border}` }}>
                  <span style={{ fontFamily: serif, fontSize: 28, color: bandColor(result.overall), lineHeight: 1 }}>{Number(result.overall).toFixed(1)}</span>
                  <span style={{ fontSize: 8, color: V.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>band</span>
                </div>
                <div style={{ display: "flex", flex: 1, minWidth: 220, gap: 6 }}>
                  <MiniCrit label={taskType.startsWith("t1") ? "TA" : "TR"} band={result.tr.band} />
                  <MiniCrit label="CC" band={result.cc.band} /><MiniCrit label="LR" band={result.lr.band} /><MiniCrit label="GRA" band={result.gra.band} />
                </div>
                <button onClick={() => setPhase("edit")} style={btn({ background: V.text, color: V.bg, padding: "10px 17px", borderRadius: 11, fontSize: 13 })}>← {t("Edit", "Tahrir")}</button>
              </div>
            </div>

            {result.toTarget && (
              <div className="anim" style={{ background: V.accentSoft, border: `1px solid var(--accent)`, borderRadius: 16, padding: "15px 19px", marginBottom: 12 }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: V.accent, fontWeight: 800, marginBottom: 4 }}>🎯 {t(`To reach band ${Number(targetBand).toFixed(1)}`, `Band ${Number(targetBand).toFixed(1)} uchun`)}</div>
                <p style={{ fontSize: 14, color: V.text, margin: 0, lineHeight: 1.55 }}>{result.toTarget}</p>
              </div>
            )}

            <Section title={t("Corrections", "Tuzatishlar")} count={(result.errors || []).length} open={open.corrections} onToggle={() => toggle("corrections")} delay={40}>
              <div className="sel"><p style={{ fontSize: 15.5, lineHeight: 1.9, margin: "0 0 14px", whiteSpace: "pre-wrap", color: V.text }}>{segments.map((s, i) => s.e === null ? <span key={i}>{s.text}</span> : <span key={i} onClick={() => setActiveErr(s.e)} style={{ cursor: "pointer", borderRadius: 2, padding: "0 1px", borderBottom: `2px solid ${etype(result.errors[s.e].type).c}`, background: activeErr === s.e ? `${etype(result.errors[s.e].type).c}22` : "transparent" }}>{s.text}</span>)}</p></div>
              {(result.errors || []).map((e, i) => (
                <div key={i} onClick={() => setActiveErr(i)} style={{ marginBottom: 10, cursor: "pointer", padding: 13, borderRadius: 12, background: activeErr === i ? `${etype(e.type).c}11` : "transparent", border: `1px solid ${activeErr === i ? etype(e.type).c : V.border}` }}>
                  <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: etype(e.type).c, fontWeight: 800 }}>{etype(e.type)[lang]}</span>
                  <div style={{ fontSize: 13, color: V.bad, textDecoration: "line-through", opacity: .8, marginTop: 2 }}>{e.text}</div>
                  <div style={{ fontSize: 14, color: V.good, fontWeight: 700 }}>{e.fix}</div>
                  {e.rule && <div style={{ fontSize: 12, color: V.muted, marginTop: 5, paddingTop: 5, borderTop: `1px dashed ${V.border}` }}>💡 {e.rule}</div>}
                </div>
              ))}
            </Section>

            {result.paragraphs && result.paragraphs.length > 0 && (
              <Section title={t("Paragraph feedback", "Abzatslar bo'yicha")} count={result.paragraphs.length} open={open.paragraphs} onToggle={() => toggle("paragraphs")} accent={V.good} delay={70}>
                {result.paragraphs.map((p, i) => (
                  <div key={i} style={{ marginBottom: 12, paddingLeft: 12, borderLeft: `3px solid var(--good)` }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: V.good, textTransform: "uppercase", letterSpacing: .5 }}>{p.label}</div>
                    <div style={{ fontSize: 13.5, color: V.text, marginTop: 2, lineHeight: 1.5 }}>{p.note}</div>
                  </div>
                ))}
              </Section>
            )}

            <Section title={t("Feedback", "Fikr-mulohaza")} open={open.feedback} onToggle={() => toggle("feedback")} delay={100}>
              <h4 style={{ fontFamily: serif, fontSize: 15, margin: "0 0 6px", color: V.good }}>✓ {t("What worked", "Yaxshi tomonlari")}</h4>
              <ul style={{ margin: "0 0 14px", paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>{(result.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
              <h4 style={{ fontFamily: serif, fontSize: 15, margin: "0 0 6px", color: V.accent }}>→ {t("To improve", "Yaxshilash kerak")}</h4>
              <ul style={{ margin: "0 0 14px", paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>{(result.improvements || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
              <div style={{ borderTop: `1px solid ${V.border}`, paddingTop: 10, fontSize: 12.5, color: V.muted, lineHeight: 1.6 }}>
                <div><b style={{ color: V.text }}>{firstLabel}:</b> {result.tr.note}</div>
                <div><b style={{ color: V.text }}>CC:</b> {result.cc.note}</div>
                <div><b style={{ color: V.text }}>LR:</b> {result.lr.note}</div>
                <div><b style={{ color: V.text }}>GRA:</b> {result.gra.note}</div>
              </div>
            </Section>

            {result.synonyms && result.synonyms.length > 0 && (
              <Section title={t("Word variety", "So'z xilma-xilligi")} count={result.synonyms.length} open={open.synonyms} onToggle={() => toggle("synonyms")} accent={V.accent} delay={130}>
                <p style={{ fontSize: 12.5, color: V.muted, margin: "0 0 12px" }}>{t("Basic or repeated words — try these stronger alternatives:", "Oddiy yoki takror so'zlar — kuchliroq variantlar:")}</p>
                {result.synonyms.map((s, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: V.text }}>{s.word}</span><span style={{ color: V.muted }}> → </span>
                    {(s.alts || []).map((a, j) => <span key={j} style={{ display: "inline-block", fontSize: 13, color: V.good, fontWeight: 700, background: "rgba(47,185,138,0.10)", padding: "3px 10px", borderRadius: 999, margin: "0 6px 6px 0" }}>{a}</span>)}
                  </div>
                ))}
              </Section>
            )}

            <Section title={t("Improved version", "Yaxshilangan variant")} open={open.improved} onToggle={() => toggle("improved")} accent={V.good} delay={160}>
              {!improved && <button onClick={improveEssay} disabled={improveLoading} style={btn({ background: V.good, color: "#fff", padding: "12px 19px", borderRadius: 11, fontSize: 14 })}>{improveLoading ? t("Rewriting…", "Qayta yozilmoqda…") : t(`Rewrite at band ${Number(targetBand).toFixed(1)} →`, `Band ${Number(targetBand).toFixed(1)} darajada qayta yozish →`)}</button>}
              {improved && (<div className="sel"><p style={{ fontSize: 14.5, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", color: V.text }}>{improved.improved}</p>{improved.changes && improved.changes.length > 0 && <ul style={{ margin: "12px 0 0", paddingLeft: 18, fontSize: 12.5, color: V.muted, lineHeight: 1.6 }}>{improved.changes.map((c, i) => <li key={i}>{c}</li>)}</ul>}</div>)}
            </Section>

            <Section title={t("Model answer", "Namuna javob")} open={open.model} onToggle={() => toggle("model")} accent={V.accent} delay={200}>
              {!modelText && <button onClick={showModel} disabled={modelLoading} style={btn({ background: V.text, color: V.bg, padding: "12px 19px", borderRadius: 11, fontSize: 14 })}>{modelLoading ? t("Loading…", "Yuklanmoqda…") : t("Show band-9 answer →", "Band-9 namuna →")}</button>}
              {modelText && <div className="sel"><p style={{ fontSize: 14.5, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", color: V.text }}>{modelText}</p></div>}
            </Section>

            <p style={{ textAlign: "center", fontSize: 12, color: V.faint, marginTop: 8 }}>{t("Tip: select any text above to add it to your vocab.", "Maslahat: yuqoridagi istalgan matnni belgilab lug'atingizga qo'shing.")}</p>
          </>
        )}

        {/* ============ VOCAB ============ */}
        {tab === "vocab" && pMode === "config" && (
          <div className="anim" style={{ maxWidth: 460, margin: "20px auto" }}>
            <h3 style={{ fontFamily: serif, fontSize: 22, color: V.text, textAlign: "center", margin: "0 0 4px" }}>🎴 {t("Flashcards", "Kartochka mashqi")}</h3>
            <p style={{ textAlign: "center", color: V.muted, fontSize: 13, margin: "0 0 18px" }}>{t("Choose which words to practise", "Qaysi so'zlarni mashq qilamiz")}</p>
            {[["mine", t("My vocab only", "Faqat mening lug'atim"), myVocab.length], ["topics", t("Topic words", "Mavzuli so'zlar"), Object.values(VOCAB).reduce((n, a) => n + a.length, 0)], ["both", t("Both mixed", "Ikkalasi aralash"), null]].map(([k, l, n]) => (
              <button key={k} onClick={() => setPSource(k)} style={btn({ width: "100%", textAlign: "left", padding: "15px 17px", borderRadius: 14, marginBottom: 10, border: `1px solid ${pSource === k ? "var(--accent)" : V.border}`, background: pSource === k ? V.accentSoft : V.surface, color: V.text, fontSize: 14, display: "flex", justifyContent: "space-between" })}><span>{l}</span>{n != null && <span style={{ color: V.muted, fontSize: 13 }}>{n}</span>}</button>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => setPMode(null)} style={btn({ flex: 1, padding: "13px", borderRadius: 11, background: V.surface, border: `1px solid ${V.border}`, color: V.muted, fontSize: 14 })}>{t("Cancel", "Bekor")}</button>
              <button onClick={() => startPractice(pSource)} style={btn({ flex: 2, padding: "13px", borderRadius: 11, background: GRAD, color: "#fff", fontSize: 14, boxShadow: "0 8px 20px rgba(255,106,77,0.3)" })}>{t("Start →", "Boshlash →")}</button>
            </div>
            {pSource !== "topics" && myVocab.length === 0 && <p style={{ textAlign: "center", color: V.accent2, fontSize: 12, marginTop: 12 }}>{t("Your vocab is empty — add words or pick Topic words.", "Lug'atingiz bo'sh — so'z qo'shing yoki mavzuli so'zlarni tanlang.")}</p>}
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
                <button onClick={() => setPMode(null)} style={btn({ background: "transparent", color: V.muted, fontSize: 13 })}>✕ {t("Quit", "Chiqish")}</button>
                <span style={{ fontSize: 13, color: V.muted, fontWeight: 700 }}>{pIdx + 1} / {pDeck.length}</span>
                <span style={{ fontSize: 13, color: V.good, fontWeight: 700 }}>✓ {pKnown}</span>
              </div>
              <div style={{ height: 5, background: V.track, borderRadius: 999, marginBottom: 18, overflow: "hidden" }}><div style={{ height: "100%", width: `${(pIdx / pDeck.length) * 100}%`, background: GRAD, transition: "width .3s", borderRadius: 999 }} /></div>
              <div style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 20, padding: "38px 26px", minHeight: 210, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", boxShadow: V.shadow }}>
                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: V.accent, fontWeight: 800, marginBottom: 12 }}>{frontLabel}</span>
                <span style={{ fontFamily: serif, fontSize: front.length > 22 ? 19 : 26, color: V.text, lineHeight: 1.35 }}>{front}</span>
                {pReveal && (
                  <div className="anim" style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${V.border}`, width: "100%" }}>
                    <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: V.good, fontWeight: 800 }}>{backLabel}</span>
                    <div style={{ fontFamily: serif, fontSize: back.length > 22 ? 18 : 23, color: V.text, marginTop: 8, lineHeight: 1.35 }}>{back}</div>
                  </div>
                )}
              </div>
              {!pReveal ? (
                <button onClick={() => { if (!isW2M && mLoading) return; setPReveal(true); if (card.meaning == null) fetchMeaning(card.word); }} style={btn({ width: "100%", marginTop: 16, padding: "15px", borderRadius: 13, background: V.text, color: V.bg, fontSize: 15 })}>{t("Show answer", "Javobni ko'rsat")}</button>
              ) : (
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button onClick={() => gradeCard(false)} style={btn({ flex: 1, padding: "15px", borderRadius: 13, background: V.surface, border: `1px solid ${V.border}`, color: V.muted, fontSize: 14 })}>↻ {t("Again", "Yana")}</button>
                  <button onClick={() => gradeCard(true)} style={btn({ flex: 1, padding: "15px", borderRadius: 13, background: V.good, color: "#fff", fontSize: 14 })}>✓ {t("Got it", "Bildim")}</button>
                </div>
              )}
            </div>
          );
        })()}

        {tab === "vocab" && pMode === "done" && (
          <div className="anim" style={{ maxWidth: 460, margin: "30px auto", textAlign: "center" }}>
            <div style={{ fontSize: 46, marginBottom: 8 }}>{pKnown === pTotal ? "🏆" : pKnown >= pTotal * 0.7 ? "🎉" : "💪"}</div>
            <h3 style={{ fontFamily: serif, fontSize: 24, color: V.text, margin: "0 0 6px" }}>{t("Practice complete!", "Mashq tugadi!")}</h3>
            <p style={{ fontSize: 16, color: V.muted, margin: "0 0 22px" }}>{t(`You knew ${pKnown} of ${pTotal} words`, `${pTotal} ta so'zdan ${pKnown} tasini bildingiz`)}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setPMode(null)} style={btn({ padding: "13px 23px", borderRadius: 11, background: V.surface, border: `1px solid ${V.border}`, color: V.muted, fontSize: 14 })}>{t("Done", "Tayyor")}</button>
              <button onClick={() => startPractice(pSource)} style={btn({ padding: "13px 23px", borderRadius: 11, background: GRAD, color: "#fff", fontSize: 14, boxShadow: "0 8px 20px rgba(255,106,77,0.3)" })}>↻ {t("Practice again", "Yana mashq")}</button>
            </div>
          </div>
        )}

        {tab === "vocab" && !pMode && vcOpen && (
          <VocabChallenge
            lang={lang}
            session={session}
            displayName={(profile && profile.full_name) || (session && session.user && session.user.email ? session.user.email.split("@")[0] : t("Player", "O'yinchi"))}
            myLevel={(profile && profile.level) || "Not sure"}
            joinRoomId={vcJoinRoom}
            initialView={vcInitialView}
            onExit={() => { setVcOpen(false); setVcJoinRoom(null); setVcInitialView("entry"); }}
          />
        )}

        {tab === "vocab" && !pMode && !vcOpen && (
          <div className="anim">
            <div className="work-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <button onClick={() => { if (!hasSupabase || !session) return; setVcInitialView("entry"); setVcOpen(true); }} disabled={hasSupabase && !session}
                style={btn({ position: "relative", padding: "15px", borderRadius: 16, background: GRAD, color: "#fff", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 10px 26px rgba(109,79,224,0.3)", opacity: hasSupabase && !session ? 0.6 : 1 })}>
                ⚔️ {t("Vocab Challenge", "Lug'at bellashuvi")}<span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 99 }}>LIVE</span>
                {vcInviteCount > 0 && (
                  <span style={{ position: "absolute", top: -6, right: -6, minWidth: 20, height: 20, padding: "0 5px", borderRadius: 99, background: "var(--bad)", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--app-bg)" }}>
                    {vcInviteCount}
                  </span>
                )}
              </button>
              <button onClick={() => setPMode("config")} style={btn({ padding: "15px", borderRadius: 16, background: V.promptBg, color: V.promptText, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: V.shadow })}>🎴 {t("Practice flashcards", "Kartochka mashqi")}</button>
            </div>
            <div style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 18, padding: 17, marginBottom: 18, boxShadow: "0 6px 22px rgba(42,33,30,0.05)" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={vq} onChange={(e) => setVq(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") searchVocab(); }} placeholder={t("Search any English word…", "Istalgan inglizcha so'zni qidiring…")} style={{ flex: 1, padding: "12px 15px", border: `1px solid ${V.border}`, borderRadius: 11, fontSize: 15, outline: "none", color: V.text, background: V.surface }} />
                <button onClick={searchVocab} disabled={vLoad} style={btn({ background: GRAD, color: "#fff", padding: "12px 19px", borderRadius: 11, fontSize: 14, boxShadow: "0 6px 16px rgba(255,106,77,0.3)" })}>{vLoad ? "…" : t("Search", "Qidir")}</button>
              </div>
              {vRes && (<div className="anim" style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${V.border}` }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span style={{ fontFamily: serif, fontSize: 19, color: V.text }}>{vRes.word}</span><button onMouseDown={(e) => { e.preventDefault(); addVocab(vRes.word); }} style={btn({ background: V.text, color: V.bg, padding: "7px 13px", borderRadius: 9, fontSize: 12 })}>＋ {t("Save", "Saqlash")}</button></div><ExplainCard data={vRes.data} lang={lang} /></div>)}
            </div>
            {myVocab.length > 0 && (
              <div style={{ background: V.surface, border: `1px solid var(--accent)`, borderRadius: 18, padding: 19, marginBottom: 20, boxShadow: "0 6px 22px rgba(42,33,30,0.05)" }}>
                <h3 style={{ fontFamily: serif, fontSize: 17, margin: "0 0 12px", color: V.text }}>★ {t("My vocab", "Mening lug'atim")} ({myVocab.length})</h3>
                {myVocab.map((v, i) => (<div key={i} style={{ borderBottom: `1px solid ${V.border2}`, padding: "9px 0" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontWeight: 700, fontSize: 14, color: V.text, flex: 1 }}>{v.word}</span><button onClick={() => explainWord(v.word)} style={btn({ background: "transparent", color: V.accent, fontSize: 12 })}>{vMeaning[v.word] === "loading" ? "…" : t("Explain", "Izoh")}</button><button onClick={() => deleteVocab(v, i)} style={btn({ background: "transparent", color: V.bad, fontSize: 13 })}>✕</button></div>{vMeaning[v.word] && vMeaning[v.word] !== "loading" && <div style={{ marginTop: 4 }}><ExplainCard data={vMeaning[v.word]} lang={lang} /></div>}</div>))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>{Object.keys(VOCAB).map((topic) => (<button key={topic} onClick={() => { setVocabTopic(topic); setFlipped(-1); }} style={chip(vocabTopic === topic)}>{topic}</button>))}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>{VOCAB[vocabTopic].map((v, i) => (<div key={i} className="anim" onClick={() => setFlipped(flipped === i ? -1 : i)} style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 16, padding: 19, cursor: "pointer", minHeight: 122, animationDelay: `${i * 40}ms`, boxShadow: "0 6px 22px rgba(42,33,30,0.05)" }}><div style={{ fontFamily: serif, fontSize: 18, color: V.text }}>{v.word}</div><div style={{ fontSize: 12.5, color: V.muted, marginTop: 4 }}>{v.meaning}</div>{flipped === i ? <div style={{ fontSize: 13.5, color: V.good, marginTop: 12, lineHeight: 1.5, fontStyle: "italic" }}>"{v.ex}"</div> : <div style={{ fontSize: 11, color: V.accent, marginTop: 12, fontWeight: 700 }}>{t("Tap for example", "Misol uchun bosing")}</div>}</div>))}</div>
          </div>
        )}

        {/* ============ SPEAKING ============ */}
        {tab === "speaking" && (
          <Speaking lang={lang} accessCode={accessCode} accessToken={hasSupabase && session ? session.access_token : null} onNeedCode={() => setShowGate(true)} onLimitReached={(info) => setUpgradeInfo(info)}
            onSave={async (r, transcript, setName, recUrl) => {
              const item = { id: Date.now(), date: new Date().toISOString(), taskType: "spk", taskLabel: "Speaking", qType: setName, qText: "Speaking mock (Parts 1-3)", essay: transcript, words: countWords(transcript), overall: r.overall, tr: r.fc.band, cc: null, lr: r.lr.band, gra: r.gra.band, audioUrl: recUrl || null, errors: r.errors || [] };
              if (hasSupabase && session) {
                const row = { user_id: session.user.id, task_type: "spk", task_label: "Speaking", q_type: setName, q_text: "Speaking mock (Parts 1-3)", essay: transcript, words: item.words, overall: r.overall, tr: r.fc.band, cc: null, lr: r.lr.band, gra: r.gra.band, audio_url: recUrl || null, errors: r.errors || [] };
                const { data, error } = await supabase.from("history").insert(row).select().single();
                if (!error && data) setHistory((h) => [rowToItem(data), ...h].slice(0, 50));
                else setHistory((h) => [item, ...h].slice(0, 50));
              } else {
                setHistory((h) => { const next = [item, ...h].slice(0, 50); try { localStorage.setItem(HIST_KEY, JSON.stringify(next)); } catch (e) {} return next; });
              }
            }} />
        )}

        {/* ============ READING ============ */}
        {tab === "reading" && (
          <Reading lang={lang}
            onSave={(r, kind) => {
              const item = { id: Date.now(), date: new Date().toISOString(), taskType: "reading", taskLabel: "Reading", qType: r.setName, qText: t("Reading practice", "O'qish mashqi"), essay: t(`Score: ${r.raw}/${r.total} (est. ${r.scaled}/40)`, `Natija: ${r.raw}/${r.total} (taxminan ${r.scaled}/40)`), words: 0, overall: r.band, tr: null, cc: null, lr: null, gra: null, errors: [] };
              if (hasSupabase && session) {
                const row = { user_id: session.user.id, task_type: "reading", task_label: "Reading", q_type: r.setName, q_text: item.qText, essay: item.essay, words: 0, overall: r.band, tr: null, cc: null, lr: null, gra: null, errors: [] };
                supabase.from("history").insert(row).select().single().then(({ data, error }) => {
                  if (!error && data) setHistory((h) => [rowToItem(data), ...h].slice(0, 50));
                  else setHistory((h) => [item, ...h].slice(0, 50));
                });
              } else {
                setHistory((h) => { const next = [item, ...h].slice(0, 50); try { localStorage.setItem(HIST_KEY, JSON.stringify(next)); } catch (e) {} return next; });
              }
            }} />
        )}

        {/* ============ LISTENING ============ */}
        {tab === "listening" && (
          <Listening lang={lang}
            onSave={(r, kind) => {
              const item = { id: Date.now(), date: new Date().toISOString(), taskType: "listening", taskLabel: "Listening", qType: r.setName, qText: t("Listening practice", "Tinglash mashqi"), essay: t(`Score: ${r.raw}/${r.total} (est. ${r.scaled}/40)`, `Natija: ${r.raw}/${r.total} (taxminan ${r.scaled}/40)`), words: 0, overall: r.band, tr: null, cc: null, lr: null, gra: null, errors: [] };
              if (hasSupabase && session) {
                const row = { user_id: session.user.id, task_type: "listening", task_label: "Listening", q_type: r.setName, q_text: item.qText, essay: item.essay, words: 0, overall: r.band, tr: null, cc: null, lr: null, gra: null, errors: [] };
                supabase.from("history").insert(row).select().single().then(({ data, error }) => {
                  if (!error && data) setHistory((h) => [rowToItem(data), ...h].slice(0, 50));
                  else setHistory((h) => [item, ...h].slice(0, 50));
                });
              } else {
                setHistory((h) => { const next = [item, ...h].slice(0, 50); try { localStorage.setItem(HIST_KEY, JSON.stringify(next)); } catch (e) {} return next; });
              }
            }} />
        )}

        {/* ============ HISTORY ============ */}
        {tab === "history" && (() => {
          const histShown = history.filter((h) => {
            if (histTab === "speaking") return h.taskType === "spk";
            if (histTab === "reading") return h.taskType === "reading";
            if (histTab === "listening") return h.taskType === "listening";
            return h.taskType !== "spk" && h.taskType !== "reading" && h.taskType !== "listening";
          });
          const emptyMsg = { speaking: t("No speaking sessions yet.", "Hali speaking sessiyasi yo'q."), reading: t("No reading practice yet.", "Hali o'qish mashqi yo'q."), listening: t("No listening practice yet.", "Hali tinglash mashqi yo'q."), writing: t("No essays scored yet.", "Hali baholangan essay yo'q.") }[histTab];
          return (
            <div className="anim">
              {/* Writing / Speaking / Reading / Listening toggle */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16, background: V.surface2, borderRadius: 12, padding: 4, width: "fit-content", flexWrap: "wrap" }}>
                <button onClick={() => setHistTab("writing")} style={tpill(histTab === "writing")}>{t("Writing", "Yozish")}</button>
                <button onClick={() => setHistTab("speaking")} style={tpill(histTab === "speaking")}>{t("Speaking", "Speaking")}</button>
                <button onClick={() => setHistTab("reading")} style={tpill(histTab === "reading")}>{t("Reading", "O'qish")}</button>
                <button onClick={() => setHistTab("listening")} style={tpill(histTab === "listening")}>{t("Listening", "Tinglash")}</button>
              </div>
              {histShown.length === 0 && <div style={{ background: V.surface, border: `1px dashed ${V.border}`, borderRadius: 18, padding: 32, textAlign: "center", color: V.muted }}><p style={{ fontSize: 14, margin: 0 }}>{emptyMsg}</p></div>}
              {histShown.length >= 2 && (<div style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 18, padding: 19, marginBottom: 16, boxShadow: "0 6px 22px rgba(42,33,30,0.05)" }}><div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: V.muted, fontWeight: 700, marginBottom: 10 }}>{t("Band trend (oldest → newest)", "Band o'zgarishi (eski → yangi)")}</div><Trend data={[...histShown].reverse().map((h) => h.overall)} /></div>)}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {histShown.map((h) => (
                  <div key={h.id} style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 6px 22px rgba(42,33,30,0.05)" }}>
                    <div onClick={() => setExpanded(expanded === h.id ? -1 : h.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: 17, cursor: "pointer" }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: V.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontFamily: serif, fontSize: 21, color: bandColor(h.overall) }}>{Number(h.overall).toFixed(1)}</span></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: V.text }}>{h.taskType === "spk" ? t("Speaking", "Speaking") + " · " + h.qType : (h.taskType === "reading" || h.taskType === "listening") ? (h.taskLabel + " · " + h.qType) : (h.taskLabel || "Task 2") + " · " + h.qType + " · " + h.words + " " + t("words", "so'z")}</div>
                        <div style={{ fontSize: 12, color: V.faint }}>{new Date(h.date).toLocaleString()}</div>
                      </div>
                      <button onClick={(ev) => { ev.stopPropagation(); deleteAttempt(h.id); }} style={btn({ background: "transparent", color: V.bad, fontSize: 13 })}>✕</button>
                    </div>
                    {expanded === h.id && h.taskType === "spk" && (
                      <div style={{ padding: "0 17px 17px", borderTop: `1px solid ${V.border2}` }}>
                        <div style={{ display: "flex", gap: 16, margin: "12px 0", fontSize: 12, color: V.muted }}><span>FC {h.tr}</span><span>LR {h.lr}</span><span>GRA {h.gra}</span></div>
                        <div style={{ fontSize: 13.5, color: V.text, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{h.essay}</div>
                        {h.audioUrl && <audio controls src={h.audioUrl} style={{ width: "100%", marginTop: 12, borderRadius: 8 }} />}
                      </div>
                    )}
                    {expanded === h.id && (h.taskType === "reading" || h.taskType === "listening") && (
                      <div style={{ padding: "0 17px 17px", borderTop: `1px solid ${V.border2}` }}>
                        <p style={{ fontSize: 13.5, color: V.text, lineHeight: 1.6, margin: "12px 0 0" }}>{h.essay}</p>
                      </div>
                    )}
                    {expanded === h.id && h.taskType !== "spk" && h.taskType !== "reading" && h.taskType !== "listening" && (
                      <div style={{ padding: "0 17px 17px", borderTop: `1px solid ${V.border2}` }}>
                        <div style={{ display: "flex", gap: 16, margin: "12px 0", fontSize: 12, color: V.muted }}><span>TR/TA {h.tr}</span><span>CC {h.cc}</span><span>LR {h.lr}</span><span>GRA {h.gra}</span></div>
                        <p style={{ fontSize: 13, color: V.text, fontStyle: "italic", margin: "0 0 8px" }}>{h.qText}</p>
                        <p style={{ fontSize: 13.5, color: V.text, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{h.essay}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ============ PROFILE ============ */}
        {tab === "profile" && !profMode && (
          <div className="anim" style={{ maxWidth: 560, margin: "0 auto" }}>
            <div style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 20, padding: 22, boxShadow: V.shadow, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: serif, fontSize: 24, flexShrink: 0 }}>
                  {((profile && profile.full_name) || (session && session.user && session.user.email) || "?").trim().charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontWeight: 800, fontSize: 17, color: V.text }}>{(profile && profile.full_name) || t("(no name)", "(ismsiz)")}</div>
                  <div style={{ fontSize: 13, color: V.muted, marginTop: 2 }}>{session && session.user && session.user.email}</div>
                  <span style={{ display: "inline-block", marginTop: 8, fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", padding: "3px 10px", borderRadius: 999, background: V.surface2, color: V.muted }}>{t("Free plan", "Bepul reja")}</span>
                </div>
                {!profEdit && <button onClick={startProfEdit} style={btn({ background: V.surface2, border: `1px solid ${V.border}`, color: V.text, padding: "9px 15px", borderRadius: 10, fontSize: 13 })}>{t("Edit", "Tahrir")}</button>}
              </div>

              {profEdit && (
                <div className="anim" style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${V.border2}`, display: "flex", flexDirection: "column", gap: 10 }}>
                  <input value={profForm.full_name} onChange={(e) => setProfForm((f) => ({ ...f, full_name: e.target.value }))} placeholder={t("Full name", "To'liq ism")} style={{ padding: "11px 13px", border: `1px solid ${V.border}`, borderRadius: 10, fontSize: 14, background: V.surface, color: V.text, outline: "none" }} />
                  <input value={profForm.phone} onChange={(e) => setProfForm((f) => ({ ...f, phone: e.target.value }))} placeholder={t("Phone", "Telefon")} style={{ padding: "11px 13px", border: `1px solid ${V.border}`, borderRadius: 10, fontSize: 14, background: V.surface, color: V.text, outline: "none" }} />
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <select value={profForm.level} onChange={(e) => setProfForm((f) => ({ ...f, level: e.target.value }))} style={{ flex: 1, minWidth: 140, padding: "11px 13px", border: `1px solid ${V.border}`, borderRadius: 10, fontSize: 14, background: V.surface, color: V.text }}>
                      <option value="">{t("Current level", "Hozirgi daraja")}</option>
                      {PROFILE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <select value={profForm.target} onChange={(e) => setProfForm((f) => ({ ...f, target: e.target.value }))} style={{ flex: 1, minWidth: 140, padding: "11px 13px", border: `1px solid ${V.border}`, borderRadius: 10, fontSize: 14, background: V.surface, color: V.text }}>
                      <option value="">{t("Target band", "Maqsad band")}</option>
                      {PROFILE_TARGETS.map((b) => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <button onClick={() => setProfEdit(false)} style={btn({ flex: 1, background: V.surface, border: `1px solid ${V.border}`, color: V.muted, padding: "11px", borderRadius: 10, fontSize: 13.5 })}>{t("Cancel", "Bekor")}</button>
                    <button onClick={saveProfile} style={btn({ flex: 1, background: GRAD, color: "#fff", padding: "11px", borderRadius: 10, fontSize: 13.5, boxShadow: "0 8px 20px rgba(255,106,77,0.3)" })}>{t("Save", "Saqlash")}</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                [t("Total essays", "Jami essay"), profStats.totalEssays],
                [t("Average band", "O'rtacha band"), profStats.avgBand != null ? profStats.avgBand.toFixed(1) : "—"],
                [t("Best band", "Eng yaxshi band"), profStats.bestBand != null ? profStats.bestBand.toFixed(1) : "—"],
                [t("Speaking sessions", "Speaking soni"), profStats.speakingCount],
              ].map((row, i) => (
                <div key={i} style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 16, padding: "16px 14px", textAlign: "center", boxShadow: "0 6px 22px rgba(42,33,30,0.05)" }}>
                  <div style={{ fontFamily: serif, fontSize: 24, color: V.text }}>{row[1]}</div>
                  <div style={{ fontSize: 11.5, color: V.muted, marginTop: 4, fontWeight: 700 }}>{row[0]}</div>
                </div>
              ))}
            </div>

            <div style={{ background: V.promptBg, color: V.promptText, borderRadius: 18, padding: "18px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, boxShadow: V.shadow }}>
              <div style={{ fontSize: 30 }}>🔥</div>
              <div>
                <div style={{ fontFamily: serif, fontSize: 22 }}>{profStats.streak} {t("day streak", "kunlik ketma-ketlik")}</div>
                <div style={{ fontSize: 12.5, opacity: 0.75, marginTop: 2 }}>{t("Keep practising daily to grow it.", "Ketma-ketlikni oshirish uchun har kuni mashq qiling.")}</div>
              </div>
            </div>

            {weakness.top.length > 0 && (
              <div style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 18, padding: "18px 20px", marginBottom: 16, boxShadow: "0 6px 22px rgba(42,33,30,0.05)" }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: V.muted, marginBottom: 4 }}>🧬 {t("Weakness DNA", "Xato DNK")}</div>
                <p style={{ fontSize: 12.5, color: V.muted, margin: "0 0 14px" }}>{t("Your most repeated mistake types, from all essays and speaking sessions.", "Barcha essay va speaking sessiyalaringizdagi eng ko'p takrorlangan xato turlari.")}</p>
                {weakness.top.map((pair, i) => {
                  const type = pair[0], count = pair[1];
                  const max = weakness.top[0][1];
                  const info = etype(type);
                  const pct = Math.max(12, Math.round((count / max) * 100));
                  return (
                    <div key={i} style={{ marginBottom: i === weakness.top.length - 1 ? 0 : 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 700, color: V.text, marginBottom: 4 }}>
                        <span>{info[lang]}</span>
                        <span style={{ color: info.c }}>×{count}</span>
                      </div>
                      <div style={{ height: 7, borderRadius: 100, background: V.track, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: pct + "%", borderRadius: 100, background: info.c }} />
                      </div>
                    </div>
                  );
                })}
                <button onClick={startGapZali} style={btn({ width: "100%", marginTop: 16, background: GRAD, color: "#fff", padding: "12px", borderRadius: 11, fontSize: 13.5, boxShadow: "0 8px 20px rgba(255,106,77,0.3)" })}>{t("Practise these weaknesses →", "Zaif tomonlar bo'yicha mashq qilish →")}</button>
              </div>
            )}

            <div style={{ background: V.surface, border: `1px dashed ${V.border}`, borderRadius: 16, padding: "18px 20px", marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>📁</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: V.text }}>{t("My questions", "Mening savollarim")}</div>
              <div style={{ fontSize: 12.5, color: V.muted, marginTop: 4 }}>{t("Coming soon: upload your own exam questions.", "Tez orada: o'zingizning savollaringizni yuklang.")}</div>
            </div>

            {hasSupabase && session && (
              <button onClick={() => { setTab("vocab"); setPMode(null); setVcInitialView("friends"); setVcOpen(true); }} style={btn({ width: "100%", marginBottom: 12, background: V.surface, border: `1px solid ${V.border}`, color: V.text, padding: "13px", borderRadius: 12, fontSize: 13.5, position: "relative" })}>
                👥 {t("My friends", "Mening do'stlarim")}
                {vcInviteCount > 0 && <span style={{ marginLeft: 8, display: "inline-flex", minWidth: 18, height: 18, padding: "0 5px", borderRadius: 99, background: "var(--bad)", color: "#fff", fontSize: 10.5, fontWeight: 800, alignItems: "center", justifyContent: "center" }}>{vcInviteCount}</span>}
              </button>
            )}
            {isAdmin && (
              <button onClick={() => setTab("admin")} style={btn({ width: "100%", marginBottom: 12, background: V.surface, border: `1px solid ${V.border}`, color: V.text, padding: "13px", borderRadius: 12, fontSize: 13.5 })}>🛠 {t("Open admin panel", "Admin panelni ochish")}</button>
            )}
            {hasSupabase && session && (
              <button onClick={logout} style={btn({ width: "100%", background: "transparent", color: V.bad, padding: "12px", borderRadius: 12, fontSize: 13.5, border: `1px solid ${V.border}` })}>{t("Log out", "Chiqish")}</button>
            )}
          </div>
        )}

        {/* ============ GAP ZALI (Sentence Gym) ============ */}
        {tab === "profile" && profMode === "gap-run" && gapDeck[gapIdx] && (
          <div className="anim" style={{ maxWidth: 520, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <button onClick={() => setProfMode(null)} style={btn({ background: "transparent", color: V.muted, fontSize: 13 })}>✕ {t("Quit", "Chiqish")}</button>
              <span style={{ fontSize: 13, color: V.muted, fontWeight: 700 }}>{gapIdx + 1} / {gapDeck.length}</span>
              <span style={{ fontSize: 13, color: V.good, fontWeight: 700 }}>✓ {gapGoodCount}</span>
            </div>
            <div style={{ background: V.promptBg, color: V.promptText, borderRadius: 18, padding: 20, marginBottom: 14, boxShadow: V.shadow }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", marginBottom: 8 }}>
                {etype(gapDeck[gapIdx].type)[lang]} {t("issue", "muammosi")}
              </div>
              <p style={{ fontSize: 15.5, lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>"{gapDeck[gapIdx].sentence}"</p>
              {gapDeck[gapIdx].rule && <p style={{ fontSize: 12.5, opacity: .7, margin: "10px 0 0" }}>💡 {gapDeck[gapIdx].rule}</p>}
            </div>
            <p style={{ fontSize: 13, color: V.muted, margin: "0 0 8px" }}>{t(`Rewrite this at band ${Number(targetBand).toFixed(1)}:`, `Buni band ${Number(targetBand).toFixed(1)} darajasida qayta yozing:`)}</p>
            <textarea value={gapAnswer} onChange={(e) => setGapAnswer(e.target.value)} disabled={!!gapResult} placeholder={t("Type your improved version…", "Yaxshilangan variantingizni yozing…")} style={{ width: "100%", minHeight: 90, padding: "13px 15px", border: `1px solid ${V.border}`, borderRadius: 14, fontSize: 14.5, lineHeight: 1.6, color: V.text, outline: "none", resize: "vertical", background: V.surface }} />

            {!gapResult ? (
              <button onClick={submitGap} disabled={gapChecking || !gapAnswer.trim()} style={btn({ width: "100%", marginTop: 12, padding: "13px", borderRadius: 12, background: GRAD, color: "#fff", fontSize: 14, opacity: gapChecking ? .8 : 1, boxShadow: "0 8px 20px rgba(255,106,77,0.3)" })}>{gapChecking ? t("Checking…", "Tekshirilmoqda…") : t("Check my rewrite →", "Tekshirish →")}</button>
            ) : (
              <div className="anim" style={{ marginTop: 14 }}>
                <div style={{ background: gapResult.good ? "rgba(47,185,138,0.10)" : "rgba(255,106,77,0.10)", border: `1px solid ${gapResult.good ? "var(--good)" : "var(--accent)"}`, borderRadius: 14, padding: 15, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: gapResult.good ? V.good : V.accent, marginBottom: 4 }}>{gapResult.good ? "✓ " + t("Nice improvement!", "Yaxshi yaxshilanish!") : "→ " + t("Getting there", "Deyarli tayyor")}</div>
                  <p style={{ fontSize: 13.5, color: V.text, margin: 0, lineHeight: 1.55 }}>{gapResult.feedback}</p>
                </div>
                {gapResult.idealRewrite && (
                  <div style={{ background: V.surface2, borderRadius: 12, padding: 13, marginBottom: 14 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: .5, color: V.muted, marginBottom: 4 }}>{t("Model rewrite", "Namuna variant")}</div>
                    <p style={{ fontSize: 13.5, color: V.text, margin: 0, lineHeight: 1.5 }}>{gapResult.idealRewrite}</p>
                  </div>
                )}
                <button onClick={nextGap} style={btn({ width: "100%", padding: "13px", borderRadius: 12, background: V.text, color: V.bg, fontSize: 14 })}>{gapIdx + 1 >= gapDeck.length ? t("Finish →", "Tugatish →") : t("Next →", "Keyingisi →")}</button>
              </div>
            )}
          </div>
        )}

        {tab === "profile" && profMode === "gap-done" && (
          <div className="anim" style={{ maxWidth: 460, margin: "30px auto", textAlign: "center" }}>
            <div style={{ fontSize: 46, marginBottom: 8 }}>{gapGoodCount === gapDeck.length ? "🏆" : gapGoodCount >= gapDeck.length * 0.6 ? "🎉" : "💪"}</div>
            <h3 style={{ fontFamily: serif, fontSize: 24, color: V.text, margin: "0 0 6px" }}>{t("Gap Gym complete!", "Gap zali tugadi!")}</h3>
            <p style={{ fontSize: 16, color: V.muted, margin: "0 0 22px" }}>{t(`${gapGoodCount} of ${gapDeck.length} rewrites were a real improvement`, `${gapDeck.length} tadan ${gapGoodCount} tasi haqiqiy yaxshilanish bo'ldi`)}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setProfMode(null)} style={btn({ padding: "13px 23px", borderRadius: 11, background: V.surface, border: `1px solid ${V.border}`, color: V.muted, fontSize: 14 })}>{t("Done", "Tayyor")}</button>
              <button onClick={startGapZali} style={btn({ padding: "13px 23px", borderRadius: 11, background: GRAD, color: "#fff", fontSize: 14, boxShadow: "0 8px 20px rgba(255,106,77,0.3)" })}>↻ {t("Practise again", "Yana mashq")}</button>
            </div>
          </div>
        )}

        {/* ============ ADMIN ============ */}
        {tab === "admin" && isAdmin && (
          <div className="anim">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <h3 style={{ fontFamily: serif, fontSize: 19, color: V.text, margin: 0 }}>👥 {t("All users", "Barcha foydalanuvchilar")} {adminUsers ? `(${adminUsers.length})` : ""}</h3>
              <button onClick={() => { setAdminUsers(null); loadAdmin(); }} style={btn({ background: V.surface, border: `1px solid ${V.border}`, color: V.muted, padding: "8px 13px", borderRadius: 9, fontSize: 12 })}>↻ {t("Refresh", "Yangilash")}</button>
            </div>
            {adminUsers === null && <div style={{ textAlign: "center", color: V.muted, padding: 30 }}>…</div>}
            {adminUsers && adminUsers.length === 0 && <div style={{ background: V.surface, border: `1px dashed ${V.border}`, borderRadius: 18, padding: 30, textAlign: "center", color: V.muted }}>{t("No users yet.", "Hali foydalanuvchi yo'q.")}</div>}
            {adminUsers && adminUsers.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {adminUsers.map((u) => {
                  const isPro = u.plan === "pro" && (!u.plan_expires || new Date(u.plan_expires) > new Date());
                  async function togglePlan() {
                    const newPlan = isPro ? "free" : "pro";
                    const expires = newPlan === "pro" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;
                    await supabase.from("profiles").update({ plan: newPlan, plan_expires: expires }).eq("user_id", u.user_id);
                    setAdminUsers((list) => list.map((x) => x.user_id === u.user_id ? { ...x, plan: newPlan, plan_expires: expires } : x));
                  }
                  return (
                    <div key={u.user_id} style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 18, padding: 17, boxShadow: "0 6px 22px rgba(42,33,30,0.05)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, fontSize: 15, color: V.text }}>{u.full_name || t("(no name)", "(ismsiz)")}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {u.target != null && <span style={{ fontSize: 12, color: V.accent, fontWeight: 800 }}>🎯 {Number(u.target).toFixed(1)}</span>}
                          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: .5, textTransform: "uppercase", padding: "3px 9px", borderRadius: 999, background: isPro ? "rgba(47,185,138,0.15)" : V.surface2, color: isPro ? V.good : V.muted }}>{isPro ? "PRO" : "FREE"}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 6, fontSize: 12.5, color: V.muted }}>
                        {u.phone && <span>📞 {u.phone}</span>}
                        {u.email && <span>✉ {u.email}</span>}
                        {u.level && <span>📊 {u.level}</span>}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <div style={{ fontSize: 11, color: V.faint }}>{t("Joined", "Qo'shilgan")}: {new Date(u.created_at).toLocaleString()}</div>
                        <button onClick={togglePlan} style={btn({ background: isPro ? V.surface2 : GRAD, color: isPro ? V.text : "#fff", padding: "6px 13px", borderRadius: 8, fontSize: 11.5, border: isPro ? `1px solid ${V.border}` : "none" })}>{isPro ? t("Set Free", "Free qilish") : t("Set Pro (30d)", "Pro qilish (30 kun)")}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p style={{ textAlign: "center", color: V.faint, fontSize: 11, marginTop: 20 }}>{t("Visible to admins only.", "Faqat adminlarga ko'rinadi.")}</p>
          </div>
        )}

        <p style={{ textAlign: "center", color: V.faint, fontSize: 11, marginTop: 30 }}>{hasSupabase && session ? t("Signed in. Your history is saved to your account.", "Kirdingiz. Tarixingiz hisobingizga saqlanadi.") : t("Scores are AI estimates.", "Baholar AI taxminiy.")}</p>
      </div>

      {/* ===== BOTTOM NAVIGATION (mobile) ===== */}
      <nav className="bottom-nav">
        <button onClick={() => setTab("write")} className={"bn-btn" + (tab === "write" ? " active" : "")}>
          <NavIcon name="write" /><span>{t("Write", "Yozish")}</span>
        </button>
        <button onClick={() => setDrawerOpen(true)} className={"bn-btn" + (MOCK_TAB_KEYS.includes(tab) ? " active" : "")}>
          <NavIcon name="mock" /><span>{t("Mock", "Sinov")}</span>
        </button>
        <button onClick={() => setTab("vocab")} className={"bn-btn" + (tab === "vocab" ? " active" : "")}>
          <NavIcon name="vocab" /><span>{t("Vocab", "Lug'at")}</span>
        </button>
        <button onClick={() => setTab("history")} className={"bn-btn" + (tab === "history" ? " active" : "")}>
          <NavIcon name="history" /><span>{t("History", "Tarix")}</span>
        </button>
        <button onClick={() => setTab("profile")} className={"bn-btn" + (tab === "profile" ? " active" : "")}>
          <NavIcon name="profile" /><span>{t("Profile", "Profil")}</span>
        </button>
      </nav>
    </main>
  );
}
