"use client";
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
import { buildQuestions } from "./VocabChallenge";

const V = {
  bg: "var(--app-bg)", surface: "var(--surface)", surface2: "var(--surface-2)",
  text: "var(--text)", muted: "var(--muted)", faint: "var(--faint)",
  border: "var(--border)", border2: "var(--border-2)",
  accent: "var(--accent)", accent2: "var(--accent2)", accentSoft: "var(--accent-soft)",
  good: "var(--good)", bad: "var(--bad)", shadow: "var(--shadow)",
};
const GRAD = "linear-gradient(120deg,var(--accent),var(--accent2))";
const serif = "'DM Serif Display', serif";
const btn = (extra = {}) => ({ cursor: "pointer", border: "none", fontWeight: 700, fontFamily: "inherit", transition: "all .18s ease", ...extra });

function Avatar({ name, size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: V.surface2, border: `1px solid ${V.border}`, color: V.text, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: size * 0.42, flexShrink: 0 }}>
      {(name || "?").trim().charAt(0).toUpperCase()}
    </div>
  );
}

export default function VocabFriends({ lang = "en", myId, displayName, myFriendCode, onBack, onChallengeCreated }) {
  const t = (en, uz) => (lang === "uz" ? uz : en);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [friendships, setFriendships] = useState([]); // all rows involving me
  const [busyId, setBusyId] = useState(null);
  const [errMsg, setErrMsg] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  const refresh = useCallback(async () => {
    if (!myId) return;
    const { data } = await supabase.from("friendships").select("*").or(`user_id.eq.${myId},friend_id.eq.${myId}`);
    setFriendships(data || []);
  }, [myId]);

  useEffect(() => {
    refresh();
    if (!myId) return;
    // CRITICAL: unsubscribe on unmount to avoid leaked Realtime connections
    const ch = supabase
      .channel(`friendships-${myId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships", filter: `user_id=eq.${myId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships", filter: `friend_id=eq.${myId}` }, refresh)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [myId, refresh]);

  const incoming = friendships.filter((f) => f.friend_id === myId && f.status === "pending");
  const accepted = friendships.filter((f) => f.status === "accepted");

  function statusFor(userId) {
    const row = friendships.find((f) => (f.user_id === myId && f.friend_id === userId) || (f.friend_id === myId && f.user_id === userId));
    if (!row) return null;
    return row.status === "accepted" ? "friends" : (row.user_id === myId ? "sent" : "incoming");
  }

  async function search() {
    const q = query.trim();
    if (q.length < 3) { setResults(null); return; }
    setSearching(true); setErrMsg("");
    // search_friend_candidates returns ONLY user_id/full_name/friend_code — no phone, no email, nothing else
    const { data, error } = await supabase.rpc("search_friend_candidates", { q });
    if (error) { setErrMsg(t("Search failed. Please try again.", "Qidiruv xato berdi. Qaytadan urining.")); setResults([]); }
    else setResults(data || []);
    setSearching(false);
  }

  // debounced search-as-you-type, mirroring the 3-char minimum the DB function itself enforces
  useEffect(() => {
    if (query.trim().length < 3) { setResults(null); return; }
    const id = setTimeout(() => { search(); }, 300);
    return () => clearTimeout(id);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  function copyCode() {
    if (!myFriendCode) return;
    try { navigator.clipboard.writeText(`IELTS-${myFriendCode}`); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 1600); } catch (e) {}
  }

  async function sendRequest(target) {
    setBusyId(target.user_id); setErrMsg("");
    const { error } = await supabase.from("friendships").insert({
      user_id: myId, friend_id: target.user_id, status: "pending",
      user_name: displayName, friend_name: target.full_name,
    });
    if (!error) refresh();
    setBusyId(null);
  }
  async function acceptRequest(row) {
    setBusyId(row.id);
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", row.id);
    await refresh();
    setBusyId(null);
  }
  async function declineRequest(row) {
    setBusyId(row.id);
    await supabase.from("friendships").delete().eq("id", row.id);
    await refresh();
    setBusyId(null);
  }

  async function challenge(row) {
    const friendId = row.user_id === myId ? row.friend_id : row.user_id;
    const friendName = row.user_id === myId ? row.friend_name : row.user_name;
    setBusyId(row.id); setErrMsg("");
    const questions = buildQuestions();
    const { data: r, error } = await supabase.from("vocab_rooms").insert({ host_id: myId, status: "waiting", questions }).select().single();
    if (error || !r) { setErrMsg(t("Could not create a challenge. Please try again.", "Bellashuv yaratib bo'lmadi. Qaytadan urining.")); setBusyId(null); return; }
    await supabase.from("vocab_room_players").insert([
      { room_id: r.id, user_id: myId, display_name: displayName },
      { room_id: r.id, user_id: friendId, display_name: friendName },
    ]);
    await supabase.from("vocab_challenge_invites").insert({ room_id: r.id, from_user: myId, to_user: friendId, status: "pending" });
    setBusyId(null);
    onChallengeCreated(r);
  }

  return (
    <div className="anim" style={{ maxWidth: 480, margin: "10px auto" }}>
      <button onClick={onBack} style={btn({ background: "transparent", color: V.muted, fontSize: 13, padding: "6px 2px" })}>← {t("Back", "Orqaga")}</button>

      <h2 style={{ fontFamily: serif, fontSize: 22, color: V.text, margin: "14px 0 16px", textAlign: "center" }}>👥 {t("Friends", "Do'stlar")}</h2>

      {/* your own friend code */}
      {myFriendCode && (
        <div style={{ background: V.promptBg || "var(--prompt-bg)", color: V.promptText || "var(--prompt-text)", borderRadius: 16, padding: "14px 16px", marginBottom: 16, boxShadow: "0 6px 22px rgba(36,30,51,0.08)" }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", opacity: 0.7, marginBottom: 6 }}>{t("Your friend code", "Sizning do'st kodingiz")}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: serif, fontSize: 20, letterSpacing: 1 }}>IELTS-{myFriendCode}</span>
            <button onClick={copyCode} style={btn({ padding: "7px 12px", borderRadius: 9, background: "rgba(255,255,255,0.14)", color: "inherit", fontSize: 12 })}>{codeCopied ? "✓ " + t("Copied", "Nusxalandi") : t("Copy", "Nusxalash")}</button>
            <a href={`https://t.me/share/url?url=&text=${encodeURIComponent(t(`Add me on IELTS Coach! My friend code: IELTS-${myFriendCode}`, `IELTS Coach'da meni qo'shing! Do'st kodim: IELTS-${myFriendCode}`))}`} target="_blank" rel="noreferrer"
              style={{ ...btn({ padding: "7px 12px", borderRadius: 9, background: "#2AABEE", color: "#fff", fontSize: 12 }), textDecoration: "none" }}>✈ {t("Share", "Ulashish")}</a>
          </div>
        </div>
      )}

      {/* search / add */}
      <div style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 18, padding: 16, marginBottom: 16, boxShadow: "0 6px 22px rgba(36,30,51,0.05)" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") search(); }}
            placeholder={t("Search by name or enter a friend code", "Ism bo'yicha qidiring yoki do'st kodini kiriting")}
            style={{ flex: 1, padding: "11px 13px", border: `1px solid ${V.border}`, borderRadius: 10, fontSize: 14, outline: "none", color: V.text, background: V.surface }} />
          <button onClick={search} disabled={searching || query.trim().length < 3} style={btn({ background: GRAD, color: "#fff", padding: "11px 17px", borderRadius: 10, fontSize: 13.5, opacity: query.trim().length < 3 ? 0.6 : 1 })}>{searching ? "…" : t("Search", "Qidir")}</button>
        </div>
        {query.trim().length > 0 && query.trim().length < 3 && (
          <p style={{ fontSize: 11.5, color: V.faint, margin: "8px 0 0" }}>{t("Type at least 3 characters.", "Kamida 3 ta belgi kiriting.")}</p>
        )}
        {results !== null && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {results.length === 0 && <p style={{ fontSize: 12.5, color: V.faint, margin: "4px 0" }}>{t("No matching users.", "Mos foydalanuvchi topilmadi.")}</p>}
            {results.map((u) => {
              const st = statusFor(u.user_id);
              return (
                <div key={u.user_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px", borderTop: `1px solid ${V.border2}` }}>
                  <Avatar name={u.full_name} size={34} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: V.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.full_name || t("(no name)", "(ismsiz)")}</div>
                  {st === "friends" && <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--good)" }}>✓ {t("Friends", "Do'st")}</span>}
                  {st === "sent" && <span style={{ fontSize: 11.5, fontWeight: 700, color: V.faint }}>{t("Requested", "So'rov yuborilgan")}</span>}
                  {st === "incoming" && <span style={{ fontSize: 11.5, fontWeight: 700, color: V.accent }}>{t("Respond below", "Pastda javob bering")}</span>}
                  {!st && <button onClick={() => sendRequest(u)} disabled={busyId === u.user_id} style={btn({ padding: "7px 13px", borderRadius: 9, background: V.text, color: V.bg, fontSize: 12.5 })}>{t("Add", "Qo'shish")}</button>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* incoming requests */}
      {incoming.length > 0 && (
        <div style={{ background: V.surface, border: "1px solid var(--accent)", borderRadius: 18, padding: 16, marginBottom: 16, boxShadow: "0 6px 22px rgba(36,30,51,0.05)" }}>
          <h3 style={{ fontFamily: serif, fontSize: 16, color: V.text, margin: "0 0 10px" }}>{t(`Requests (${incoming.length})`, `So'rovlar (${incoming.length})`)}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {incoming.map((row) => (
              <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={row.user_name} size={34} />
                <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: V.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.user_name || t("(no name)", "(ismsiz)")}</div>
                <button onClick={() => acceptRequest(row)} disabled={busyId === row.id} style={btn({ padding: "7px 12px", borderRadius: 9, background: GRAD, color: "#fff", fontSize: 12.5 })}>{t("Accept", "Qabul")}</button>
                <button onClick={() => declineRequest(row)} disabled={busyId === row.id} style={btn({ padding: "7px 12px", borderRadius: 9, background: "transparent", color: V.bad, fontSize: 12.5 })}>{t("Decline", "Rad")}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* friends list */}
      <div style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 18, padding: 16, boxShadow: "0 6px 22px rgba(36,30,51,0.05)" }}>
        <h3 style={{ fontFamily: serif, fontSize: 16, color: V.text, margin: "0 0 10px" }}>{t(`My friends (${accepted.length})`, `Do'stlarim (${accepted.length})`)}</h3>
        {accepted.length === 0 && <p style={{ fontSize: 12.5, color: V.faint, margin: "4px 0" }}>{t("No friends yet — search above to add someone.", "Hali do'stlar yo'q — yuqorida qidirib toping.")}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {accepted.map((row) => {
            const name = row.user_id === myId ? row.friend_name : row.user_name;
            return (
              <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={name} size={34} />
                <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: V.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name || t("(no name)", "(ismsiz)")}</div>
                <button onClick={() => challenge(row)} disabled={busyId === row.id} style={btn({ padding: "8px 14px", borderRadius: 10, background: GRAD, color: "#fff", fontSize: 12.5, boxShadow: "0 6px 16px rgba(109,79,224,0.3)" })}>
                  {busyId === row.id ? "…" : `⚔️ ${t("Challenge", "Chaqiriq")}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {errMsg && <p style={{ color: V.bad, fontSize: 13, textAlign: "center", marginTop: 12 }}>{errMsg}</p>}
    </div>
  );
}
