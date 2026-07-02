"use client";

import React, { useState, useRef, useEffect } from "react";
import { SPEAKING } from "./data";

const V = {
  surface: "var(--surface)", surface2: "var(--surface-2)", text: "var(--text)", muted: "var(--muted)",
  faint: "var(--faint)", border: "var(--border)", accent: "var(--accent)", accentSoft: "var(--accent-soft)",
  good: "var(--good)", bad: "var(--bad)", shadow: "var(--shadow)", promptBg: "var(--prompt-bg)",
  promptText: "var(--prompt-text)", track: "var(--track)", bg: "var(--app-bg)",
};
const GRAD = "linear-gradient(120deg,var(--accent),var(--accent2))";
const serif = "'DM Serif Display', serif";
const btn = (extra = {}) => ({ cursor: "pointer", border: "none", fontWeight: 700, fontFamily: "inherit", transition: "all .18s ease", ...extra });
function bandColor(b) { if (b >= 7) return "var(--good)"; if (b >= 6) return "#7BAE4A"; if (b >= 5) return "var(--accent2)"; return "var(--bad)"; }

function floatTo16(f32) {
  const out = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) { const s = Math.max(-1, Math.min(1, f32[i])); out[i] = s < 0 ? s * 0x8000 : s * 0x7FFF; }
  return out;
}
function b64FromBytes(bytes) { let bin = ""; const u8 = new Uint8Array(bytes); for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]); return btoa(bin); }
function bytesFromB64(b64) { const bin = atob(b64); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return u8; }

export default function Speaking({ lang, accessCode, onNeedCode, onSave }) {
  const t = (en, uz) => (lang === "uz" ? uz : en);
  const [stage, setStage] = useState("idle"); // idle | connecting | live | scoring | done | error
  const [setIdx, setSetIdx] = useState(0);
  const [err, setErr] = useState("");
  const [lines, setLines] = useState([]); // {who:'ex'|'me', text}
  const [talking, setTalking] = useState(false); // examiner audio playing
  const [micOn, setMicOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);

  const wsRef = useRef(null);
  const micCtxRef = useRef(null);
  const micStreamRef = useRef(null);
  const procRef = useRef(null);
  const playCtxRef = useRef(null);
  const playTimeRef = useRef(0);
  const exBufRef = useRef("");
  const meBufRef = useRef("");
  const timerRef = useRef(null);
  const linesRef = useRef([]);

  useEffect(() => () => cleanup(), []);
  useEffect(() => { linesRef.current = lines; }, [lines]);

  function cleanup() {
    try { if (procRef.current) procRef.current.disconnect(); } catch (e) {}
    try { if (micStreamRef.current) micStreamRef.current.getTracks().forEach((tr) => tr.stop()); } catch (e) {}
    try { if (micCtxRef.current) micCtxRef.current.close(); } catch (e) {}
    try { if (playCtxRef.current) playCtxRef.current.close(); } catch (e) {}
    try { if (wsRef.current) wsRef.current.close(); } catch (e) {}
    if (timerRef.current) clearInterval(timerRef.current);
    procRef.current = micCtxRef.current = micStreamRef.current = playCtxRef.current = wsRef.current = null;
    setMicOn(false); setTalking(false);
  }

  function pushLine(who, text) {
    if (!text || !text.trim()) return;
    setLines((L) => {
      const last = L[L.length - 1];
      if (last && last.who === who) { const c = [...L]; c[c.length - 1] = { who, text: last.text + text }; return c; }
      return [...L, { who, text }];
    });
  }
  function flushBufs() {
    if (exBufRef.current.trim()) { pushLine("ex", exBufRef.current); exBufRef.current = ""; }
    if (meBufRef.current.trim()) { pushLine("me", meBufRef.current); meBufRef.current = ""; }
  }

  async function start() {
    setErr(""); setLines([]); setResult(null); setElapsed(0);
    setStage("connecting");
    try {
      // 1) ephemeral token
      const tokRes = await fetch("/api/speak-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: accessCode }) });
      const tok = await tokRes.json();
      if (tok.needPassword) { onNeedCode && onNeedCode(); setStage("idle"); return; }
      if (!tok.token) throw new Error(tok.error || "Token failed");

      // 2) mic permission first (fail early)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      micStreamRef.current = stream;

      // 3) websocket to Gemini Live
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?access_token=${encodeURIComponent(tok.token)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      const s = SPEAKING[setIdx];
      const sys = `You are a friendly but professional IELTS Speaking examiner running a SHORTENED mock test (about 5-6 minutes total). Speak naturally and concisely, like a real examiner. Follow this exact plan, one question at a time, waiting for the candidate's answer before continuing:
PART 1 — greet the candidate briefly, then ask these questions one by one: ${s.p1.map((q, i) => `(${i + 1}) ${q}`).join(" ")}
PART 2 — say: "Now I'm going to give you a topic. You have about 30 seconds to think, then please speak for up to one and a half minutes." The topic is: "${s.cue.topic}" You should say: ${s.cue.points.join("; ")}. After they finish, ask one short follow-up question.
PART 3 — ask these discussion questions one by one: ${s.p3.map((q, i) => `(${i + 1}) ${q}`).join(" ")}
Then say exactly: "That is the end of the speaking test. Thank you." and stop.
RULES: never give feedback, scores or corrections during the test; keep your own turns short; if the candidate is silent for a long time, gently prompt them once; always stay in English.`;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          setup: {
            model: `models/${tok.model}`,
            generationConfig: { responseModalities: ["AUDIO"] },
            systemInstruction: { parts: [{ text: sys }] },
            outputAudioTranscription: {},
            inputAudioTranscription: {},
          },
        }));
      };

      ws.onmessage = async (ev) => {
        let msg;
        try {
          const txt = typeof ev.data === "string" ? ev.data : await ev.data.text();
          msg = JSON.parse(txt);
        } catch (e) { return; }

        if (msg.setupComplete) {
          setStage("live");
          startMic();
          startTimer();
          // nudge the examiner to begin
          ws.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ text: "Hello, I am ready to begin." }] }], turnComplete: true } }));
          return;
        }
        const sc = msg.serverContent;
        if (!sc) return;
        if (sc.outputTranscription && sc.outputTranscription.text) exBufRef.current += sc.outputTranscription.text;
        if (sc.inputTranscription && sc.inputTranscription.text) meBufRef.current += sc.inputTranscription.text;
        if (sc.modelTurn && sc.modelTurn.parts) {
          for (const p of sc.modelTurn.parts) {
            if (p.inlineData && p.inlineData.data) queuePlay(p.inlineData.data);
          }
        }
        if (sc.turnComplete) { flushBufs(); }
        if (sc.interrupted) { /* user talked over examiner */ }
      };
      ws.onerror = () => { setErr(t("Connection error. Check GEMINI_API_KEY / model and try again.", "Ulanish xatosi. GEMINI_API_KEY / modelni tekshirib, qayta urining.")); setStage("error"); cleanup(); };
      ws.onclose = () => { setMicOn(false); setTalking(false); };
    } catch (e) {
      setErr(e.message || String(e)); setStage("error"); cleanup();
    }
  }

  function startTimer() {
    timerRef.current = setInterval(() => setElapsed((x) => x + 1), 1000);
  }

  function startMic() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    micCtxRef.current = ctx;
    const src = ctx.createMediaStreamSource(micStreamRef.current);
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    procRef.current = proc;
    proc.onaudioprocess = (e) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== 1) return;
      const pcm = floatTo16(e.inputBuffer.getChannelData(0));
      ws.send(JSON.stringify({ realtimeInput: { audio: { data: b64FromBytes(pcm.buffer), mimeType: "audio/pcm;rate=16000" } } }));
    };
    src.connect(proc); proc.connect(ctx.destination);
    setMicOn(true);
  }

  function queuePlay(b64) {
    try {
      if (!playCtxRef.current) { playCtxRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 }); playTimeRef.current = playCtxRef.current.currentTime; }
      const ctx = playCtxRef.current;
      const bytes = bytesFromB64(b64);
      const i16 = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
      const f32 = new Float32Array(i16.length);
      for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768;
      const buf = ctx.createBuffer(1, f32.length, 24000);
      buf.getChannelData(0).set(f32);
      const srcNode = ctx.createBufferSource();
      srcNode.buffer = buf; srcNode.connect(ctx.destination);
      const startAt = Math.max(ctx.currentTime, playTimeRef.current);
      srcNode.start(startAt);
      playTimeRef.current = startAt + buf.duration;
      setTalking(true);
      srcNode.onended = () => { if (playCtxRef.current && playTimeRef.current <= playCtxRef.current.currentTime + 0.05) setTalking(false); };
    } catch (e) {}
  }

  async function finish() {
    flushBufs();
    setStage("scoring");
    cleanup();
    const transcript = linesRef.current.map((l) => `${l.who === "ex" ? "Examiner" : "Candidate"}: ${l.text.trim()}`).join("\n");
    if (!transcript || transcript.length < 40) { setErr(t("Not enough speech was captured to score.", "Baholash uchun yetarli nutq yozilmadi.")); setStage("error"); return; }
    try {
      const res = await fetch("/api/score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "speakScore", transcript, lang, password: accessCode }) });
      const r = await res.json();
      if (r.needPassword) { onNeedCode && onNeedCode(); setStage("idle"); return; }
      if (r.error) { setErr(r.error); setStage("error"); return; }
      setResult(r); setStage("done");
      if (onSave) onSave(r, transcript, SPEAKING[setIdx].name);
    } catch (e) { setErr(t("Network error.", "Tarmoq xatosi.")); setStage("error"); }
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0"), ss = String(elapsed % 60).padStart(2, "0");

  // ---------- UI ----------
  if (stage === "idle" || stage === "error") return (
    <div className="anim" style={{ maxWidth: 560, margin: "10px auto" }}>
      <h3 style={{ fontFamily: serif, fontSize: 24, color: V.text, textAlign: "center", margin: "0 0 4px" }}>🎙 {t("Speaking mock test", "Speaking sinov imtihoni")}</h3>
      <p style={{ textAlign: "center", color: V.muted, fontSize: 13.5, margin: "0 0 18px", lineHeight: 1.55 }}>{t("A live AI examiner will interview you (Parts 1–3, ~5-6 min). Speak out loud — then Claude scores your fluency, vocabulary and grammar.", "Jonli AI imtihonchi siz bilan suhbat o'tkazadi (Part 1–3, ~5-6 daqiqa). Ovoz bilan gapiring — so'ng Claude ravonlik, lug'at va grammatikani baholaydi.")}</p>
      <div style={{ marginBottom: 14 }}>
        {SPEAKING.map((s, i) => (
          <button key={i} onClick={() => setSetIdx(i)} style={btn({ width: "100%", textAlign: "left", padding: "14px 17px", borderRadius: 14, marginBottom: 8, border: `1px solid ${setIdx === i ? "var(--accent)" : V.border}`, background: setIdx === i ? V.accentSoft : V.surface, color: V.text, fontSize: 14 })}>{s.name}</button>
        ))}
      </div>
      {err && <p style={{ color: V.bad, fontSize: 13, textAlign: "center", marginBottom: 10 }}>{err}</p>}
      <button onClick={start} style={btn({ width: "100%", padding: "15px", borderRadius: 13, background: GRAD, color: "#fff", fontSize: 15, boxShadow: "0 10px 26px rgba(255,106,77,0.35)" })}>🎤 {t("Start the interview →", "Suhbatni boshlash →")}</button>
      <p style={{ fontSize: 11.5, color: V.faint, textAlign: "center", marginTop: 10 }}>{t("Uses your microphone. Pronunciation is not scored from transcript (noted honestly in results).", "Mikrofoningiz ishlatiladi. Talaffuz transkriptdan baholanmaydi (natijada halol ko'rsatiladi).")}</p>
    </div>
  );

  if (stage === "connecting") return <div style={{ textAlign: "center", color: V.muted, padding: 50 }}>{t("Connecting to your examiner…", "Imtihonchiga ulanmoqda…")}</div>;

  if (stage === "live") return (
    <div className="anim" style={{ maxWidth: 640, margin: "6px auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontFamily: serif, fontSize: 20, color: V.text }}>{mm}:{ss}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: talking ? V.accent : V.good }}>{talking ? "🔊 " + t("Examiner speaking…", "Imtihonchi gapiryapti…") : micOn ? "🎤 " + t("Your turn — speak", "Sizning navbatingiz — gapiring") : "…"}</span>
        <button onClick={finish} style={btn({ background: V.text, color: V.bg, padding: "9px 16px", borderRadius: 10, fontSize: 13 })}>{t("Finish & score →", "Tugatish va baholash →")}</button>
      </div>
      <div style={{ height: 6, background: V.track, borderRadius: 999, marginBottom: 14, overflow: "hidden" }}>
        <div style={{ height: "100%", width: talking ? "100%" : "0%", background: GRAD, transition: "width .4s", borderRadius: 999, opacity: .8 }} />
      </div>
      <div className="sel" style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 18, padding: 18, minHeight: 300, maxHeight: 420, overflowY: "auto", boxShadow: V.shadow }}>
        {lines.length === 0 && <p style={{ color: V.faint, fontSize: 13, textAlign: "center", marginTop: 90 }}>{t("The examiner will greet you in a moment — say hello back!", "Imtihonchi hozir salomlashadi — javob bering!")}</p>}
        {lines.map((l, i) => (
          <div key={i} style={{ marginBottom: 12, display: "flex", flexDirection: "column", alignItems: l.who === "me" ? "flex-end" : "flex-start" }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: .5, textTransform: "uppercase", color: l.who === "me" ? V.good : V.accent, marginBottom: 3 }}>{l.who === "me" ? t("You", "Siz") : t("Examiner", "Imtihonchi")}</span>
            <p style={{ margin: 0, maxWidth: "85%", fontSize: 14, lineHeight: 1.55, color: V.text, background: l.who === "me" ? "rgba(47,185,138,0.10)" : V.surface2, padding: "9px 13px", borderRadius: 12 }}>{l.text.trim()}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11.5, color: V.faint, textAlign: "center", marginTop: 10 }}>{t("When the examiner says the test is over, press “Finish & score”.", "Imtihonchi test tugadi deganida “Tugatish va baholash”ni bosing.")}</p>
    </div>
  );

  if (stage === "scoring") return <div style={{ textAlign: "center", color: V.muted, padding: 50 }}>{t("The examiner is scoring your performance…", "Imtihonchi natijangizni baholayapti…")}</div>;

  if (stage === "done" && result) return (
    <div className="anim" style={{ maxWidth: 560, margin: "10px auto" }}>
      <div style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 20, padding: 20, boxShadow: V.shadow, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <div style={{ width: 70, height: 70, borderRadius: 18, background: V.accentSoft, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: serif, fontSize: 28, color: bandColor(result.overall), lineHeight: 1 }}>{Number(result.overall).toFixed(1)}</span>
            <span style={{ fontSize: 8, color: V.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>band</span>
          </div>
          <div style={{ display: "flex", flex: 1, minWidth: 200, gap: 6 }}>
            {[["FC", result.fc], ["LR", result.lr], ["GRA", result.gra]].map(([lb, o]) => (
              <div key={lb} style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontFamily: serif, fontSize: 20, color: bandColor(o.band) }}>{Number(o.band).toFixed(1)}</div>
                <div style={{ fontSize: 10, color: V.muted, fontWeight: 700 }}>{lb}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 18, padding: 18, marginBottom: 12 }}>
        <div style={{ fontSize: 12.5, color: V.muted, lineHeight: 1.6 }}>
          <div><b style={{ color: V.text }}>FC:</b> {result.fc.note}</div>
          <div><b style={{ color: V.text }}>LR:</b> {result.lr.note}</div>
          <div><b style={{ color: V.text }}>GRA:</b> {result.gra.note}</div>
          {result.pron_note && <div style={{ marginTop: 6, fontStyle: "italic" }}>{result.pron_note}</div>}
        </div>
        <h4 style={{ fontFamily: serif, fontSize: 15, margin: "14px 0 6px", color: V.good }}>✓ {t("What worked", "Yaxshi tomonlari")}</h4>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>{(result.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
        <h4 style={{ fontFamily: serif, fontSize: 15, margin: "12px 0 6px", color: V.accent }}>→ {t("To improve", "Yaxshilash kerak")}</h4>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>{(result.improvements || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => { setStage("idle"); setResult(null); setLines([]); }} style={btn({ flex: 1, padding: "13px", borderRadius: 12, background: GRAD, color: "#fff", fontSize: 14, boxShadow: "0 8px 20px rgba(255,106,77,0.3)" })}>↻ {t("New interview", "Yangi suhbat")}</button>
      </div>
    </div>
  );

  return null;
}
