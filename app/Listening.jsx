"use client";

import React, { useState } from "react";
import ExamShell from "./ExamShell";
import { LISTENING_SETS } from "./ListeningData";
import { listeningBand } from "./examBands";

const V = {
  surface: "var(--surface)", surface2: "var(--surface-2)", text: "var(--text)", muted: "var(--muted)", faint: "var(--faint)", border: "var(--border)", accent: "var(--accent)",
};
const serif = "'DM Serif Display', serif";
const btn = (extra = {}) => ({ cursor: "pointer", border: "none", fontWeight: 700, fontFamily: "inherit", transition: "all .18s ease", ...extra });

export default function Listening(props) {
  var lang = props.lang, onSave = props.onSave;
  const t = (en, uz) => (lang === "uz" ? uz : en);
  const [idx, setIdx] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const set = LISTENING_SETS[idx];

  const leftPanel = (
    <div>
      <h3 style={{ fontFamily: serif, fontSize: 20, color: V.text, margin: "0 0 4px", textAlign: "center" }}>{set.title}</h3>
      <p style={{ fontSize: 11.5, color: V.muted, textAlign: "center", margin: "0 0 18px" }}>{t("Cambridge-style practice audio", "Cambridge uslubidagi mashq audiosi")}</p>

      {set.audioUrl ? (
        <audio controls src={set.audioUrl} style={{ width: "100%", marginBottom: 16, borderRadius: 8 }} />
      ) : (
        <div style={{ background: V.surface2, border: "1px dashed " + V.border, borderRadius: 14, padding: 18, textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>🎧</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: V.text }}>{t("Real audio coming soon", "Haqiqiy audio tez orada")}</div>
          <div style={{ fontSize: 12, color: V.muted, marginTop: 4 }}>{t("For now, practise by reading the transcript below.", "Hozircha pastdagi matnni o'qib mashq qiling.")}</div>
        </div>
      )}

      <button onClick={() => setShowTranscript((s) => !s)} style={btn({ background: "transparent", color: V.accent, fontSize: 12.5, marginBottom: 10, padding: 0, textDecoration: "underline" })}>
        {showTranscript ? t("Hide transcript", "Matnni yashirish") : t("Show transcript", "Matnni ko'rsatish")}
      </button>
      {showTranscript && (
        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.7, color: V.text, background: V.surface2, borderRadius: 12, padding: 14 }}>
          {set.transcript}
        </pre>
      )}
    </div>
  );

  return (
    <div className="anim">
      {LISTENING_SETS.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {LISTENING_SETS.map((s, i) => (
            <button key={s.id} onClick={() => { setIdx(i); setShowTranscript(false); }} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700, border: "1px solid " + (i === idx ? "var(--accent)" : V.border), background: i === idx ? "var(--accent-soft)" : V.surface, color: V.text, cursor: "pointer" }}>
              {s.title}
            </button>
          ))}
        </div>
      )}
      <ExamShell
        key={set.id}
        set={set}
        bandFn={listeningBand}
        lang={lang}
        leftPanel={leftPanel}
        onFinish={(r) => { if (onSave) onSave(r, "listening"); }}
      />
    </div>
  );
}
