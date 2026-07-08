"use client";
import React, { useState, useRef, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Logo from "./Logo";

const coral = "#6D4FE0", orange = "#8B5CF6", amber = "#C13D8F";
const ink = "#241E33", muted = "#6E6580", peach = "#ECE6F6";
const serif = "'Fraunces', 'DM Serif Display', serif";
const sans = "'Plus Jakarta Sans', system-ui, sans-serif";

const LEVELS = ["Beginner", "4.5 – 5.0", "5.5 – 6.0", "6.5 – 7.0", "7.5+", "Not sure"];
const TARGETS = [5.5, 6, 6.5, 7, 7.5, 8];
const AGE_RANGES = [["under18", "Under 18", "18 dan kichik"], ["18-24", "18–24", "18–24"], ["25-34", "25–34", "25–34"], ["35+", "35+", "35+"]];

export default function Auth({ lang, onLang, initialMode, onBack }) {
  const t = (en, uz) => (lang === "uz" ? uz : en);
  const [mode, setMode] = useState(initialMode || "login");
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [level, setLevel] = useState("");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const advanceTimer = useRef(null);

  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  function switchMode(m) {
    setMode(m); setStep(1); setDir(1); setErr(""); setMsg("");
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }
  function goStep(n, d) {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setDir(d); setStep(n);
  }
  function scheduleAdvance(n) {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => { setDir(1); setStep(n); }, 250);
  }
  function skipStep1() { setGender(""); setAgeRange(""); goStep(2, 1); }
  function skipStep2() { setLevel(""); setTarget(""); goStep(3, 1); }

  async function submitLogin() {
    setErr(""); setMsg("");
    if (!email.trim() || !pass) { setErr(t("Enter email and password.", "Email va parolni kiriting.")); return; }
    if (!supabase) { setErr(t("Auth is not configured.", "Auth sozlanmagan.")); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
      if (error) throw error;
    } catch (e) {
      const m = (e && e.message) || "";
      if (/invalid login/i.test(m)) setErr(t("Wrong email or password.", "Email yoki parol noto'g'ri."));
      else setErr(m || t("Something went wrong.", "Xatolik yuz berdi."));
      setBusy(false);
    }
  }

  async function submitSignup() {
    setErr(""); setMsg("");
    if (!name.trim()) { setErr(t("Please enter your name.", "Ismingizni kiriting.")); return; }
    if (!email.trim() || !pass) { setErr(t("Enter email and password.", "Email va parolni kiriting.")); return; }
    if (pass.length < 6) { setErr(t("Password must be at least 6 characters.", "Parol kamida 6 ta belgi bo'lishi kerak.")); return; }
    if (!supabase) { setErr(t("Auth is not configured.", "Auth sozlanmagan.")); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: pass });
      if (error) throw error;
      const uid = data.user && data.user.id;
      if (uid) {
        await supabase.from("profiles").upsert({
          user_id: uid, email: email.trim(), full_name: name.trim(),
          gender: gender || null, age_range: ageRange || null,
          level: level || null, target: target ? Number(target) : null,
        }, { onConflict: "user_id" });
      }
      setMsg(t("Account created! Signing you in…", "Hisob yaratildi! Kirilmoqda…"));
    } catch (e) {
      const m = (e && e.message) || "";
      if (/already registered/i.test(m)) setErr(t("This email is already registered. Try logging in.", "Bu email ro'yxatdan o'tgan. Kiring."));
      else setErr(m || t("Something went wrong.", "Xatolik yuz berdi."));
      setBusy(false);
    }
  }

  const isSignup = mode === "signup";
  const tabGrad = `linear-gradient(120deg,${coral},${orange})`;

  const inp = {
    border: "1px solid rgba(36,30,51,0.14)", background: "#FDFCFF", borderRadius: 12,
    padding: "13px 15px", fontFamily: "inherit", fontSize: 15, color: ink,
    outline: "none", transition: "border-color .2s, box-shadow .2s",
    width: "100%", boxSizing: "border-box", display: "block",
  };

  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px", background: "linear-gradient(180deg,#F1EBFA,#F8F5FC)", fontFamily: sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&display=swap');
        @keyframes aauroraA{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(60px,-40px) scale(1.15)}}
        @keyframes aauroraB{0%,100%{transform:translate(0,0) scale(1.05)}50%{transform:translate(-50px,40px) scale(0.92)}}
        @keyframes afadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes aslideFwd{from{opacity:0;transform:translateX(22px)}to{opacity:1;transform:translateX(0)}}
        @keyframes aslideBack{from{opacity:0;transform:translateX(-22px)}to{opacity:1;transform:translateX(0)}}
        .ainp:focus{border-color:#6D4FE0!important;background:#fff!important;box-shadow:0 0 0 3px rgba(109,79,224,0.14)!important}
        @media(hover:hover){.asubmit:not(:disabled):hover{transform:translateY(-2px)!important}}

        .asel-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        @media(max-width:400px){.asel-grid{grid-template-columns:1fr}}

        .astep-fwd{animation:aslideFwd .32s cubic-bezier(.16,.84,.44,1) both}
        .astep-back{animation:aslideBack .32s cubic-bezier(.16,.84,.44,1) both}

        .aprogress-track{height:5px;border-radius:4px;background:#ECE6F6;overflow:hidden}
        .aprogress-fill{height:100%;border-radius:4px;background:${tabGrad};transition:width .35s cubic-bezier(.16,.84,.44,1)}

        .asel-card{border:1.5px solid rgba(36,30,51,0.14);background:#FDFCFF;border-radius:14px;padding:16px 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer;transition:border-color .18s ease,transform .12s ease,box-shadow .18s ease;font-family:inherit;text-align:center}
        .asel-card:hover{transform:translateY(-2px)}
        .asel-card.active{border-color:#6D4FE0;box-shadow:0 0 0 3px rgba(109,79,224,0.14);background:#fff}
        .asel-card .aicon{font-size:26px;line-height:1}
        .asel-card .alabel{font-size:13px;font-weight:700;color:${ink}}

        .alevel-card{border:1.5px solid rgba(36,30,51,0.14);background:#FDFCFF;border-radius:14px;padding:12px 8px;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;color:${ink};text-align:center;transition:border-color .18s ease,transform .12s ease,box-shadow .18s ease}
        .alevel-card:hover{transform:translateY(-2px)}
        .alevel-card.active{border-color:#6D4FE0;box-shadow:0 0 0 3px rgba(109,79,224,0.14);background:#fff;color:#5636C7}

        .achip{border:1.5px solid rgba(36,30,51,0.14);background:#FDFCFF;border-radius:999px;padding:8px 14px;font-family:inherit;font-size:12.5px;font-weight:700;color:${muted};cursor:pointer;transition:all .15s ease}
        .achip.active{background:${tabGrad};color:#fff;border-color:transparent;box-shadow:0 6px 16px rgba(109,79,224,0.3)}

        .askip{border:none;background:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;color:${muted};padding:6px 2px}
        .askip:hover{color:${ink}}
        .aback{border:none;background:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;color:${muted};padding:6px 2px;display:flex;align-items:center;gap:4px}
        .aback:hover{color:${ink}}
        .anext{border:none;cursor:pointer;font-family:inherit;font-weight:800;font-size:14px;padding:12px 22px;border-radius:12px;color:#fff;background:${tabGrad};box-shadow:0 8px 20px rgba(109,79,224,0.32);transition:transform .18s}
        @media(hover:hover){.anext:hover{transform:translateY(-2px)}}
      `}</style>

      {/* aurora blobs */}
      <div style={{ position: "absolute", top: -120, left: -80, width: 420, height: 420, borderRadius: "50%", background: `radial-gradient(circle,${coral} 0%,rgba(109,79,224,0) 68%)`, opacity: 0.20, filter: "blur(20px)", animation: "aauroraA 14s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -140, right: -80, width: 440, height: 440, borderRadius: "50%", background: `radial-gradient(circle,${amber} 0%,rgba(217,164,65,0) 68%)`, opacity: 0.20, filter: "blur(20px)", animation: "aauroraB 17s ease-in-out infinite", pointerEvents: "none" }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 420, animation: "afadeUp .45s ease both" }}>
        {/* logo */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <Logo size={24} />
            <span style={{ fontFamily: serif, fontSize: "clamp(20px,5vw,26px)", color: ink }}>IELTS Writing Coach</span>
          </div>
          <p style={{ fontSize: 14, color: muted, margin: "8px 0 0" }}>{t("Sign in to track your progress", "Natijalaringizni kuzatish uchun kiring")}</p>
        </div>

        {/* card */}
        <div style={{ background: "#fff", borderRadius: 22, padding: "22px 20px", boxShadow: "0 30px 70px rgba(36,30,51,0.13)", border: "1px solid rgba(36,30,51,0.05)" }}>
          {/* tab toggle */}
          <div style={{ display: "flex", background: "#F1EBFA", borderRadius: 13, padding: 5, gap: 4, marginBottom: 20 }}>
            {[["login", t("Log in", "Kirish")], ["signup", t("Sign up", "Ro'yxatdan o'tish")]].map(([k, l]) => (
              <button key={k} onClick={() => switchMode(k)}
                style={{ flex: 1, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, padding: "10px 8px", borderRadius: 9, background: mode === k ? tabGrad : "transparent", color: mode === k ? "#fff" : muted, boxShadow: mode === k ? "0 6px 16px rgba(109,79,224,0.32)" : "none", transition: "all .2s" }}>{l}</button>
            ))}
          </div>

          {/* progress (signup only) */}
          {isSignup && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 800, color: muted, marginBottom: 6, letterSpacing: ".04em" }}>
                <span>{t("Step", "Qadam")} {step}/3</span>
                <span>
                  {step === 1 && t("About you", "Siz haqingizda")}
                  {step === 2 && t("Your journey", "Sizning yo'lingiz")}
                  {step === 3 && t("Your account", "Hisobingiz")}
                </span>
              </div>
              <div className="aprogress-track"><div className="aprogress-fill" style={{ width: `${(step / 3) * 100}%` }} /></div>
            </div>
          )}

          {/* ===== LOGIN (single step) ===== */}
          {!isSignup && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input className="ainp" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" style={inp} onKeyDown={e => e.key === "Enter" && submitLogin()} />
              <input className="ainp" value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder={t("Password (min 6)", "Parol (kamida 6)")} style={inp} onKeyDown={e => e.key === "Enter" && submitLogin()} />
              {err && <p style={{ color: "#E03E2F", fontSize: 13, margin: 0, lineHeight: 1.4 }}>{err}</p>}
              {msg && <p style={{ color: "#1F9E73", fontSize: 13, margin: 0, lineHeight: 1.4 }}>{msg}</p>}
              <button className="asubmit" onClick={submitLogin} disabled={busy}
                style={{ marginTop: 4, border: "none", cursor: busy ? "default" : "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 15, padding: 14, borderRadius: 13, color: "#fff", background: tabGrad, boxShadow: "0 10px 24px rgba(109,79,224,0.38)", transition: "transform .18s", opacity: busy ? 0.8 : 1, width: "100%" }}>
                {busy ? t("Please wait…", "Kuting…") : t("Log in →", "Kirish →")}
              </button>
            </div>
          )}

          {/* ===== SIGNUP WIZARD ===== */}
          {isSignup && step === 1 && (
            <div key="s1" className={dir === 1 ? "astep-fwd" : "astep-back"}>
              <h3 style={{ margin: "0 0 4px", fontFamily: serif, fontSize: 19, color: ink }}>{t("Tell us about yourself", "O'zingiz haqingizda gapirib bering")}</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: muted, lineHeight: 1.5 }}>{t("Helps us personalize your coaching.", "Bu murabbiylikni sizga moslashtirishga yordam beradi.")}</p>

              <div className="asel-grid" style={{ marginBottom: 16 }}>
                <button type="button" className={"asel-card" + (gender === "male" ? " active" : "")} onClick={() => { setGender("male"); scheduleAdvance(2); }}>
                  <span className="aicon">👨</span><span className="alabel">{t("Male", "Erkak")}</span>
                </button>
                <button type="button" className={"asel-card" + (gender === "female" ? " active" : "")} onClick={() => { setGender("female"); scheduleAdvance(2); }}>
                  <span className="aicon">👩</span><span className="alabel">{t("Female", "Ayol")}</span>
                </button>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 8 }}>{t("Age range (optional)", "Yosh oralig'i (ixtiyoriy)")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {AGE_RANGES.map(([k, en, uz]) => (
                  <button type="button" key={k} className={"achip" + (ageRange === k ? " active" : "")} onClick={() => { setAgeRange(k); scheduleAdvance(2); }}>{t(en, uz)}</button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button type="button" className="askip" onClick={skipStep1}>{t("Skip", "O'tkazib yuborish")}</button>
                <button type="button" className="anext" onClick={() => goStep(2, 1)}>{t("Next →", "Keyingi →")}</button>
              </div>
            </div>
          )}

          {isSignup && step === 2 && (
            <div key="s2" className={dir === 1 ? "astep-fwd" : "astep-back"}>
              <h3 style={{ margin: "0 0 4px", fontFamily: serif, fontSize: 19, color: ink }}>{t("Your IELTS journey", "Sizning IELTS yo'lingiz")}</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: muted, lineHeight: 1.5 }}>{t("So your first plan starts in the right place.", "Shunda birinchi rejangiz to'g'ri joydan boshlanadi.")}</p>

              <div style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 8 }}>{t("Current level", "Hozirgi daraja")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
                {LEVELS.map(l => (
                  <button type="button" key={l} className={"alevel-card" + (level === l ? " active" : "")} onClick={() => { setLevel(l); scheduleAdvance(3); }}>{l}</button>
                ))}
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 8 }}>{t("Target band (optional)", "Maqsad band (ixtiyoriy)")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {TARGETS.map(b => (
                  <button type="button" key={b} className={"achip" + (target === String(b) ? " active" : "")} onClick={() => { setTarget(String(b)); scheduleAdvance(3); }}>{b.toFixed(1)}</button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button type="button" className="aback" onClick={() => goStep(1, -1)}>← {t("Back", "Orqaga")}</button>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <button type="button" className="askip" onClick={skipStep2}>{t("Skip", "O'tkazib yuborish")}</button>
                  <button type="button" className="anext" onClick={() => goStep(3, 1)}>{t("Next →", "Keyingi →")}</button>
                </div>
              </div>
            </div>
          )}

          {isSignup && step === 3 && (
            <div key="s3" className={dir === 1 ? "astep-fwd" : "astep-back"}>
              <h3 style={{ margin: "0 0 4px", fontFamily: serif, fontSize: 19, color: ink }}>{t("Create your account", "Hisobingizni yarating")}</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: muted, lineHeight: 1.5 }}>{t("Last step — this saves your progress.", "Oxirgi qadam — bu natijalaringizni saqlaydi.")}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input className="ainp" value={name} onChange={e => setName(e.target.value)} placeholder={t("Full name *", "To'liq ism *")} style={inp} />
                <input className="ainp" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" style={inp} onKeyDown={e => e.key === "Enter" && submitSignup()} />
                <input className="ainp" value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder={t("Password (min 6)", "Parol (kamida 6)")} style={inp} onKeyDown={e => e.key === "Enter" && submitSignup()} />

                {err && <p style={{ color: "#E03E2F", fontSize: 13, margin: 0, lineHeight: 1.4 }}>{err}</p>}
                {msg && <p style={{ color: "#1F9E73", fontSize: 13, margin: 0, lineHeight: 1.4 }}>{msg}</p>}

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
                  <button type="button" className="aback" onClick={() => goStep(2, -1)}>← {t("Back", "Orqaga")}</button>
                  <button className="asubmit" onClick={submitSignup} disabled={busy}
                    style={{ flex: 1, border: "none", cursor: busy ? "default" : "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 15, padding: 14, borderRadius: 13, color: "#fff", background: tabGrad, boxShadow: "0 10px 24px rgba(109,79,224,0.38)", transition: "transform .18s", opacity: busy ? 0.8 : 1 }}>
                    {busy ? t("Please wait…", "Kuting…") : t("Create account", "Hisob yaratish")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* bottom row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 20, flexWrap: "wrap" }}>
          {onBack && (
            <button onClick={onBack} style={{ border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, color: muted, padding: "4px 0" }}>← {t("Home", "Bosh sahifa")}</button>
          )}
          <div style={{ display: "flex", background: peach, borderRadius: 11, padding: 4, gap: 2 }}>
            {[["en", "EN"], ["uz", "UZ"]].map(([k, l]) => (
              <button key={k} onClick={() => onLang(k)} style={{ border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, padding: "6px 13px", borderRadius: 8, background: lang === k ? ink : "transparent", color: lang === k ? "#fff" : muted, transition: "all .2s" }}>{l}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
