"use client";

import React, { useState } from "react";
import { supabase } from "./lib/supabase";

const LEVELS = ["Beginner", "4.5 – 5.0", "5.5 – 6.0", "6.5 – 7.0", "7.5+", "Not sure"];
const TARGETS = [5.5, 6, 6.5, 7, 7.5, 8];

export default function Auth({ C, lang, onLang }) {
  const t = (en, uz) => (lang === "uz" ? uz : en);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [level, setLevel] = useState("");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function submit() {
    setErr(""); setMsg("");
    if (!email.trim() || !pass) { setErr(t("Enter email and password.", "Email va parolni kiriting.")); return; }
    if (pass.length < 6) { setErr(t("Password must be at least 6 characters.", "Parol kamida 6 ta belgi bo'lishi kerak.")); return; }
    if (mode === "signup") {
      if (!name.trim()) { setErr(t("Please enter your name.", "Ismingizni kiriting.")); return; }
      if (!phone.trim()) { setErr(t("Please enter your phone number.", "Telefon raqamingizni kiriting.")); return; }
    }
    if (!supabase) { setErr(t("Auth is not configured.", "Auth sozlanmagan.")); return; }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: pass });
        if (error) throw error;
        const uid = data.user && data.user.id;
        if (uid) {
          await supabase.from("profiles").insert({
            user_id: uid, email: email.trim(), full_name: name.trim(), phone: phone.trim(),
            level: level || null, target: target ? Number(target) : null,
          });
        }
        setMsg(t("Account created! Signing you in…", "Hisob yaratildi! Kirilmoqda…"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
        if (error) throw error;
      }
    } catch (e) {
      const m = (e && e.message) || "";
      if (/already registered/i.test(m)) setErr(t("This email is already registered. Try logging in.", "Bu email ro'yxatdan o'tgan. Kiring."));
      else if (/invalid login/i.test(m)) setErr(t("Wrong email or password.", "Email yoki parol noto'g'ri."));
      else setErr(m || t("Something went wrong.", "Xatolik yuz berdi."));
      setBusy(false);
    }
  }

  const input = { width: "100%", padding: "12px 14px", border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 15, outline: "none", color: C.ink, background: C.card, marginBottom: 12, fontFamily: "inherit" };

  return (
    <main style={{ minHeight: "100vh", background: C.paper, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}} input:focus,select:focus{box-shadow:0 0 0 3px rgba(255,90,77,.16)}`}</style>
      <div style={{ width: 390, maxWidth: "100%", animation: "fadeUp .45s ease both" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ width: 16, height: 16, background: C.coral, borderRadius: 3, transform: "rotate(45deg)" }} />
          <span style={{ fontFamily: "Fraunces, serif", fontWeight: 900, fontSize: 24, color: C.ink }}>IELTS Writing Coach</span>
        </div>
        <p style={{ textAlign: "center", color: C.slate, fontSize: 14, margin: "0 0 22px" }}>{t("Sign in to track your progress", "Natijalaringizni kuzatish uchun kiring")}</p>

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", gap: 4, background: C.paper, borderRadius: 10, padding: 4, marginBottom: 18 }}>
            {[["login", t("Log in", "Kirish")], ["signup", t("Sign up", "Ro'yxatdan o'tish")]].map(([k, l]) => (
              <button key={k} onClick={() => { setMode(k); setErr(""); setMsg(""); }} style={{ flex: 1, padding: "9px", borderRadius: 8, fontSize: 14, border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit", background: mode === k ? C.navy : "transparent", color: mode === k ? "#fff" : C.slate }}>{l}</button>
            ))}
          </div>

          {mode === "signup" && (
            <>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Full name *", "To'liq ism *")} style={input} />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder={t("Phone number *", "Telefon raqam *")} style={input} />
              <div style={{ display: "flex", gap: 10 }}>
                <select value={level} onChange={(e) => setLevel(e.target.value)} style={{ ...input, flex: 1, cursor: "pointer" }}>
                  <option value="">{t("Current level", "Hozirgi daraja")}</option>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <select value={target} onChange={(e) => setTarget(e.target.value)} style={{ ...input, flex: 1, cursor: "pointer" }}>
                  <option value="">{t("Target band", "Maqsad band")}</option>
                  {TARGETS.map((b) => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                </select>
              </div>
            </>
          )}

          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" style={input} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
          <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" placeholder={t("Password (min 6)", "Parol (kamida 6)")} style={input} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />

          {err && <p style={{ color: C.red, fontSize: 13, margin: "0 0 10px" }}>{err}</p>}
          {msg && <p style={{ color: C.green, fontSize: 13, margin: "0 0 10px" }}>{msg}</p>}

          <button onClick={submit} disabled={busy} style={{ width: "100%", padding: "13px", borderRadius: 10, fontSize: 15, border: "none", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", background: C.coral, color: "#fff", opacity: busy ? .8 : 1 }}>
            {busy ? t("Please wait…", "Kuting…") : mode === "signup" ? t("Create account", "Hisob yaratish") : t("Log in", "Kirish")}
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
          {[["en", "EN"], ["uz", "UZ"]].map(([k, l]) => (
            <button key={k} onClick={() => onLang(k)} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, border: `1px solid ${C.line}`, cursor: "pointer", fontWeight: 600, fontFamily: "inherit", background: lang === k ? C.navy : "transparent", color: lang === k ? "#fff" : C.slate }}>{l}</button>
          ))}
        </div>
      </div>
    </main>
  );
}
