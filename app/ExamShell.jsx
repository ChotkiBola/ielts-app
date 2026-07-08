"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { QuestionGroup, isItemCorrect } from "./QuestionTypes";
import { scaleTo40 } from "./examBands";

const V = {
  surface: "var(--surface)", surface2: "var(--surface-2)", text: "var(--text)", muted: "var(--muted)",
  faint: "var(--faint)", border: "var(--border)", border2: "var(--border-2)", accent: "var(--accent)", accent2: "var(--accent2)",
  accentSoft: "var(--accent-soft)", good: "var(--good)", bad: "var(--bad)", shadow: "var(--shadow)",
  promptBg: "var(--prompt-bg)", promptText: "var(--prompt-text)", track: "var(--track)", bg: "var(--app-bg)",
};
const GRAD = "linear-gradient(120deg,var(--accent),var(--accent2))";
const serif = "'DM Serif Display', serif";
const btn = (extra = {}) => ({ cursor: "pointer", border: "none", fontWeight: 700, fontFamily: "inherit", transition: "all .18s ease", ...extra });

function fmt(s) { return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }
function bandColor(b) { if (b >= 7) return V.good; if (b >= 6) return "#7BAE4A"; if (b >= 5) return V.accent2; return V.bad; }

export default function ExamShell(props) {
  var set = props.set, bandFn = props.bandFn, lang = props.lang, leftPanel = props.leftPanel, onFinish = props.onFinish;
  const t = (en, uz) => (lang === "uz" ? uz : en);

  const allItems = useMemo(() => set.groups.flatMap((g) => g.items.map((it) => ({ ...it, groupType: g.type }))), [set]);
  const total = allItems.length;

  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(set.minutes * 60);
  const [running, setRunning] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setAnswers({}); setChecked(false); setSecondsLeft(set.minutes * 60); setRunning(false);
  }, [set]);

  useEffect(() => {
    if (!running || checked) return;
    if (secondsLeft <= 0) { setRunning(false); return; }
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running, secondsLeft, checked]);

  function setAnswer(num, val) { setAnswers((a) => ({ ...a, [num]: val })); }

  const answeredCount = Object.keys(answers).filter((k) => answers[k]).length;

  const result = useMemo(() => {
    if (!checked) return null;
    let raw = 0;
    allItems.forEach((it) => { if (isItemCorrect(it, answers[it.num])) raw++; });
    const scaled = scaleTo40(raw, total);
    const band = bandFn(scaled);
    return { raw, total, scaled, band };
  }, [checked]);

  function handleCheck() {
    setChecked(true);
    setRunning(false);
    let raw = 0;
    allItems.forEach((it) => { if (isItemCorrect(it, answers[it.num])) raw++; });
    const scaled = scaleTo40(raw, total);
    const band = bandFn(scaled);
    if (onFinish) onFinish({ raw, total, scaled, band, setName: set.title });
  }

  function jumpTo(num) {
    const el = document.getElementById("q-" + num);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="anim">
      <style>{`
        .exam-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .exam-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* status bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: V.surface, border: "1px solid " + V.border, borderRadius: 16, padding: "12px 16px", marginBottom: 14, flexWrap: "wrap", boxShadow: "0 6px 22px rgba(42,33,30,0.05)" }}>
        <span style={{ fontFamily: serif, fontSize: 22, color: secondsLeft < 120 ? V.bad : V.text, minWidth: 68 }}>{fmt(secondsLeft)}</span>
        {!checked && (
          <button onClick={() => setRunning((r) => !r)} style={btn({ background: running ? V.surface2 : GRAD, color: running ? V.text : "#fff", padding: "8px 16px", borderRadius: 10, fontSize: 13 })}>
            {running ? t("Pause", "Pauza") : t("Start", "Boshlash")}
          </button>
        )}
        <span style={{ fontFamily: serif, fontSize: 18, color: V.text, marginLeft: "auto" }}>{set.title}</span>
      </div>

      <div className="exam-grid">
        {/* left: passage or audio */}
        <div style={{ background: V.surface, border: "1px solid " + V.border, borderRadius: 18, padding: 20, boxShadow: "0 6px 22px rgba(42,33,30,0.05)", maxHeight: 640, overflowY: "auto" }}>
          {leftPanel}
        </div>

        {/* right: questions */}
        <div ref={scrollRef} style={{ background: V.surface, border: "1px solid " + V.border, borderRadius: 18, padding: 20, boxShadow: "0 6px 22px rgba(42,33,30,0.05)", maxHeight: 640, overflowY: "auto" }}>
          {set.groups.map((g) => (
            <QuestionGroup key={g.id} group={g} answers={answers} onChange={setAnswer} checked={checked} lang={lang} />
          ))}
        </div>
      </div>

      {/* question nav strip */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 16, background: V.surface, border: "1px solid " + V.border, borderRadius: 14, padding: 12 }}>
        {allItems.map((it) => {
          const answered = !!answers[it.num];
          const ok = checked ? isItemCorrect(it, answers[it.num]) : null;
          let bg = V.surface2, color = V.muted, border = V.border;
          if (checked) { bg = ok ? "rgba(47,185,138,0.15)" : "rgba(226,85,75,0.12)"; color = ok ? V.good : V.bad; border = ok ? V.good : V.bad; }
          else if (answered) { bg = V.accentSoft; color = V.accent; border = V.accent; }
          return (
            <button key={it.num} onClick={() => jumpTo(it.num)} style={btn({ width: 32, height: 32, borderRadius: 8, background: bg, color: color, border: "1px solid " + border, fontSize: 12.5 })}>
              {it.num}
            </button>
          );
        })}
        <span style={{ marginLeft: "auto", fontSize: 12.5, color: V.muted, fontWeight: 700, alignSelf: "center" }}>{answeredCount} / {total} {t("answered", "javob berildi")}</span>
      </div>

      {!checked ? (
        <button onClick={handleCheck} style={btn({ width: "100%", marginTop: 14, padding: "15px", borderRadius: 13, background: GRAD, color: "#fff", fontSize: 15, boxShadow: "0 10px 26px rgba(255,106,77,0.35)" })}>
          {t("Check answers →", "Javoblarni tekshirish →")}
        </button>
      ) : (
        <div className="anim" style={{ marginTop: 14, background: V.surface, border: "1px solid " + V.border, borderRadius: 18, padding: 20, boxShadow: V.shadow, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <div style={{ width: 66, height: 66, borderRadius: 18, background: V.accentSoft, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: serif, fontSize: 26, color: bandColor(result.band) }}>{result.band.toFixed(1)}</span>
            <span style={{ fontSize: 8, color: V.muted, textTransform: "uppercase", fontWeight: 700 }}>band</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: V.text }}>{result.raw} / {result.total} {t("correct", "to'g'ri")}</div>
            <div style={{ fontSize: 12.5, color: V.muted, marginTop: 2 }}>{t(`Estimated as ${result.scaled}/40 on a full test`, `To'liq testda taxminan ${result.scaled}/40`)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
