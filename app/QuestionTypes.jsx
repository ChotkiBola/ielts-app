"use client";

import React from "react";

// Design tokens (matches the rest of the app — CSS vars from globals.css)
const V = {
  surface: "var(--surface)", surface2: "var(--surface-2)", text: "var(--text)", muted: "var(--muted)",
  faint: "var(--faint)", border: "var(--border)", accent: "var(--accent)", accentSoft: "var(--accent-soft)",
  good: "var(--good)", bad: "var(--bad)", track: "var(--track)",
};
const serif = "'DM Serif Display', serif";

function Badge({ n }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 24, height: 24, padding: "0 6px", borderRadius: 7, border: "1px solid " + V.border, background: V.surface, fontWeight: 800, fontSize: 12.5, color: V.text, marginRight: 8 }}>
      {n}
    </span>
  );
}

function stateColor(state) {
  if (state === "correct") return V.good;
  if (state === "incorrect") return V.bad;
  return V.border;
}

function normalize(s) {
  return String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function isItemCorrect(item, value) {
  if (item.answers) return item.answers.some((a) => normalize(a) === normalize(value));
  return normalize(item.answer) === normalize(value);
}

// ---- Gap fill (text input inside a sentence, prompt uses {{blank}}) ----
export function GapFill({ item, value, onChange, checked }) {
  const parts = String(item.prompt).split("{{blank}}");
  const state = checked ? (isItemCorrect(item, value) ? "correct" : "incorrect") : null;
  return (
    <div id={"q-" + item.num} style={{ marginBottom: 16, scrollMarginTop: 90 }}>
      <div style={{ fontSize: 14.5, lineHeight: 1.7, color: V.text }}>
        <Badge n={item.num} />
        {parts[0]}
        <input
          value={value || ""}
          onChange={(e) => onChange(item.num, e.target.value)}
          disabled={checked}
          style={{
            display: "inline-block", minWidth: 130, margin: "0 4px", padding: "3px 9px",
            border: "1.5px solid " + stateColor(state), borderRadius: 8, fontSize: 14, fontWeight: 700,
            background: state === "correct" ? "rgba(47,185,138,0.08)" : state === "incorrect" ? "rgba(226,85,75,0.08)" : V.surface,
            color: V.text, outline: "none",
          }}
        />
        {parts[1]}
      </div>
      {checked && (
        <div style={{ fontSize: 12.5, marginTop: 4, color: state === "correct" ? V.good : V.bad, fontWeight: 700 }}>
          {state === "correct" ? "✓ " : "→ correct: "}{state !== "correct" ? (item.answers ? item.answers[0] : item.answer) : null}
        </div>
      )}
      {checked && item.explanation && <div style={{ fontSize: 12.5, color: V.muted, marginTop: 3 }}>💡 {item.explanation}</div>}
    </div>
  );
}

// ---- Matching (dropdown against a shared A/B/C legend) ----
export function MatchingLegend({ options }) {
  return (
    <div style={{ background: V.surface2, border: "1px solid " + V.border, borderRadius: 12, padding: 14, marginBottom: 14 }}>
      {options.map(([letter, text]) => (
        <div key={letter} style={{ fontSize: 13.5, color: V.text, marginBottom: 4 }}><b>{letter}</b>&nbsp; {text}</div>
      ))}
    </div>
  );
}
export function Matching({ item, options, value, onChange, checked }) {
  const state = checked ? (isItemCorrect(item, value) ? "correct" : "incorrect") : null;
  return (
    <div id={"q-" + item.num} style={{ marginBottom: 14, scrollMarginTop: 90 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Badge n={item.num} />
        <span style={{ fontSize: 14, color: V.text, flex: 1, minWidth: 160 }}>{item.prompt}</span>
        <select
          value={value || ""}
          onChange={(e) => onChange(item.num, e.target.value)}
          disabled={checked}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid " + stateColor(state), background: V.surface, color: V.text, fontWeight: 700, fontSize: 13.5 }}
        >
          <option value="">—</option>
          {options.map(([letter]) => <option key={letter} value={letter}>{letter}</option>)}
        </select>
      </div>
      {checked && state !== "correct" && <div style={{ fontSize: 12.5, marginTop: 3, color: V.bad, fontWeight: 700 }}>→ correct: {item.answer}</div>}
      {checked && item.explanation && <div style={{ fontSize: 12.5, color: V.muted, marginTop: 3 }}>💡 {item.explanation}</div>}
    </div>
  );
}

// ---- True / False / Not Given ----
export function TFNG({ item, value, onChange, checked, lang }) {
  const t = (en, uz) => (lang === "uz" ? uz : en);
  const opts = [["TRUE", t("TRUE", "TO'G'RI")], ["FALSE", t("FALSE", "NOTO'G'RI")], ["NOT GIVEN", t("NOT GIVEN", "BERILMAGAN")]];
  return (
    <div id={"q-" + item.num} style={{ marginBottom: 16, scrollMarginTop: 90 }}>
      <div style={{ fontSize: 14, color: V.text, marginBottom: 8 }}><Badge n={item.num} />{item.prompt}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: 32 }}>
        {opts.map(([val, label]) => {
          const active = value === val;
          const isCorrectOpt = checked && val === item.answer;
          const isWrongPick = checked && active && val !== item.answer;
          let bg = V.surface, border = V.border;
          if (isCorrectOpt) { bg = "rgba(47,185,138,0.12)"; border = V.good; }
          else if (isWrongPick) { bg = "rgba(226,85,75,0.10)"; border = V.bad; }
          else if (active) { bg = V.accentSoft; border = V.accent; }
          return (
            <button key={val} type="button" disabled={checked} onClick={() => onChange(item.num, val)}
              style={{ cursor: checked ? "default" : "pointer", border: "1.5px solid " + border, background: bg, color: V.text, borderRadius: 9, padding: "7px 13px", fontSize: 12.5, fontWeight: 700 }}>
              {label}
            </button>
          );
        })}
      </div>
      {checked && item.explanation && <div style={{ fontSize: 12.5, color: V.muted, marginTop: 6, marginLeft: 32 }}>💡 {item.explanation}</div>}
    </div>
  );
}

// ---- Multiple choice ----
export function MCQ({ item, value, onChange, checked }) {
  return (
    <div id={"q-" + item.num} style={{ marginBottom: 16, scrollMarginTop: 90 }}>
      <div style={{ fontSize: 14, color: V.text, marginBottom: 8 }}><Badge n={item.num} />{item.prompt}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 32 }}>
        {item.options.map(([letter, text]) => {
          const active = value === letter;
          const isCorrectOpt = checked && letter === item.answer;
          const isWrongPick = checked && active && letter !== item.answer;
          let bg = V.surface, border = V.border;
          if (isCorrectOpt) { bg = "rgba(47,185,138,0.12)"; border = V.good; }
          else if (isWrongPick) { bg = "rgba(226,85,75,0.10)"; border = V.bad; }
          else if (active) { bg = V.accentSoft; border = V.accent; }
          return (
            <button key={letter} type="button" disabled={checked} onClick={() => onChange(item.num, letter)}
              style={{ cursor: checked ? "default" : "pointer", textAlign: "left", border: "1.5px solid " + border, background: bg, color: V.text, borderRadius: 10, padding: "9px 13px", fontSize: 13.5 }}>
              <b>{letter}.</b> {text}
            </button>
          );
        })}
      </div>
      {checked && item.explanation && <div style={{ fontSize: 12.5, color: V.muted, marginTop: 6, marginLeft: 32 }}>💡 {item.explanation}</div>}
    </div>
  );
}

// Router: renders one question group (instruction + its items) by type.
export function QuestionGroup({ group, answers, onChange, checked, lang }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <h4 style={{ fontFamily: serif, fontSize: 15.5, color: V.text, margin: "0 0 6px" }}>
        {t_range(group.items)}
      </h4>
      <p style={{ fontSize: 12.5, color: V.muted, margin: "0 0 12px", fontStyle: "italic" }}>{group.instruction}</p>
      {group.type === "matching" && group.options && <MatchingLegend options={group.options} />}
      {group.items.map((item) => {
        const value = answers[item.num];
        if (group.type === "gapfill") return <GapFill key={item.num} item={item} value={value} onChange={onChange} checked={checked} />;
        if (group.type === "matching") return <Matching key={item.num} item={item} options={group.options} value={value} onChange={onChange} checked={checked} />;
        if (group.type === "tfng") return <TFNG key={item.num} item={item} value={value} onChange={onChange} checked={checked} lang={lang} />;
        if (group.type === "mcq") return <MCQ key={item.num} item={item} value={value} onChange={onChange} checked={checked} />;
        return null;
      })}
    </div>
  );
}
function t_range(items) {
  if (!items.length) return "";
  const nums = items.map((i) => i.num);
  const min = Math.min(...nums), max = Math.max(...nums);
  return min === max ? `Question ${min}` : `Questions ${min}–${max}`;
}
