"use client";

import React, { useState, useRef, useEffect } from "react";
import { SPEAKING } from "./data";
import { supabase, hasSupabase } from "./lib/supabase";

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
  var showTranscriptState = useState(false);
  var showTranscript = showTranscriptState[0], setShowTranscript = showTranscriptState[1];
  var prepActiveState = useState(false);
  var prepActive = prepActiveState[0], setPrepActive = prepActiveState[1];
  var prepSecsState = useState(60);
  var prepSecs = prepSecsState[0], setPrepSecs = prepSecsState[1];
  var audioUrlState = useState(null);
  var audioUrl = audioUrlState[0], setAudioUrl = audioUrlState[1];

  var pcRef = useRef(null);
  var dcRef = useRef(null);
  var micStreamRef = useRef(null);
  var audioElRef = useRef(null);
  var timerRef = useRef(null);
  var linesRef = useRef([]);
  var outBufRef = useRef({});
  var seenItemsRef = useRef({});
  var talkingTimeoutRef = useRef(null);
  var transcriptScrollRef = useRef(null);
  var prepTimerRef = useRef(null);
  var audioCtxRef = useRef(null);
  var mediaRecRef = useRef(null);
  var audioChunksRef = useRef([]);
  var destNodeRef = useRef(null);

  useEffect(function () {
    return function () { cleanup(); };
  }, []);
  useEffect(function () { linesRef.current = lines; }, [lines]);
  useEffect(function () {
    if (showTranscript && transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [lines, showTranscript]);

  function cleanup() {
    try { if (timerRef.current) clearInterval(timerRef.current); } catch (e) {}
    try { if (prepTimerRef.current) clearInterval(prepTimerRef.current); } catch (e) {}
    try { if (talkingTimeoutRef.current) clearTimeout(talkingTimeoutRef.current); } catch (e) {}
    try { if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(function (tr) { tr.stop(); }); } } catch (e) {}
    try { if (dcRef.current) dcRef.current.close(); } catch (e) {}
    try { if (pcRef.current) pcRef.current.close(); } catch (e) {}
    try { if (audioCtxRef.current) audioCtxRef.current.close(); } catch (e) {}
    timerRef.current = null;
    prepTimerRef.current = null;
    micStreamRef.current = null;
    dcRef.current = null;
    pcRef.current = null;
    audioCtxRef.current = null;
    destNodeRef.current = null;
    mediaRecRef.current = null;
    setTalking(false);
    setPrepActive(false);
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

  function playDing() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ac = new AC();
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.4, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.9);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + 0.9);
      osc.onended = function () { try { ac.close(); } catch (e) {} };
    } catch (e) {}
  }

  function startPrepTimer() {
    if (prepTimerRef.current) return;
    setPrepActive(true);
    setPrepSecs(60);
    prepTimerRef.current = setInterval(function () {
      setPrepSecs(function (s) {
        if (s <= 1) {
          clearInterval(prepTimerRef.current);
          prepTimerRef.current = null;
          playDing();
          setTimeout(function () { setPrepActive(false); setPrepSecs(60); }, 2000);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function uploadAudio(blob, callback) {
    if (!blob || !hasSupabase || !supabase) { callback(null); return; }
    try {
      supabase.auth.getSession().then(function (resp) {
        var sess = resp && resp.data && resp.data.session;
        if (!sess || !sess.user) { callback(null); return; }
        var uid = sess.user.id;
        var path = "speaking-audio/" + uid + "/" + Date.now() + ".webm";
        supabase.storage.from("speaking-audio").upload(path, blob, { contentType: "audio/webm", upsert: false })
          .then(function (res) {
            if (res.error) { throw new Error(res.error.message || "upload-failed"); }
            return supabase.storage.from("speaking-audio").createSignedUrl(path, 86400);
          })
          .then(function (signRes) {
            if (!signRes || signRes.error || !signRes.data) { throw new Error("sign-failed"); }
            callback(signRes.data.signedUrl);
          })
          .catch(function (e) { console.warn("Audio upload error:", e.message || e); callback(null); });
      }).catch(function (e) { console.warn("getSession error:", e); callback(null); });
    } catch (e) {
      console.warn("uploadAudio error:", e);
      callback(null);
    }
  }

  function buildInstructions() {
    var s = SPEAKING[setIdx];
    var p1 = s.p1.map(function (q, i) { return "(" + (i + 1) + ") " + q; }).join(" ");
    var p3 = s.p3.map(function (q, i) { return "(" + (i + 1) + ") " + q; }).join(" ");
    var parts = [];
    parts.push("You are a friendly but professional IELTS Speaking examiner running a SHORTENED mock test (about 5-6 minutes total). Speak naturally and concisely, like a real examiner. Follow this exact plan, one question at a time, waiting for the candidate's answer before continuing.");
    parts.push("PART 1 - greet the candidate briefly, then ask these questions one by one: " + p1);
    parts.push("PART 2 - say: Now I am going to give you a topic. The topic is: " + s.cue.topic + " You should say: " + s.cue.points.join("; ") + ". Then you MUST say this sentence word for word exactly: \"You now have one minute to prepare your answer.\" Then stay completely silent until the candidate starts speaking or the minute ends. After they finish, ask one short follow-up question.");
    parts.push("PART 3 - ask these discussion questions one by one: " + p3);
    parts.push("Then say exactly: That is the end of the speaking test. Thank you. And stop talking after that.");
    parts.push("RULES: never give feedback, scores or corrections during the test; keep your own turns short; wait patiently - candidates pause to think, so never respond until they have clearly finished speaking, and never interrupt them mid-sentence or mid-thought; a few seconds of silence usually just means they are thinking, not that they are done; if the candidate is silent for a long while (several seconds of true silence, not a thinking pause), gently prompt them once; always stay in English; begin now by greeting the candidate.");
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

    if (has(type, "input_audio_transcription") && (has(type, "completed") || has(type, "done"))) {
      addLine("me", evt.transcript, evt.item_id || ("in-" + Date.now()));
      return;
    }

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
      if (!prepTimerRef.current && full.toLowerCase().indexOf("you now have one minute to prepare your answer") !== -1) {
        startPrepTimer();
      }
      delete outBufRef.current[idF];
      return;
    }

    if (type === "conversation.item.done" || type === "conversation.item.created") {
      var item = evt.item;
      if (item && item.role === "user") {
        var txt = extractTranscriptFromItem(item);
        if (txt) addLine("me", txt, item.id);
      } else if (item && item.role === "assistant") {
        var txt2 = extractTranscriptFromItem(item);
        if (txt2) {
          addLine("ex", txt2, item.id);
          if (!prepTimerRef.current && txt2.toLowerCase().indexOf("you now have one minute to prepare your answer") !== -1) {
            startPrepTimer();
          }
        }
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
    setErr(""); setLines([]); setResult(null); setElapsed(0); setPrepActive(false); setPrepSecs(60); setAudioUrl(null);
    outBufRef.current = {};
    seenItemsRef.current = {};
    audioChunksRef.current = [];
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

            // Feature C: AudioContext mixer for recording local + remote audio
            try {
              var AC = window.AudioContext || window.webkitAudioContext;
              if (AC && typeof MediaRecorder !== "undefined") {
                var ctx = new AC();
                audioCtxRef.current = ctx;
                var dest = ctx.createMediaStreamDestination();
                destNodeRef.current = dest;
                var localSrc = ctx.createMediaStreamSource(stream);
                localSrc.connect(dest);
                var mimeType = "audio/webm";
                try {
                  if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
                    mimeType = "audio/webm;codecs=opus";
                  }
                } catch (e) {}
                var rec = new MediaRecorder(dest.stream, { mimeType: mimeType });
                rec.ondataavailable = function (e) {
                  if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
                };
                mediaRecRef.current = rec;
              }
            } catch (recSetupErr) {
              console.warn("Audio recording setup failed:", recSetupErr);
            }

            var pc = new RTCPeerConnection();
            pcRef.current = pc;

            var audioEl = audioElRef.current;
            pc.ontrack = function (event) {
              if (audioEl) {
                audioEl.srcObject = event.streams[0];
                audioEl.play().catch(function () {});
              }
              // Feature C: connect remote examiner stream to recorder mix
              try {
                if (audioCtxRef.current && destNodeRef.current && event.streams[0]) {
                  var remoteSrc = audioCtxRef.current.createMediaStreamSource(event.streams[0]);
                  remoteSrc.connect(destNodeRef.current);
                }
              } catch (remErr) { console.warn("Remote audio tap failed:", remErr); }
            };

            stream.getTracks().forEach(function (track) { pc.addTrack(track, stream); });

            var dc = pc.createDataChannel("oai-events");
            dcRef.current = dc;
            dc.onopen = function () {
              setStage("live");
              startTimer();
              dc.send(JSON.stringify({ type: "response.create" }));
              // Feature C: start recording
              try {
                if (mediaRecRef.current && mediaRecRef.current.state === "inactive") {
                  mediaRecRef.current.start(1000);
                }
              } catch (recStartErr) { console.warn("MediaRecorder start failed:", recStartErr); }
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

    function doScore(recUrl) {
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
          setAudioUrl(recUrl || null);
          setStage("done");
          if (onSave) onSave(r, transcript, SPEAKING[setIdx].name, recUrl || null);
        })
        .catch(function () {
          setErr(t("Network error.", "Tarmoq xatosi."));
          setStage("error");
        });
    }

    // Feature C: stop recorder, upload, then score
    var rec = mediaRecRef.current;
    if (rec && (rec.state === "recording" || rec.state === "paused")) {
      var recMime = rec.mimeType || "audio/webm";
      rec.onstop = function () {
        var blob = audioChunksRef.current.length > 0
          ? new Blob(audioChunksRef.current, { type: recMime })
          : null;
        uploadAudio(blob, doScore);
      };
      try { rec.stop(); } catch (e) { console.warn("rec.stop failed:", e); doScore(null); }
    } else {
      doScore(null);
    }
  }

  var mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  var ss = String(elapsed % 60).padStart(2, "0");

  var audioTag = <audio ref={audioElRef} autoPlay playsInline style={{ display: "none" }} />;

  if (stage === "idle" || stage === "error") {
    return (
      <div className="anim" style={{ maxWidth: 560, margin: "10px auto" }}>
        {audioTag}
        <h3 style={{ fontFamily: serif, fontSize: 24, color: V.text, textAlign: "center", margin: "0 0 4px" }}>{"🎙"} {t("Speaking mock test", "Speaking sinov imtihoni")}</h3>
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
          {"🎤"} {t("Start the interview →", "Suhbatni boshlash →")}
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
    var turnColor = talking ? V.accent : V.good;
    var turnLabel = talking ? t("Examiner speaking...", "Imtihonchi gapiryapti...") : t("Your turn - speak", "Sizning navbatingiz - gapiring");
    var orbLabel = talking ? t("Listening to the examiner...", "Imtihonchini tinglang...") : t("I'm listening...", "Sizni tinglayapman...");
    var orbSub = talking
      ? t("The examiner is asking a question - just listen.", "Imtihonchi savol beryapti - shunchaki tinglang.")
      : t("Speak naturally, like a real IELTS interview. I can hear you.", "Tabiiy gapiring, xuddi haqiqiy IELTS suhbatidagidek. Sizni eshityapman.");

    var eqDurations = [1.1, 0.9, 1.3, 1.0, 1.2];
    var eqBars = [1, 2, 3, 4, 5].map(function (n, i) {
      return (
        <div key={n} style={{
          width: 4, height: "100%", borderRadius: 3, background: "#fff", opacity: 0.95,
          transformOrigin: "center",
          animation: "eqBar" + n + " " + eqDurations[i] + "s ease-in-out infinite",
          animationPlayState: talking ? "running" : "paused",
          transform: talking ? undefined : "scaleY(0.4)",
        }} />
      );
    });

    // Feature A: cue card overlay SVG ring
    var RING_R = 28;
    var RING_C = 2 * Math.PI * RING_R;
    var ringOffset = RING_C * (1 - (prepSecs > 0 ? prepSecs : 0) / 60);
    var cue = SPEAKING[setIdx].cue;

    return (
      <div className="anim" style={{ maxWidth: 640, margin: "6px auto" }}>
        {audioTag}

        {/* Feature A: Part 2 prep timer cue card overlay */}
        {prepActive ? (
          <div style={{ position: "fixed", bottom: 22, right: 22, zIndex: 200, width: 292, background: V.surface, border: "1px solid " + V.border, borderRadius: 18, padding: 18, boxShadow: "0 20px 50px rgba(42,33,30,0.22)", animation: "cardIn .3s ease both" }}>
            {prepSecs === 0 ? (
              <div style={{ textAlign: "center", padding: "14px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{"🎤"}</div>
                <div style={{ fontFamily: serif, fontSize: 17, color: V.accent, fontWeight: 700 }}>
                  {t("Start speaking now!", "Endi gapiring!")}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: V.faint, marginBottom: 10 }}>
                  {t("Part 2 — Prepare", "Part 2 — Tayyorlanish")}
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <svg viewBox="0 0 80 80" width="80" height="80" style={{ flexShrink: 0 }}>
                    <circle cx="40" cy="40" r={RING_R} fill="none" stroke={V.track} strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r={RING_R}
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={RING_C}
                      strokeDashoffset={ringOffset}
                      style={{ transform: "rotate(-90deg)", transformOrigin: "40px 40px", transition: "stroke-dashoffset 1s linear" }}
                    />
                    <text x="40" y="40" textAnchor="middle" dominantBaseline="central" fontFamily={serif} fontSize="20" fill={V.text} fontWeight="700">
                      {prepSecs}
                    </text>
                  </svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: serif, fontSize: 14, color: V.text, fontWeight: 700, lineHeight: 1.4, marginBottom: 8 }}>
                      {cue.topic}
                    </div>
                    <ul style={{ margin: 0, padding: "0 0 0 14px", listStyle: "disc" }}>
                      {cue.points.map(function (p, pi) {
                        return (
                          <li key={pi} style={{ fontSize: 12, color: V.muted, lineHeight: 1.5, marginBottom: 2 }}>
                            {p}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* status bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", background: V.surface, border: "1px solid " + V.border, borderRadius: 16, padding: "14px 18px", boxShadow: V.shadow, marginBottom: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontFamily: serif, fontSize: 22, color: V.text, minWidth: 58 }}>{mm}:{ss}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 700, color: turnColor }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: turnColor, animation: "pulseRing 1.6s ease-in-out infinite" }} />
              {turnLabel}
            </div>
          </div>
          <button onClick={finish} style={btn({ background: GRAD, color: "#fff", padding: "11px 20px", borderRadius: 12, fontSize: 14, boxShadow: "0 8px 20px var(--accent-soft)" })}>
            {t("Finish & score →", "Tugatish va baholash →")}
          </button>
        </div>

        {/* orb visualizer */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 20px 30px" }}>
          <div style={{ position: "relative", width: 168, height: 168, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: V.accentSoft, animation: "orbPulse 2.2s ease-out infinite" }} />
            <div style={{ position: "absolute", inset: 16, borderRadius: "50%", background: V.accentSoft, animation: "orbPulse 2.2s ease-out 0.6s infinite" }} />
            <div style={{ position: "relative", width: 112, height: 112, borderRadius: "50%", background: "linear-gradient(140deg,var(--accent),var(--accent2))", boxShadow: "0 18px 44px var(--accent-soft)", animation: "orbBreathe 2.4s ease-in-out infinite", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, height: 36 }}>
                {eqBars}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: V.text, marginTop: 22 }}>{orbLabel}</div>
          <div style={{ fontSize: 13.5, color: V.muted, marginTop: 4, textAlign: "center", maxWidth: 340 }}>{orbSub}</div>

          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button onClick={function () { setShowTranscript(!showTranscript); }} style={btn({ border: "1px solid " + V.border, background: V.surface, color: V.text, padding: "10px 18px", borderRadius: 11, fontSize: 13.5 })}>
              {showTranscript ? t("Hide transcript", "Transkriptni yashirish") : t("Show transcript", "Transkriptni ko'rsatish")}
            </button>
          </div>
        </div>

        {/* transcript */}
        {showTranscript ? (
          <div className="anim" style={{ background: V.surface, border: "1px solid " + V.border, borderRadius: 18, padding: 20, boxShadow: V.shadow, marginBottom: 22 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: V.faint, marginBottom: 12 }}>
              {t("Transcript", "Transkript")}
            </div>
            <div ref={transcriptScrollRef} style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 320, overflowY: "auto" }}>
              {lines.length === 0 ? (
                <p style={{ color: V.faint, fontSize: 13, textAlign: "center", margin: "20px 0" }}>
                  {t("The examiner will greet you in a moment - say hello back!", "Imtihonchi hozir salomlashadi - javob bering!")}
                </p>
              ) : null}
              {lines.map(function (l, i) {
                var mine = l.who === "me";
                return (
                  <div key={i} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%" }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: mine ? V.good : V.accent, marginBottom: 4 }}>
                      {mine ? t("You", "Siz") : t("Examiner", "Imtihonchi")}
                    </div>
                    <div style={{ fontSize: 14.5, lineHeight: 1.55, color: V.text, background: mine ? "rgba(47,185,138,0.10)" : V.surface2, padding: "11px 14px", borderRadius: 13 }}>
                      {l.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

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
    var critRows = [
      { label: t("Fluency & Coherence", "Ravonlik va izchillik"), band: result.fc.band, note: result.fc.note },
      { label: t("Lexical Resource", "Lug'at boyligi"), band: result.lr.band, note: result.lr.note },
      { label: t("Grammatical Range & Accuracy", "Grammatik diapazon va aniqlik"), band: result.gra.band, note: result.gra.note },
    ];
    var strengthLines = (result.strengths || []).map(function (s) { return { mark: "✓", color: V.good, text: s }; });
    var improveLines = (result.improvements || []).map(function (s) { return { mark: "→", color: V.accent, text: s }; });
    var noteLines = strengthLines.concat(improveLines);
    var errors = result.errors || [];

    return (
      <div className="anim" style={{ maxWidth: 560, margin: "10px auto" }}>
        <div style={{ background: V.surface, border: "1px solid " + V.border, borderRadius: 20, padding: 22, boxShadow: V.shadow, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
            <div style={{ width: 66, height: 66, borderRadius: 18, background: "linear-gradient(135deg,var(--accent),var(--accent2))", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 10px 22px var(--accent-soft)", flexShrink: 0 }}>
              <span style={{ fontFamily: serif, fontSize: 27, lineHeight: 1 }}>{Number(result.overall).toFixed(1)}</span>
              <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.14em", marginTop: 2 }}>BAND</span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: V.text }}>{t("Estimated speaking band", "Taxminiy speaking bali")}</div>
              <div style={{ fontSize: 13, color: V.muted, marginTop: 2 }}>{t("Based on the 4 official IELTS speaking criteria", "Rasmiy IELTS speaking mezonlarining 4 tasi asosida")}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 22px" }}>
            {critRows.map(function (c, i) {
              var pct = Math.max(0, Math.min(100, (c.band / 9) * 100)) + "%";
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 700, color: V.muted, marginBottom: 5 }}>
                    <span>{c.label}</span>
                    <span style={{ color: V.accent }}>{Number(c.band).toFixed(1)}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 100, background: V.track, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: pct, borderRadius: 100, background: "linear-gradient(90deg,var(--accent),var(--accent2))" }} />
                  </div>
                  {c.note ? <div style={{ fontSize: 11.5, color: V.faint, marginTop: 4, lineHeight: 1.4 }}>{c.note}</div> : null}
                </div>
              );
            })}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 700, color: V.muted, marginBottom: 5 }}>
                <span>{t("Pronunciation", "Talaffuz")}</span>
                <span style={{ color: V.faint, fontStyle: "italic", fontWeight: 600 }}>{t("not assessed", "baholanmagan")}</span>
              </div>
              <div style={{ height: 7, borderRadius: 100, background: "transparent", border: "1px dashed " + V.border, overflow: "hidden" }}>
                <div style={{ height: "100%", width: "0%" }} />
              </div>
            </div>
          </div>
          {result.pron_note ? <div style={{ fontSize: 12, color: V.faint, fontStyle: "italic", marginTop: 12 }}>{result.pron_note}</div> : null}
        </div>

        <div style={{ borderRadius: 13, background: V.surface2, border: "1px dashed var(--border)", padding: 16, marginBottom: 12 }}>
          {noteLines.map(function (n, i) {
            return (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, fontWeight: 600, color: n.color, marginTop: i === 0 ? 0 : 8 }}>
                <span>{n.mark}</span>
                <span style={{ color: V.text, fontWeight: 500 }}>{n.text}</span>
              </div>
            );
          })}
        </div>

        {/* Feature B: Corrections card */}
        {errors.length > 0 ? (
          <div style={{ background: V.surface, border: "1px solid " + V.border, borderRadius: 16, padding: "16px 18px", marginBottom: 12, boxShadow: V.shadow }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: V.faint, marginBottom: 12 }}>
              {t("Corrections", "Tuzatishlar")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {errors.map(function (er, ei) {
                return (
                  <div key={ei} style={{ borderLeft: "3px solid var(--bad)", paddingLeft: 12 }}>
                    <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                      <span style={{ textDecoration: "line-through", color: V.bad }}>{er.text}</span>
                      <span style={{ color: V.muted, margin: "0 6px" }}>{"→"}</span>
                      <span style={{ color: V.good, fontWeight: 700 }}>{er.fix}</span>
                    </div>
                    {er.rule ? (
                      <div style={{ fontSize: 12, color: V.muted, marginTop: 4 }}>
                        {"💡"} {er.rule}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Feature C: audio player */}
        {audioUrl ? (
          <div style={{ background: V.surface, border: "1px solid " + V.border, borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: V.faint, marginBottom: 10 }}>
              {t("Session recording", "Sessiya yozuvi")}
            </div>
            <audio controls src={audioUrl} style={{ width: "100%", borderRadius: 8 }} />
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={function () { setStage("idle"); setResult(null); setLines([]); setShowTranscript(false); setAudioUrl(null); setPrepActive(false); setPrepSecs(60); }} style={btn({ flex: 1, padding: "13px", borderRadius: 12, background: GRAD, color: "#fff", fontSize: 14, boxShadow: "0 8px 20px rgba(255,106,77,0.3)" })}>
            {"↻"} {t("New interview", "Yangi suhbat")}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
