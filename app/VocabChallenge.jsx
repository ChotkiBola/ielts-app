"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { CHALLENGE_WORDS } from "./VocabChallengeData";
import { supabase } from "./lib/supabase";

// ── shared visual language (mirrors page.jsx tokens) ──
const V = {
  bg: "var(--app-bg)", surface: "var(--surface)", surface2: "var(--surface-2)",
  text: "var(--text)", muted: "var(--muted)", faint: "var(--faint)",
  border: "var(--border)", border2: "var(--border-2)",
  accent: "var(--accent)", accent2: "var(--accent2)", accentSoft: "var(--accent-soft)",
  good: "var(--good)", bad: "var(--bad)", shadow: "var(--shadow)",
  promptBg: "var(--prompt-bg)", promptText: "var(--prompt-text)", track: "var(--track)",
};
const GRAD = "linear-gradient(120deg,var(--accent),var(--accent2))";
const serif = "'DM Serif Display', serif";
const btn = (extra = {}) => ({ cursor: "pointer", border: "none", fontWeight: 700, fontFamily: "inherit", transition: "all .18s ease", ...extra });

// ── match constants ──
const QUESTION_COUNT = 20;
const QUESTION_SECONDS = 12;
const BASE_POINTS = 100;
const SPEED_BONUS = 50;
const COUNTDOWN_MS = 3800; // lead time written into started_at

// ── deterministic shuffle (so re-renders don't reshuffle options) ──
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function seededShuffle(arr, seed) {
  let s = hashStr(String(seed));
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const WORD_BY_KEY = Object.fromEntries(CHALLENGE_WORDS.map((w) => [w.word, w]));

// Host builds the shared question set once; stored in vocab_rooms.questions.
function buildQuestions() {
  const picks = shuffle(CHALLENGE_WORDS).slice(0, QUESTION_COUNT);
  const types = shuffle([
    ...Array(7).fill("define"), ...Array(7).fill("gap"), ...Array(QUESTION_COUNT - 14).fill("translate"),
  ]);
  return picks.map((w, qi) => {
    const type = types[qi];
    if (type === "define") {
      const options = shuffle([w.definition, ...w.distractors]);
      return { type, word: w.word, prompt: w.word, options, correct: options.indexOf(w.definition) };
    }
    if (type === "gap") {
      const options = shuffle([w.word, ...w.sentenceDistractors]);
      return { type, word: w.word, prompt: w.sentenceBlank, options, correct: options.indexOf(w.word) };
    }
    // translate: store 3 distractor SOURCE WORDS; each client renders them in its own language.
    const used = new Set([w.translations.uz, w.translations.ru]);
    const others = [];
    for (const o of shuffle(CHALLENGE_WORDS)) {
      if (o.word === w.word) continue;
      if (used.has(o.translations.uz) || used.has(o.translations.ru)) continue;
      // prefer similar-length translations so options don't look comically different
      others.push(o.word); used.add(o.translations.uz); used.add(o.translations.ru);
      if (others.length === 3) break;
    }
    return { type, word: w.word, distractorWords: others };
  });
}

// Personalize the shared question for this player's translate-language.
// EN players get the same word served as an extra Define/Gap question instead.
function personalizeQuestion(q, transLang, qIndex) {
  if (q.type !== "translate") return q;
  const w = WORD_BY_KEY[q.word];
  if (!w) return q;
  if (transLang === "en") {
    if (qIndex % 2 === 0) {
      const options = seededShuffle([w.definition, ...w.distractors], q.word + ":d");
      return { type: "define", word: q.word, prompt: q.word, options, correct: options.indexOf(w.definition) };
    }
    const options = seededShuffle([w.word, ...w.sentenceDistractors], q.word + ":g");
    return { type: "gap", word: q.word, prompt: w.sentenceBlank, options, correct: options.indexOf(w.word) };
  }
  const correct = w.translations[transLang];
  const pool = [correct];
  (q.distractorWords || []).forEach((dw) => {
    const d = WORD_BY_KEY[dw];
    if (d && d.translations[transLang] && !pool.includes(d.translations[transLang])) pool.push(d.translations[transLang]);
  });
  // backfill deterministically if dedupe left us short
  let salt = 0;
  while (pool.length < 4) {
    const cand = seededShuffle(CHALLENGE_WORDS, q.word + transLang + salt)[0].translations[transLang];
    if (cand && !pool.includes(cand)) pool.push(cand);
    salt++;
    if (salt > 40) break;
  }
  const options = seededShuffle(pool, q.word + transLang);
  return { type: "translate", word: q.word, options, correct: options.indexOf(correct) };
}

function Avatar({ name, me, size = 44 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: me ? GRAD : V.surface2, border: me ? "none" : `1px solid ${V.border}`, color: me ? "#fff" : V.text, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: size * 0.42, flexShrink: 0 }}>
      {(name || "?").trim().charAt(0).toUpperCase()}
    </div>
  );
}

function TimerRing({ fraction }) {
  const r = 24, C = 2 * Math.PI * r;
  const danger = fraction < 0.25;
  return (
    <svg width="58" height="58" viewBox="0 0 58 58" style={{ flexShrink: 0 }}>
      <circle cx="29" cy="29" r={r} fill="none" stroke="var(--track)" strokeWidth="5" />
      <circle cx="29" cy="29" r={r} fill="none" stroke={danger ? "var(--bad)" : "var(--accent)"} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={C * (1 - fraction)} transform="rotate(-90 29 29)" style={{ transition: "stroke-dashoffset .1s linear, stroke .3s ease" }} />
      <text x="29" y="34" textAnchor="middle" fontSize="15" fontWeight="800" fill={danger ? "var(--bad)" : "var(--text)"} fontFamily="inherit">
        {Math.ceil(fraction * QUESTION_SECONDS)}
      </text>
    </svg>
  );
}

export default function VocabChallenge({ lang = "en", session, displayName, joinRoomId, onExit }) {
  const t = (en, uz) => (lang === "uz" ? uz : en);
  const myId = session && session.user ? session.user.id : null;

  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [errMsg, setErrMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [transLang, setTransLang] = useState(lang === "uz" ? "uz" : "en");
  const [countLeft, setCountLeft] = useState(3);
  const [started, setStarted] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(-1);
  const [frac, setFrac] = useState(1);
  const [myDone, setMyDone] = useState(false);
  const [opp, setOpp] = useState(null); // { userId, qIdx, score, done } via broadcast

  const bcRef = useRef(null);
  const qStartRef = useRef(0);
  const advanceRef = useRef(null);
  const flippedRef = useRef(false);

  const roomId = room ? room.id : null;

  // ── personalized view of the shared question set ──
  const questions = useMemo(() => {
    if (!room || !Array.isArray(room.questions)) return [];
    return room.questions.map((q, i) => personalizeQuestion(q, transLang, i));
  }, [room && room.questions, transLang]);

  const me = players.find((p) => p.user_id === myId);
  const foe = players.find((p) => p.user_id !== myId);
  const oppState = opp || (foe ? { qIdx: 0, score: foe.score || 0, done: !!foe.done } : null);
  const bothReady = players.length >= 2 && players.every((p) => p.ready);
  const isHost = room && myId && room.host_id === myId;
  const oppDone = !!(oppState && oppState.done) || !!(foe && foe.done);
  const finished = (room && room.status === "finished") || (myDone && oppDone);

  const fetchPlayers = useCallback(async (rid) => {
    const { data } = await supabase.from("vocab_room_players").select("*").eq("room_id", rid).order("joined_at");
    if (data) setPlayers(data);
  }, []);

  // ── realtime wiring: one DB-changes channel + one low-latency broadcast channel ──
  useEffect(() => {
    if (!roomId || !supabase) return;
    fetchPlayers(roomId);
    const db = supabase
      .channel(`vc-db-${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "vocab_rooms", filter: `id=eq.${roomId}` }, (payload) => {
        if (payload.new) setRoom((r) => ({ ...r, ...payload.new }));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "vocab_room_players", filter: `room_id=eq.${roomId}` }, () => fetchPlayers(roomId))
      .subscribe();
    const bc = supabase
      .channel(`vocab-room-${roomId}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "progress" }, ({ payload }) => {
        if (payload && payload.userId !== myId) setOpp(payload);
      })
      .subscribe();
    bcRef.current = bc;
    return () => {
      // CRITICAL: release both channels when leaving the game screen
      supabase.removeChannel(db);
      supabase.removeChannel(bc);
      bcRef.current = null;
    };
  }, [roomId, myId, fetchPlayers]);

  // ── auto-join via shared link ──
  useEffect(() => {
    if (!joinRoomId || !myId || room) return;
    (async () => {
      setBusy(true); setErrMsg("");
      const { data: r, error } = await supabase.from("vocab_rooms").select("*").eq("id", joinRoomId).single();
      if (error || !r) { setErrMsg(t("Room not found. Ask your friend for a new link.", "Xona topilmadi. Do'stingizdan yangi havola so'rang.")); setBusy(false); return; }
      const { data: existing } = await supabase.from("vocab_room_players").select("*").eq("room_id", r.id);
      const mine = (existing || []).find((p) => p.user_id === myId);
      if (!mine) {
        if ((existing || []).length >= 2) { setErrMsg(t("This room is already full.", "Bu xona allaqachon to'lgan.")); setBusy(false); return; }
        if (r.status !== "waiting") { setErrMsg(t("This match has already started.", "Bu o'yin allaqachon boshlangan.")); setBusy(false); return; }
        await supabase.from("vocab_room_players").insert({ room_id: r.id, user_id: myId, display_name: displayName });
      }
      setRoom(r); setBusy(false);
    })();
  }, [joinRoomId, myId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function createRoom() {
    if (!myId) return;
    setBusy(true); setErrMsg("");
    const questions = buildQuestions();
    const { data: r, error } = await supabase.from("vocab_rooms").insert({ host_id: myId, status: "waiting", questions }).select().single();
    if (error || !r) { setErrMsg(t("Could not create a room. Check that the challenge tables exist.", "Xona yaratib bo'lmadi. Jadval mavjudligini tekshiring.")); setBusy(false); return; }
    await supabase.from("vocab_room_players").insert({ room_id: r.id, user_id: myId, display_name: displayName });
    setRoom(r); setBusy(false);
  }

  async function setReady() {
    if (!me) return;
    await supabase.from("vocab_room_players").update({ ready: true }).eq("id", me.id);
  }

  // host flips waiting → countdown once both are ready, stamping a shared start time
  useEffect(() => {
    if (!room || room.status !== "waiting" || !bothReady || !isHost) return;
    const startAt = new Date(Date.now() + COUNTDOWN_MS).toISOString();
    supabase.from("vocab_rooms").update({ status: "countdown", started_at: startAt }).eq("id", room.id).then(() => {});
  }, [room && room.status, bothReady, isHost]); // eslint-disable-line react-hooks/exhaustive-deps

  // synced countdown driven by the timestamp stored in the room row
  useEffect(() => {
    if (!room || room.status !== "countdown" || !room.started_at || started) return;
    const target = new Date(room.started_at).getTime();
    const id = setInterval(() => {
      const ms = target - Date.now();
      if (ms <= 0) {
        clearInterval(id);
        setStarted(true);
        qStartRef.current = Date.now();
        if (isHost) supabase.from("vocab_rooms").update({ status: "playing" }).eq("id", room.id).then(() => {});
      } else {
        setCountLeft(Math.ceil(ms / 1000));
      }
    }, 100);
    return () => clearInterval(id);
  }, [room && room.status, room && room.started_at, started, isHost]); // eslint-disable-line react-hooks/exhaustive-deps

  const broadcast = useCallback((payload) => {
    const ch = bcRef.current;
    if (ch) ch.send({ type: "broadcast", event: "progress", payload: { userId: myId, ...payload } });
  }, [myId]);

  const finishMatch = useCallback(async (finalScore) => {
    setMyDone(true);
    broadcast({ qIdx: QUESTION_COUNT, score: finalScore, done: true });
    if (me) await supabase.from("vocab_room_players").update({ score: finalScore, done: true }).eq("id", me.id);
  }, [me, broadcast]);

  // host closes the room once both players are done
  useEffect(() => {
    if (!isHost || !room || room.status === "finished") return;
    if (myDone && oppDone) supabase.from("vocab_rooms").update({ status: "finished" }).eq("id", room.id).then(() => {});
  }, [isHost, myDone, oppDone, room && room.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = useCallback((i) => {
    if (flippedRef.current || myDone) return;
    flippedRef.current = true;
    const q = questions[qIdx];
    const elapsed = (Date.now() - qStartRef.current) / 1000;
    const remainFrac = Math.max(0, 1 - elapsed / QUESTION_SECONDS);
    const correct = i === q.correct;
    const gained = correct ? BASE_POINTS + Math.round(SPEED_BONUS * remainFrac) : 0;
    const newScore = score + gained;
    setPicked(i === -1 ? -2 : i); setScore(newScore); // -2 = timed out: reveal answer without marking a pick
    broadcast({ qIdx: qIdx + 1, score: newScore, done: qIdx + 1 >= questions.length });
    advanceRef.current = setTimeout(() => {
      flippedRef.current = false;
      setPicked(-1);
      if (qIdx + 1 >= questions.length) { finishMatch(newScore); }
      else { setQIdx(qIdx + 1); qStartRef.current = Date.now(); setFrac(1); }
    }, 750);
  }, [questions, qIdx, score, myDone, broadcast, finishMatch]);

  // per-question timer
  useEffect(() => {
    if (!started || myDone || finished || picked !== -1) return;
    const id = setInterval(() => {
      const f = Math.max(0, 1 - (Date.now() - qStartRef.current) / 1000 / QUESTION_SECONDS);
      setFrac(f);
      if (f <= 0) answer(-1); // time out = wrong
    }, 100);
    return () => clearInterval(id);
  }, [started, qIdx, myDone, finished, picked, answer]);

  useEffect(() => () => { if (advanceRef.current) clearTimeout(advanceRef.current); }, []);

  const shareLink = roomId && typeof window !== "undefined" ? `${window.location.origin}/?vocabRoom=${roomId}` : "";
  function copyLink() { try { navigator.clipboard.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch (e) {} }

  const backBtn = (
    <button onClick={onExit} style={btn({ background: "transparent", color: V.muted, fontSize: 13, padding: "6px 2px" })}>← {t("Back to Vocab", "Lug'atga qaytish")}</button>
  );

  // ════════ SCREEN 1 — ENTRY ════════
  if (!room) {
    return (
      <div className="anim" style={{ maxWidth: 480, margin: "10px auto" }}>
        {backBtn}
        <div style={{ background: V.promptBg, color: V.promptText, borderRadius: 22, padding: "30px 26px", textAlign: "center", boxShadow: V.shadow, marginTop: 10 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚔️</div>
          <h2 style={{ fontFamily: serif, fontSize: 26, margin: "0 0 6px" }}>{t("Vocab Challenge", "Lug'at bellashuvi")}</h2>
          <p style={{ fontSize: 13.5, opacity: 0.75, lineHeight: 1.6, margin: "0 0 22px" }}>
            {t("20 questions. 12 seconds each. Fastest correct answer wins the round — invite a friend and settle it live.", "20 ta savol. Har biriga 12 soniya. Eng tez to'g'ri javob g'olib — do'stingizni chaqiring va jonli bellashing.")}
          </p>
          <button onClick={createRoom} disabled={busy || !myId} style={btn({ width: "100%", padding: "15px", borderRadius: 13, background: GRAD, color: "#fff", fontSize: 15, boxShadow: "0 10px 26px rgba(109,79,224,0.35)", opacity: busy || !myId ? 0.7 : 1 })}>
            {busy ? t("Creating…", "Yaratilmoqda…") : t("Create a room →", "Xona yaratish →")}
          </button>
          {!myId && <p style={{ fontSize: 12, color: "#FFD9A0", margin: "10px 0 0" }}>{t("Sign in to play live matches.", "Jonli o'yin uchun tizimga kiring.")}</p>}
          <p style={{ fontSize: 12, opacity: 0.55, margin: "14px 0 0" }}>
            {t("Got a link from a friend? Just open it — you'll join automatically.", "Do'stingizdan havola oldingizmi? Uni oching — avtomatik qo'shilasiz.")}
          </p>
        </div>
        {errMsg && <p style={{ color: V.bad, fontSize: 13, textAlign: "center", marginTop: 12 }}>{errMsg}</p>}
        {busy && joinRoomId && <p style={{ color: V.muted, fontSize: 13, textAlign: "center", marginTop: 12 }}>{t("Joining room…", "Xonaga qo'shilmoqda…")}</p>}
      </div>
    );
  }

  // ════════ SCREEN 5 — RESULTS ════════
  if (finished) {
    const myFinal = score;
    const oppFinal = oppState ? oppState.score : (foe ? foe.score || 0 : 0);
    const iWon = myFinal > oppFinal, tie = myFinal === oppFinal;
    return (
      <div className="anim" style={{ maxWidth: 480, margin: "16px auto", textAlign: "center", position: "relative" }}>
        <style>{`
          @keyframes vcburst { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-110px) scale(1.6) rotate(30deg); opacity: 0; } }
          .vc-conf span { position: absolute; font-size: 22px; animation: vcburst 1.4s ease-out both; }
        `}</style>
        {iWon && (
          <div className="vc-conf" aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {["🎉", "✨", "🏆", "🎊", "⭐", "✨", "🎉", "🎊"].map((e, i) => (
              <span key={i} style={{ left: `${8 + i * 12}%`, top: "38%", animationDelay: `${i * 0.12}s` }}>{e}</span>
            ))}
          </div>
        )}
        <div style={{ fontSize: 52, marginBottom: 6 }}>{tie ? "🤝" : iWon ? "🏆" : "💪"}</div>
        <h2 style={{ fontFamily: serif, fontSize: 27, color: V.text, margin: "0 0 4px" }}>
          {tie ? t("It's a tie!", "Durrang!") : iWon ? t("You win!", "Siz yutdingiz!") : t(`${(foe && foe.display_name) || "Opponent"} wins!`, `${(foe && foe.display_name) || "Raqib"} yutdi!`)}
        </h2>
        <p style={{ fontSize: 13.5, color: V.muted, margin: "0 0 22px" }}>{t("Great match — every round makes your vocab stronger.", "Zo'r bellashuv — har bir raund lug'atingizni mustahkamlaydi.")}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
          {[{ n: displayName, s: myFinal, mine: true }, { n: (foe && foe.display_name) || t("Opponent", "Raqib"), s: oppFinal, mine: false }].map((p, i) => (
            <div key={i} style={{ flex: 1, maxWidth: 190, background: V.surface, border: `2px solid ${p.s >= Math.max(myFinal, oppFinal) && !tie ? "var(--accent)" : V.border}`, borderRadius: 18, padding: "18px 14px", boxShadow: V.shadow }}>
              <Avatar name={p.n} me={p.mine} size={46} />
              <div style={{ fontSize: 13, fontWeight: 700, color: V.text, marginTop: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.mine ? t("You", "Siz") : p.n}</div>
              <div style={{ fontFamily: serif, fontSize: 30, color: p.s >= Math.max(myFinal, oppFinal) ? "var(--accent)" : V.muted, marginTop: 2 }}>{p.s}</div>
              <div style={{ fontSize: 10.5, color: V.faint, fontWeight: 700, letterSpacing: 1 }}>{t("POINTS", "OCHKO")}</div>
            </div>
          ))}
        </div>
        <button onClick={onExit} style={btn({ padding: "14px 26px", borderRadius: 12, background: GRAD, color: "#fff", fontSize: 14.5, boxShadow: "0 8px 20px rgba(109,79,224,0.3)" })}>
          {t("Back to Vocab", "Lug'atga qaytish")}
        </button>
      </div>
    );
  }

  // ════════ SCREEN 3 — COUNTDOWN ════════
  if (room.status === "countdown" && !started) {
    return (
      <div className="anim" style={{ maxWidth: 480, margin: "60px auto", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: V.muted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 10px" }}>{t("Get ready", "Tayyorlaning")}</p>
        <div key={countLeft} className="cardin" style={{ fontFamily: serif, fontSize: 110, lineHeight: 1, color: "var(--accent)" }}>{countLeft}</div>
      </div>
    );
  }

  // ════════ SCREEN 4 — LIVE MATCH ════════
  if (started && !myDone) {
    const q = questions[qIdx];
    if (!q) return null;
    const qLabel = q.type === "translate"
      ? (transLang === "ru" ? `Что такое "${q.word}"?` : transLang === "uz" ? `"${q.word}" nima?` : `What is "${q.word}"?`)
      : q.type === "define"
        ? t(`What does "${q.word}" mean?`, `"${q.word}" nimani anglatadi?`)
        : t("Choose the word that fits the gap:", "Bo'sh joyga mos so'zni tanlang:");
    const header = (who, name, idx, sc, mine) => (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar name={name} me={mine} size={30} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: V.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{who}</div>
            <div style={{ fontSize: 10.5, color: V.faint, fontWeight: 700 }}>Q{Math.min(idx + 1, QUESTION_COUNT)}/{QUESTION_COUNT}</div>
          </div>
          <div style={{ fontFamily: serif, fontSize: 19, color: mine ? "var(--accent)" : V.text }}>{sc}</div>
        </div>
        <div style={{ height: 5, borderRadius: 99, background: V.track, marginTop: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(Math.min(idx, QUESTION_COUNT) / QUESTION_COUNT) * 100}%`, background: mine ? GRAD : V.faint, borderRadius: 99, transition: "width .3s ease" }} />
        </div>
      </div>
    );
    return (
      <div className="anim" style={{ maxWidth: 560, margin: "0 auto" }}>
        {/* head-to-head bar */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", background: V.surface, border: `1px solid ${V.border}`, borderRadius: 16, padding: "12px 14px", marginBottom: 14, boxShadow: "0 6px 22px rgba(36,30,51,0.05)" }}>
          {header(t("You", "Siz"), displayName, qIdx, score, true)}
          <div style={{ fontFamily: serif, fontSize: 15, color: V.faint, paddingTop: 6 }}>{t("vs", "vs")}</div>
          {header((foe && foe.display_name) || t("Opponent", "Raqib"), (foe && foe.display_name) || "?", oppState ? oppState.qIdx : 0, oppState ? oppState.score : 0, false)}
        </div>

        {/* question card */}
        <div key={qIdx} className="cardin" style={{ background: V.promptBg, color: V.promptText, borderRadius: 20, padding: "22px 22px 24px", boxShadow: V.shadow, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", background: GRAD, padding: "5px 11px", borderRadius: 99 }}>
              {q.type === "define" ? t("Definition", "Ta'rif") : q.type === "gap" ? t("Gap-fill", "Bo'sh joy") : t("Translate", "Tarjima")}
            </span>
            <TimerRing fraction={frac} />
          </div>
          <p style={{ fontSize: 13, opacity: 0.65, margin: "0 0 6px" }}>{qLabel}</p>
          <p style={{ fontFamily: serif, fontSize: q.type === "gap" ? 19 : 26, lineHeight: 1.4, margin: 0 }}>
            {q.type === "gap" ? q.prompt : q.type === "define" ? q.word : q.word}
          </p>
        </div>

        {/* answers 2x2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {q.options.map((opt, i) => {
            const revealed = picked !== -1;
            const isCorrect = i === q.correct;
            const isPicked = i === picked;
            let bg = V.surface, border = V.border, color = V.text;
            if (revealed && isCorrect) { bg = "rgba(47,185,138,0.12)"; border = "var(--good)"; color = "var(--good)"; }
            else if (revealed && isPicked && !isCorrect) { bg = "rgba(226,85,75,0.10)"; border = "var(--bad)"; color = "var(--bad)"; }
            return (
              <button key={i} onClick={() => picked === -1 && answer(i)} disabled={revealed}
                style={btn({ padding: "15px 14px", borderRadius: 14, background: bg, border: `1.5px solid ${border}`, color, fontSize: 14, lineHeight: 1.4, textAlign: "left", minHeight: 56, boxShadow: revealed ? "none" : "0 4px 14px rgba(36,30,51,0.05)" })}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // waiting for opponent to finish
  if (started && myDone && !finished) {
    return (
      <div className="anim" style={{ maxWidth: 440, margin: "50px auto", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>⏳</div>
        <h3 style={{ fontFamily: serif, fontSize: 22, color: V.text, margin: "0 0 6px" }}>{t("You finished!", "Siz tugatdingiz!")}</h3>
        <p style={{ fontSize: 14, color: V.muted, margin: "0 0 18px" }}>
          {t("Waiting for your opponent…", "Raqibingiz kutilmoqda…")} {oppState ? `(Q${Math.min(oppState.qIdx + 1, QUESTION_COUNT)}/${QUESTION_COUNT})` : ""}
        </p>
        <div style={{ fontFamily: serif, fontSize: 34, color: "var(--accent)" }}>{score} <span style={{ fontSize: 14, color: V.faint }}>{t("points", "ochko")}</span></div>
      </div>
    );
  }

  // ════════ SCREEN 2 — LOBBY ════════
  const TRANS_LANGS = [["en", "🇬🇧 EN"], ["uz", "🇺🇿 UZ"], ["ru", "🇷🇺 RU"]];
  return (
    <div className="anim" style={{ maxWidth: 480, margin: "10px auto" }}>
      {backBtn}
      <div style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 22, padding: "24px 22px", boxShadow: V.shadow, marginTop: 10 }}>
        <h3 style={{ fontFamily: serif, fontSize: 21, color: V.text, margin: "0 0 16px", textAlign: "center" }}>⚔️ {t("Match lobby", "O'yin xonasi")}</h3>

        {/* players */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 18 }}>
          {[me, foe].map((p, i) => (
            <div key={i} style={{ flex: 1, maxWidth: 190, textAlign: "center", background: V.surface2, borderRadius: 16, padding: "16px 12px", border: `1px solid ${p && p.ready ? "var(--good)" : V.border2}`, animation: !p ? "pulseRing 1.8s ease-in-out infinite" : "none" }}>
              {p ? (
                <>
                  <Avatar name={p.display_name} me={p.user_id === myId} size={44} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: V.text, marginTop: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.user_id === myId ? t("You", "Siz") : p.display_name}
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: p.ready ? "var(--good)" : V.faint, marginTop: 4 }}>
                    {p.ready ? "✓ " + t("Ready", "Tayyor") : t("Not ready", "Tayyor emas")}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", border: `2px dashed ${V.border}`, margin: "0 auto" }} />
                  <div style={{ fontSize: 12, color: V.faint, marginTop: 8 }}>{t("Waiting for opponent…", "Raqib kutilmoqda…")}</div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* share link (only until opponent arrives) */}
        {!foe && shareLink && (
          <div style={{ background: V.surface2, borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: V.muted, marginBottom: 8 }}>{t("Invite a friend", "Do'stni taklif qiling")}</div>
            <div style={{ fontSize: 12, color: V.text, background: V.surface, border: `1px solid ${V.border}`, borderRadius: 9, padding: "9px 11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 10 }}>{shareLink}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={copyLink} style={btn({ flex: 1, padding: "11px", borderRadius: 10, background: V.text, color: V.bg || "#fff", fontSize: 13 })}>
                {copied ? "✓ " + t("Copied", "Nusxalandi") : t("Copy link", "Havolani nusxalash")}
              </button>
              <a href={`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(t("Beat me in a live IELTS vocab battle! ⚔️", "IELTS lug'at bellashuvida meni yengib ko'r! ⚔️"))}`} target="_blank" rel="noreferrer"
                style={{ ...btn({ flex: 1, padding: "11px", borderRadius: 10, background: "#2AABEE", color: "#fff", fontSize: 13 }), display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none" }}>
                ✈ Telegram
              </a>
            </div>
          </div>
        )}

        {/* per-player translate language */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: V.muted, marginBottom: 8 }}>{t("Translate questions into:", "Tarjima savollari tili:")}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {TRANS_LANGS.map(([k, l]) => (
              <button key={k} onClick={() => setTransLang(k)} style={btn({ flex: 1, padding: "10px", borderRadius: 99, fontSize: 13, background: transLang === k ? GRAD : V.surface2, color: transLang === k ? "#fff" : V.muted, border: `1px solid ${transLang === k ? "transparent" : V.border}` })}>{l}</button>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: V.faint, margin: "8px 0 0", lineHeight: 1.5 }}>
            {transLang === "en"
              ? t("Translate rounds will become extra English questions for you.", "Tarjima raundlari siz uchun qo'shimcha inglizcha savollarga aylanadi.")
              : t("Only you see this language — your opponent picks their own.", "Bu tilni faqat siz ko'rasiz — raqibingiz o'zinikini tanlaydi.")}
          </p>
        </div>

        <button onClick={setReady} disabled={!me || (me && me.ready)}
          style={btn({ width: "100%", padding: "15px", borderRadius: 13, background: me && me.ready ? V.surface2 : GRAD, color: me && me.ready ? V.faint : "#fff", fontSize: 15, boxShadow: me && me.ready ? "none" : "0 10px 26px rgba(109,79,224,0.35)" })}>
          {me && me.ready ? t("Waiting for opponent to ready up…", "Raqib tayyor bo'lishi kutilmoqda…") : t("I'm ready →", "Men tayyorman →")}
        </button>
      </div>
      {errMsg && <p style={{ color: V.bad, fontSize: 13, textAlign: "center", marginTop: 12 }}>{errMsg}</p>}
    </div>
  );
}
