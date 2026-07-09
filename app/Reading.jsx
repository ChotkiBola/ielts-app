"use client";

import React, { useState } from "react";
import ExamShell from "./ExamShell";
import { READING_SETS } from "./ReadingData";
import { readingBand } from "./examBands";

const V = {
  surface: "var(--surface)", text: "var(--text)", muted: "var(--muted)", border: "var(--border)",
};
const serif = "'DM Serif Display', serif";

export default function Reading(props) {
  var lang = props.lang, onSave = props.onSave;
  const t = (en, uz) => (lang === "uz" ? uz : en);
  const [idx, setIdx] = useState(0);
  const set = READING_SETS[idx];

  const leftPanel = (
    <div>
      <h3 style={{ fontFamily: serif, fontSize: 20, color: V.text, margin: "0 0 4px", textAlign: "center" }}>{set.title}</h3>
      <p style={{ fontSize: 11.5, color: V.muted, textAlign: "center", margin: "0 0 18px" }}>{t("Cambridge-style practice passage", "Cambridge uslubidagi mashq matni")}</p>
      {set.paragraphs.map((p, i) => (
        <p key={i} style={{ fontSize: 14.5, lineHeight: 1.75, color: V.text, marginBottom: 14, textAlign: "justify" }}>{p}</p>
      ))}
    </div>
  );

  return (
    <div className="anim">
      {READING_SETS.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {READING_SETS.map((s, i) => (
            <button key={s.id} onClick={() => setIdx(i)} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700, border: "1px solid " + (i === idx ? "var(--accent)" : V.border), background: i === idx ? "var(--accent-soft)" : V.surface, color: V.text, cursor: "pointer" }}>
              {s.title}
            </button>
          ))}
        </div>
      )}
      <ExamShell
        key={set.id}
        set={set}
        bandFn={readingBand}
        lang={lang}
        leftPanel={leftPanel}
        onFinish={(r) => { if (onSave) onSave(r, "reading"); }}
      />
    </div>
  );
}
