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
const btn = function (extra) {
  extra = extra || {};
  var base = { cursor: "pointer", border: "none", fontWeight: 700, fontFamily: "inherit", transition: "all .18s ease" };
  for (var k in extra) base[k] = extra[k];
  return base;
};
function bandColor(b) {
  if (b >= 7) return "var(--good)";
  if (b >= 6) return "#7BAE4A";
  if (b >= 5) return "var(--accent2)";
  return "var(--bad)";
}
function has(type, needle) { return type.indexOf(needle) !== -1; }

export default function Speaking(props) {
  var lang = props.lang, accessCode = props.accessCode, onNeedCode = props.onNeedCode, onSave = props.onSave;
  function t(en, uz) { return lang === "uz" ? uz : en; }

  var stageState = useState("idle");
  var stage = stageState[0], setStage = stageState[1];
  var setIdxState = useState(0);
  var setIdx = setIdxState[0], setSetIdx = setIdxState[1];
  var errState = useState("");
  var err = errState[0], setErr = errState[1];
  var linesState = useState([]);
  var lines = linesState[0], setLines = linesState[1];
  var talkingState = useState(false);
  var talking = talkingState[0], setTalking = talkingState[1];
  var elapsedState = useState(0);
  var elapsed = elapsedState[0], setElapsed = elapsedState[1];
  var resultState = useState(null);
  var result = resultState[0], setResult = resultState[1];

  var pcRef = useRef(null);
  var dcRef = useRef(null);
  var micStreamRef = useRef(null);
  var audioElRef = useRef(null);
  var timerRef = useRef(null);
  var linesRef = useRef([]);
  var outBufRef = useRef({});
  var seenItemsRef = useRef({});
  var talkingTimeoutRef = useRef(null);

  useEffect(function () {
    return function () { cleanup(); };
  }, []);
  useEffect(function () { linesRef.current = lines; }, [lines]);

  function cleanup() {
    try { if (timerRef.current) clearInterval(timerRef.current); } catch (e) {}
    try { if (talkingTimeoutRef.current) clearTimeout(talkingTimeoutRef.current); } catch (e) {}
    try { if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(function (tr) { tr.stop(); }); } } catch (e) {}
    try { if (dcRef.current) dcRef.current.close(); } catch (e) {}
    try { if (pcRef.current) pcRef.current.close(); } catch (e) {}
    timerRef.current = null;
    micStreamRef.current = null;
    dcRef.current = null;
    pcRef.current = null;
    setTalking(false);
  }

  function addLine(who, text, key) {
    text = (text || "").trim();
    if (!text) return;
    if (key) {
      if (seenItemsRef.current[key]) return;
      seenItemsRef.current[key] = true;
    }
    setLines(function (L) { return L.concat([{ who: who, text: text }]); });
  }

  function markTalking() {
    setTalking(true);
    if (talkingTimeoutRef.current) clearTimeout(talkingTimeoutRef.current);
    talkingTimeoutRef.current = setTimeout(function () { setTalking(false); }, 900);
  }

  function startTimer() {
    timerRef.current = setInterval(function () { setElapsed(function (x) { return x + 1; }); }, 1000);
  }

  function buildInstructions() {
    var s = SPEAKING[setIdx];
    var p1 = s.p1.map(function (q, i) { return "(" + (i + 1) + ") " + q; }).join(" ");
    var p3 = s.p3.map(function (q, i) { return "(" + (i + 1) + ") " + q; }).join(" ");
    var parts = [];
    parts.push("You are a friendly but professional IELTS Speaking examiner running a SHORTENED mock test (about 5-6 minutes total). Speak naturally and concisely, like a real examiner. Follow this exact plan, one question at a time, waiting for the candidate's answer before continuing.");
    parts.push("PART 1 - greet the candidate briefly, then ask these questions one by one: " + p1);
    parts.push("PART 2 - say: Now I am going to give you a topic. You have about thirty seconds to think, then please speak for up to one and a half minutes. The topic is: " + s.cue.topic + " You should say: " + s.cue.points.join("; ") + ". After they finish, ask one short follow-up question.");
    parts.push("PART 3 - ask these discussion questions one by one: " + p3);
    parts.push("Then say exactly: That is the end of the speaking test. Thank you. And stop talking after that.");
    parts.push("RULES: never give feedback, scores or corrections during the test; keep your own turns short; wait for the candidate to finish speaking before you respond, do not interrupt; if the candidate is silent for a while, gently prompt them once; always stay in English; begin now by greeting the candidate.");
    return parts.join(" ");
  }

  function extractTranscriptFromItem(item) {
    if (!item || !item.content) return "";
    var out = "";
    for (var i = 0; i < item.content.length; i++) {
      var c = item.content[i];
      if (c && typeof c.transcript === "string") out += c.transcript;
      if (c && typeof c.text === "string") out += c.text;
    }
    return out;
  }

  function handleServerEvent(evt) {
    var type = evt.type || "";

    // Candidate speech transcribed (various possible event name shapes)
    if (has(type, "input_audio_transcription") && (has(type, "completed") || has(type, "done"))) {
      addLine("me", evt.transcript, evt.item_id || ("in-" + Date.now()));
      return;
    }

    // Examiner speech transcript, streaming then final
    if ((has(type, "audio_transcript") || has(type, "output_text")) && has(type, "delta") && !has(type, "input")) {
      var idD = evt.response_id || evt.item_id || "cur";
      outBufRef.current[idD] = (outBufRef.current[idD] || "") + (evt.delta || "");
      markTalking();
      return;
    }
    if ((has(type, "audio_transcript") || has(type, "output_text")) && (has(type, "done") || has(type, "completed")) && !has(type, "input")) {
      var idF = evt.response_id || evt.item_id || "cur";
      var full = evt.transcript || outBufRef.current[idF] || "";
      addLine("ex", full, idF + "-final");
      delete outBufRef.current[idF];
      return;
    }

    // Fallback: full conversation item finished - pull transcript out of its content array
    if (type === "conversation.item.done" || type === "conversation.item.created") {
      var item = evt.item;
      if (item && item.role === "user") {
        var txt = extractTranscriptFromItem(item);
        if (txt) addLine("me", txt, item.id);
      } else if (item && item.role === "assistant") {
        var txt2 = extractTranscriptFromItem(item);
        if (txt2) addLine("ex", txt2, item.id);
      }
      return;
    }

    if (has(type, "audio") && has(type, "delta")) { markTalking(); return; }
    if (type === "response.done") { setTalking(false); return; }
    if (type === "error") {
      var msg = (evt.error && evt.error.message) || "Realtime error";
      setErr(msg);
    }
  }

  function start() {
    setErr(""); setLines([]); setResult(null); setElapsed(0);
    outBufRef.current = {};
    seenItemsRef.current = {};
    setStage("connecting");

    var instructions = buildInstructions();

    fetch("/api/realtime-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: accessCode, instructions: instructions }),
    })
      .then(function (r) { return r.json(); })
      .then(function (sess) {
        if (sess.needPassword) { if (onNeedCode) onNeedCode(); setStage("idle"); return; }
        if (!sess.ek) { throw new Error(sess.error || "Could not start session."); }

        return navigator.mediaDevices.getUserMedia({ audio: true })
          .then(function (stream) {
            micStreamRef.current = stream;

            var pc = new RTCPeerConnection();
            pcRef.current = pc;

            var audioEl = audioElRef.current;
            pc.ontrack = function (event) {
              if (audioEl) {
                audioEl.srcObject = event.streams[0];
                audioEl.play().catch(function () {});
              }
            };

            stream.getTracks().forEach(function (track) { pc.addTrack(track, stream); });

            var dc = pc.createDataChannel("oai-events");
            dcRef.current = dc;
            dc.onopen = function () {
              setStage("live");
              startTimer();
              dc.send(JSON.stringify({ type: "response.create" }));
            };
            dc.onmessage = function (e) {
              try { handleServerEvent(JSON.parse(e.data)); } catch (err2) {}
            };
            dc.onerror = function () {
              setErr(t("Data channel error.", "Ma'lumot kanali xatosi."));
            };

            return pc.createOffer().then(function (offer) {
              return pc.setLocalDescription(offer).then(function () { return offer; });
            });
          })
          .then(function (offer) {
            return fetch("https://api.openai.com/v1/realtime/calls", {
              method: "POST",
              body: offer.sdp,
              headers: {
                "Authorization": "Bearer " + sess.ek,
                "Content-Type": "application/sdp",
              },
            });
          })
          .then(function (sdpRes) {
            if (!sdpRes.ok) {
              return sdpRes.text().then(function (txt) { throw new Error("Realtime connection failed (" + sdpRes.status + "): " + txt.slice(0, 200)); });
            }
            return sdpRes.text();
          })
          .then(function (answerSdp) {
            return pcRef.current.setRemoteDescription({ type: "answer", sdp: answerSdp });
          });
      })
      .catch(function (e) {
        setErr((e && e.message) || String(e));
        setStage("error");
        cleanup();
      });
  }

  function finish() {
    setStage("scoring");
    var transcript = linesRef.current
      .map(function (l) { return (l.who === "ex" ? "Examiner" : "Candidate") + ": " + l.text; })
      .join("\n");
    cleanup();
    if (!transcript || transcript.length < 40) {
      setErr(t("Not enough speech was captured to score.", "Baholash uchun yetarli nutq yozilmadi."));
      setStage("error");
      return;
    }
    fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "speakScore", transcript: transcript, lang: lang, password: accessCode }),
    })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (r.needPassword) { if (onNeedCode) onNeedCode(); setStage("idle"); return; }
        if (r.error) { setErr(r.error); setStage("error"); return; }
        setResult(r);
        setStage("done");
        if (onSave) onSave(r, transcript, SPEAKING[setIdx].name);
      })
      .catch(function () {
        setErr(t("Network error.", "Tarmoq xatosi."));
        setStage("error");
      });
  }

  var mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  var ss = String(elapsed % 60).padStart(2, "0");

  var audioTag = <audio ref={audioElRef} autoPlay playsInline style={{ display: "none" }} />;

  if (stage === "idle" || stage === "error") {
    return (
      <div className="anim" style={{ maxWidth: 560, margin: "10px auto" }}>
        {audioTag}
        <h3 style={{ fontFamily: serif, fontSize: 24, color: V.text, textAlign: "center", margin: "0 0 4px" }}>{"\uD83C\uDF99"} {t("Speaking mock test", "Speaking sinov imtihoni")}</h3>
        <p style={{ textAlign: "center", color: V.muted, fontSize: 13.5, margin: "0 0 18px", lineHeight: 1.55 }}>
          {t("A live AI examiner will interview you (Parts 1-3, ~5-6 min). Speak out loud - then Claude scores your fluency, vocabulary and grammar.", "Jonli AI imtihonchi siz bilan suhbat o'tkazadi (Part 1-3, ~5-6 daqiqa). Ovoz bilan gapiring - so'ng Claude ravonlik, lug'at va grammatikani baholaydi.")}
        </p>
        <div style={{ marginBottom: 14 }}>
          {SPEAKING.map(function (s, i) {
            var isActive = setIdx === i;
            return (
              <button key={i} onClick={function () { setSetIdx(i); }} style={btn({ width: "100%", textAlign: "left", padding: "14px 17px", borderRadius: 14, marginBottom: 8, border: "1px solid " + (isActive ? "var(--accent)" : V.border), background: isActive ? V.accentSoft : V.surface, color: V.text, fontSize: 14 })}>
                {s.name}
              </button>
            );
          })}
        </div>
        {err ? <p style={{ color: V.bad, fontSize: 13, textAlign: "center", marginBottom: 10 }}>{err}</p> : null}
        <button onClick={start} style={btn({ width: "100%", padding: "15px", borderRadius: 13, background: GRAD, color: "#fff", fontSize: 15, boxShadow: "0 10px 26px rgba(255,106,77,0.35)" })}>
          {"\uD83C\uDFA4"} {t("Start the interview \u2192", "Suhbatni boshlash \u2192")}
        </button>
        <p style={{ fontSize: 11.5, color: V.faint, textAlign: "center", marginTop: 10 }}>
          {t("Uses your microphone. Pronunciation is not scored from transcript (noted honestly in results).", "Mikrofoningiz ishlatiladi. Talaffuz transkriptdan baholanmaydi (natijada halol ko'rsatiladi).")}
        </p>
      </div>
    );
  }

  if (stage === "connecting") {
    return (
      <div style={{ textAlign: "center", color: V.muted, padding: 50 }}>
        {audioTag}
        {t("Connecting to your examiner...", "Imtihonchiga ulanmoqda...")}
      </div>
    );
  }

  if (stage === "live") {
    return (
      <div className="anim" style={{ maxWidth: 640, margin: "6px auto" }}>
        {audioTag}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontFamily: serif, fontSize: 20, color: V.text }}>{mm}:{ss}</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: talking ? V.accent : V.good }}>
            {talking ? ("\uD83D\uDD0A " + t("Examiner speaking...", "Imtihonchi gapiryapti...")) : ("\uD83C\uDFA4 " + t("Your turn - speak", "Sizning navbatingiz - gapiring"))}
          </span>
          <button onClick={finish} style={btn({ background: V.text, color: V.bg, padding: "9px 16px", borderRadius: 10, fontSize: 13 })}>
            {t("Finish & score \u2192", "Tugatish va baholash \u2192")}
          </button>
        </div>
        <div style={{ height: 6, background: V.track, borderRadius: 999, marginBottom: 14, overflow: "hidden" }}>
          <div style={{ height: "100%", width: talking ? "100%" : "0%", background: GRAD, transition: "width .4s", borderRadius: 999, opacity: 0.8 }} />
        </div>
        <div className="sel" style={{ background: V.surface, border: "1px solid " + V.border, borderRadius: 18, padding: 18, minHeight: 300, maxHeight: 420, overflowY: "auto", boxShadow: V.shadow }}>
          {lines.length === 0 ? (
            <p style={{ color: V.faint, fontSize: 13, textAlign: "center", marginTop: 90 }}>
              {t("The examiner will greet you in a moment - say hello back!", "Imtihonchi hozir salomlashadi - javob bering!")}
            </p>
          ) : null}
          {lines.map(function (l, i) {
            var mine = l.who === "me";
            return (
              <div key={i} style={{ marginBottom: 12, display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: mine ? V.good : V.accent, marginBottom: 3 }}>
                  {mine ? t("You", "Siz") : t("Examiner", "Imtihonchi")}
                </span>
                <p style={{ margin: 0, maxWidth: "85%", fontSize: 14, lineHeight: 1.55, color: V.text, background: mine ? "rgba(47,185,138,0.10)" : V.surface2, padding: "9px 13px", borderRadius: 12 }}>
                  {l.text}
                </p>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 11.5, color: V.faint, textAlign: "center", marginTop: 10 }}>
          {t("When the examiner says the test is over, press Finish & score.", "Imtihonchi test tugadi deganida Tugatish va baholashni bosing.")}
        </p>
      </div>
    );
  }

  if (stage === "scoring") {
    return (
      <div style={{ textAlign: "center", color: V.muted, padding: 50 }}>
        {t("The examiner is scoring your performance...", "Imtihonchi natijangizni baholayapti...")}
      </div>
    );
  }

  if (stage === "done" && result) {
    var rows = [["FC", result.fc], ["LR", result.lr], ["GRA", result.gra]];
    return (
      <div className="anim" style={{ maxWidth: 560, margin: "10px auto" }}>
        <div style={{ background: V.surface, border: "1px solid " + V.border, borderRadius: 20, padding: 20, boxShadow: V.shadow, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <div style={{ width: 70, height: 70, borderRadius: 18, background: V.accentSoft, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: serif, fontSize: 28, color: bandColor(result.overall), lineHeight: 1 }}>{Number(result.overall).toFixed(1)}</span>
              <span style={{ fontSize: 8, color: V.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>band</span>
            </div>
            <div style={{ display: "flex", flex: 1, minWidth: 200, gap: 6 }}>
              {rows.map(function (pair) {
                var lb = pair[0], o = pair[1];
                return (
                  <div key={lb} style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontFamily: serif, fontSize: 20, color: bandColor(o.band) }}>{Number(o.band).toFixed(1)}</div>
                    <div style={{ fontSize: 10, color: V.muted, fontWeight: 700 }}>{lb}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ background: V.surface, border: "1px solid " + V.border, borderRadius: 18, padding: 18, marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, color: V.muted, lineHeight: 1.6 }}>
            <div><b style={{ color: V.text }}>FC:</b> {result.fc.note}</div>
            <div><b style={{ color: V.text }}>LR:</b> {result.lr.note}</div>
            <div><b style={{ color: V.text }}>GRA:</b> {result.gra.note}</div>
            {result.pron_note ? <div style={{ marginTop: 6, fontStyle: "italic" }}>{result.pron_note}</div> : null}
          </div>
          <h4 style={{ fontFamily: serif, fontSize: 15, margin: "14px 0 6px", color: V.good }}>{"\u2713"} {t("What worked", "Yaxshi tomonlari")}</h4>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
            {(result.strengths || []).map(function (s, i) { return <li key={i}>{s}</li>; })}
          </ul>
          <h4 style={{ fontFamily: serif, fontSize: 15, margin: "12px 0 6px", color: V.accent }}>{"\u2192"} {t("To improve", "Yaxshilash kerak")}</h4>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
            {(result.improvements || []).map(function (s, i) { return <li key={i}>{s}</li>; })}
          </ul>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={function () { setStage("idle"); setResult(null); setLines([]); }} style={btn({ flex: 1, padding: "13px", borderRadius: 12, background: GRAD, color: "#fff", fontSize: 14, boxShadow: "0 8px 20px rgba(255,106,77,0.3)" })}>
            {"\u21BB"} {t("New interview", "Yangi suhbat")}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
