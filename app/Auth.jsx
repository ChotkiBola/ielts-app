"use client";
import React, { useState } from "react";
import { supabase } from "./lib/supabase";

const coral = "#FF6A4D", orange = "#FF8A3D", amber = "#FFA524";
const ink = "#2A211E", muted = "#6B5D56", peach = "#FFECDD";
const serif = "'DM Serif Display', serif";
const sans = "'Plus Jakarta Sans', system-ui, sans-serif";

const LEVELS = ["Beginner", "4.5 – 5.0", "5.5 – 6.0", "6.5 – 7.0", "7.5+", "Not sure"];
const TARGETS = [5.5, 6, 6.5, 7, 7.5, 8];

const inp = {
  border: "1px solid rgba(42,33,30,0.14)", background: "#FFFCF9", borderRadius: 12,
  padding: "14px 16px", fontFamily: "inherit", fontSize: 15, color: ink,
  outline: "none", transition: "all .2s", width: "100%", boxSizing: "border-box",
};

export default function Auth({ lang, onLang, initialMode, onBack }) {
  const t = (en, uz) => (lang === "uz" ? uz : en);
  const [mode, setMode] = useState(initialMode || "login");
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

  const tabGrad = `linear-gradient(120deg,${coral},${orange})`;
  const isSignup = mode === "signup";

  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "linear-gradient(180deg,#FFF1E4,#FFF6ED)", fontFamily: sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&display=swap');
        @keyframes aauroraA{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(60px,-40px) scale(1.15)}}
        @keyframes aauroraB{0%,100%{transform:translate(0,0) scale(1.05)}50%{transform:translate(-50px,40px) scale(0.92)}}
        @keyframes afadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .ainp:focus{border-color:#FF6A4D!important;background:#fff!important;box-shadow:0 0 0 3px rgba(255,106,77,0.14)!important}
        .asubmit:not(:disabled):hover{transform:translateY(-2px)!important}
      `}</style>

      {/* aurora blobs */}
      <div style={{ position: "absolute", top: -120, left: -80, width: 460, height: 460, borderRadius: "50%", background: `radial-gradient(circle,${coral} 0%,rgba(255,106,77,0) 68%)`, opacity: 0.22, filter: "blur(20px)", animation: "aauroraA 14s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -140, right: -80, width: 480, height: 480, borderRadius: "50%", background: `radial-gradient(circle,${amber} 0%,rgba(255,165,36,0) 68%)`, opacity: 0.22, filter: "blur(20px)", animation: "aauroraB 17s ease-in-out infinite", pointerEvents: "none" }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 440, animation: "afadeUp .45s ease both" }}>
        {/* logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 24, height: 24, background: `linear-gradient(135deg,${coral},${amber})`, borderRadius: 6, transform: "rotate(45deg)", boxShadow: "0 4px 14px rgba(255,106,77,0.4)" }} />
            <span style={{ fontFamily: serif, fontSize: 26, color: ink }}>IELTS Writing Coach</span>
          </div>
          <p style={{ fontSize: 15, color: muted, margin: "10px 0 0" }}>{t("Sign in to track your progress","Natijalaringizni kuzatish uchun kiring")}</p>
        </div>

        {/* card */}
        <div style={{ background: "#fff", borderRadius: 22, padding: 26, boxShadow: "0 30px 70px rgba(42,33,30,0.14)", border: "1px solid rgba(42,33,30,0.05)" }}>
          {/* tab toggle */}
          <div style={{ display: "flex", background: "#FFF1E4", borderRadius: 13, padding: 5, gap: 4, marginBottom: 22 }}>
            {[["login", t("Log in","Kirish")], ["signup", t("Sign up","Ro'yxatdan o'tish")]].map(([k, l]) => (
              <button key={k} onClick={() => { setMode(k); setErr(""); setMsg(""); }}
                style={{ flex: 1, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 15, padding: 11, borderRadius: 9, background: mode === k ? tabGrad : "transparent", color: mode === k ? "#fff" : muted, boxShadow: mode === k ? "0 6px 16px rgba(255,106,77,0.35)" : "none", transition: "all .2s" }}>{l}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {isSignup && (
              <>
                <input className="ainp" value={name} onChange={e => setName(e.target.value)} placeholder={t("Full name *","To'liq ism *")} style={inp} />
                <input className="ainp" value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder={t("Phone number *","Telefon raqam *")} style={inp} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
                  <select className="ainp" value={level} onChange={e => setLevel(e.target.value)} style={{ ...inp, cursor: "pointer", color: level ? ink : muted }}>
                    <option value="">{t("Current level","Hozirgi daraja")}</option>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <select className="ainp" value={target} onChange={e => setTarget(e.target.value)} style={{ ...inp, cursor: "pointer", color: target ? ink : muted }}>
                    <option value="">{t("Target band","Maqsad band")}</option>
                    {TARGETS.map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                  </select>
                </div>
              </>
            )}
            <input className="ainp" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" style={inp} onKeyDown={e => e.key === "Enter" && submit()} />
            <input className="ainp" value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder={t("Password (min 6)","Parol (kamida 6)")} style={inp} onKeyDown={e => e.key === "Enter" && submit()} />

            {err && <p style={{ color: "#E03E2F", fontSize: 13, margin: 0 }}>{err}</p>}
            {msg && <p style={{ color: "#1F9E73", fontSize: 13, margin: 0 }}>{msg}</p>}

            <button className="asubmit" onClick={submit} disabled={busy}
              style={{ marginTop: 6, border: "none", cursor: busy ? "default" : "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 16, padding: 15, borderRadius: 13, color: "#fff", background: `linear-gradient(120deg,${coral},${orange})`, boxShadow: "0 12px 26px rgba(255,106,77,0.4)", transition: "transform .18s", opacity: busy ? 0.8 : 1 }}>
              {busy ? t("Please wait…","Kuting…") : isSignup ? t("Create account","Hisob yaratish") : t("Log in →","Kirish →")}
            </button>
          </div>
        </div>

        {/* bottom row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 22 }}>
          {onBack && (
            <button onClick={onBack} style={{ border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, color: muted }}>← {t("Home","Bosh sahifa")}</button>
          )}
          <div style={{ display: "flex", background: peach, borderRadius: 11, padding: 4, gap: 2 }}>
            {[["en","EN"],["uz","UZ"]].map(([k,l]) => (
              <button key={k} onClick={() => onLang(k)} style={{ border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, padding: "6px 13px", borderRadius: 8, background: lang === k ? ink : "transparent", color: lang === k ? "#fff" : muted, transition: "all .2s" }}>{l}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
