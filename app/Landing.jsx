"use client";
import React, { useEffect } from "react";

const coral = "#FF6A4D", orange = "#FF8A3D", amber = "#FFA524";
const green = "#2FB98A", greenDark = "#1F9E73";
const ink = "#2A211E", muted = "#6B5D56";
const peach = "#FFECDD", bg = "#FFF6ED";
const serif = "'DM Serif Display', serif";
const sans = "'Plus Jakarta Sans', system-ui, sans-serif";

export default function Landing({ lang, onLang, onStart }) {
  const t = (en, uz) => (lang === "uz" ? uz : en);

  useEffect(() => {
    const els = document.querySelectorAll(".lrev");
    if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("lin")); return; }
    const io = new IntersectionObserver(
      entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("lin"); io.unobserve(en.target); } }),
      { threshold: 0.1 }
    );
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);

  const W = { maxWidth: 1200, margin: "0 auto", padding: "0 28px" };

  const feats = [
    ["linear-gradient(135deg,#FFE1D3,#FFD0BC)", "🎯", t("Real examiner scoring","Haqiqiy imtihonchi bahosi"), t("Band scores on all 4 official IELTS criteria — TR, CC, LR, GRA.","4 rasmiy IELTS mezoni bo'yicha band baho — TR, CC, LR, GRA.")],
    ["linear-gradient(135deg,#FFEFCF,#FFE0A6)", "✍️", t("Feedback & fixes","Izoh va tuzatishlar"), t("Every mistake highlighted, corrected, and explained with the rule.","Har xato ajratiladi, tuzatiladi va qoidasi tushuntiriladi.")],
    ["linear-gradient(135deg,#E9FBF3,#CFF3E4)", "⭐", t("Model & improved answers","Namuna va yaxshilangan javob"), t("See a band-9 model, or your own essay rewritten to your target band.","Band-9 namuna yoki o'z essayingiz maqsadli bandda qayta yozilgan.")],
    ["linear-gradient(135deg,#F0EDFF,#E2DCFF)", "🎴", t("Vocabulary & flashcards","Lug'at va kartochkalar"), t("Save words from your writing and drill them with two-way flashcards.","Yozuvingizdan so'z saqlang va ikki tomonlama kartochkalarda mashq qiling.")],
    ["linear-gradient(135deg,#FFF1D8,#FFE4B0)", "📈", t("Progress tracking","O'sishni kuzatish"), t("Your band trend over time, saved securely to your account.","Vaqt bo'yicha band o'sishingiz, hisobingizga xavfsiz saqlanadi.")],
    ["linear-gradient(135deg,#E3F2FF,#CCE8FF)", "🌐", t("Built for Uzbekistan","O'zbekiston uchun"), t("Bilingual UZ / RU / EN, question translation, light & dark mode.","UZ / RU / EN, savol tarjimasi, kunduzgi va tungi rejim.")],
  ];

  const steps = [
    [`linear-gradient(135deg,${coral},${orange})`, "rgba(255,106,77,0.35)", t("Write","Yozing"), t("Pick a real IELTS question and write your essay with a timer.","Haqiqiy IELTS savolini tanlab, taymer bilan essay yozing.")],
    [`linear-gradient(135deg,${orange},${amber})`, "rgba(255,165,36,0.35)", t("Get scored","Baho oling"), t("Our AI examiner grades all 4 criteria and highlights every fix.","AI imtihonchi 4 mezonni baholaydi va har tuzatishni ko'rsatadi.")],
    [`linear-gradient(135deg,${amber},${green})`, "rgba(47,185,138,0.3)", t("Improve","Yaxshilang"), t("Study the model answer, drill vocabulary, and watch your band rise.","Namunani o'rganing, lug'at mashq qiling va bandingiz o'ssin.")],
  ];

  const bars = [
    [t("Task Response","Vazifa Munosabati"), "7.5", "83%", ".4s"],
    [t("Coherence","Izchillik"), "7.0", "75%", ".55s"],
    [t("Lexical Resource","Leksik Boylik"), "8.0", "92%", ".7s"],
    [t("Grammar","Grammatika"), "7.5", "83%", ".85s"],
  ];

  return (
    <main style={{ background: bg, color: ink, minHeight: "100vh", fontFamily: sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&display=swap');
        @keyframes lauroraA{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(60px,-40px) scale(1.15)}}
        @keyframes lauroraB{0%,100%{transform:translate(0,0) scale(1.05)}50%{transform:translate(-50px,40px) scale(0.92)}}
        @keyframes lauroraC{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,50px) scale(1.2)}}
        @keyframes lbob{0%,100%{transform:translateY(0) rotate(-1.2deg)}50%{transform:translateY(-14px) rotate(-1.2deg)}}
        @keyframes lbobB{0%,100%{transform:translateY(0) rotate(3deg)}50%{transform:translateY(-10px) rotate(3deg)}}
        @keyframes lmeter{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        @keyframes lriseIn{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lcountPop{0%{opacity:0;transform:scale(0.7)}60%{transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}
        @keyframes ldash{0%,100%{opacity:.5}50%{opacity:1}}
        .lrev{opacity:0;transform:translateY(16px);transition:opacity .6s ease,transform .6s ease}
        .lin{opacity:1!important;transform:none!important}
        .lcta:hover{transform:translateY(-2px)!important;box-shadow:0 16px 34px rgba(255,106,77,0.5)!important}
        .lout:hover{border-color:#2A211E!important;transform:translateY(-2px)!important}
        .llogin:hover{border-color:#FF6A4D!important;color:#FF6A4D!important}
        .lfeat:hover{transform:translateY(-6px)!important;box-shadow:0 20px 44px rgba(255,106,77,0.14)!important}
        .lcenter:hover{transform:translateY(-2px)!important}
        .lfinal:hover{transform:translateY(-3px)!important;box-shadow:0 20px 40px rgba(255,106,77,0.5)!important}
      `}</style>

      {/* NAV */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(14px)", background: "rgba(255,246,237,0.82)", borderBottom: "1px solid rgba(42,33,30,0.07)" }}>
        <nav style={{ ...W, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 26, height: 26, background: `linear-gradient(135deg,${coral},${amber})`, borderRadius: 7, transform: "rotate(45deg)", boxShadow: "0 4px 14px rgba(255,106,77,0.4)" }} />
            <span style={{ fontFamily: serif, fontSize: 22, letterSpacing: "-0.01em" }}>IELTS Writing Coach</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", background: peach, borderRadius: 11, padding: 4, gap: 2 }}>
              {[["en","EN"],["uz","UZ"]].map(([k,l]) => (
                <button key={k} onClick={() => onLang(k)} style={{ border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, padding: "6px 13px", borderRadius: 8, background: lang === k ? ink : "transparent", color: lang === k ? "#fff" : muted, transition: "all .2s" }}>{l}</button>
              ))}
            </div>
            <button onClick={() => onStart("login")} className="llogin" style={{ border: "1px solid rgba(42,33,30,0.15)", background: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, padding: "10px 20px", borderRadius: 11, color: ink, transition: "all .2s" }}>{t("Log in","Kirish")}</button>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section style={{ position: "relative", overflow: "hidden", background: "linear-gradient(180deg,#FFF1E4 0%,#FFF6ED 100%)" }}>
        <div style={{ position: "absolute", top: -140, left: -80, width: 520, height: 520, borderRadius: "50%", background: `radial-gradient(circle,${coral} 0%,rgba(255,106,77,0) 68%)`, opacity: 0.34, filter: "blur(20px)", animation: "lauroraA 13s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 40, right: -120, width: 560, height: 560, borderRadius: "50%", background: `radial-gradient(circle,${amber} 0%,rgba(255,165,36,0) 68%)`, opacity: 0.30, filter: "blur(20px)", animation: "lauroraB 16s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -180, left: "35%", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle,#FFC9A9 0%,rgba(255,201,169,0) 70%)", opacity: 0.55, filter: "blur(22px)", animation: "lauroraC 18s ease-in-out infinite", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "74px 28px 96px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "center" }}>
          {/* copy */}
          <div style={{ animation: "lriseIn .7s ease both" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid rgba(255,106,77,0.25)", padding: "8px 15px", borderRadius: 100, boxShadow: "0 6px 18px rgba(255,106,77,0.12)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: coral, boxShadow: "0 0 0 4px rgba(255,106,77,0.18)", animation: "ldash 1.6s ease-in-out infinite" }} />
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", color: "#F0512F" }}>{t("AI IELTS EXAMINER","AI IELTS IMTIHONCHI")}</span>
            </div>
            <h1 style={{ fontFamily: serif, fontSize: "clamp(36px,5.5vw,62px)", lineHeight: 1.02, letterSpacing: "-0.02em", margin: "22px 0 0", color: ink }}>
              {t("Get your IELTS Writing scored ","IELTS Writing'ingizni ")}
              <span style={{ background: `linear-gradient(120deg,${coral},${amber})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", fontStyle: "italic" }}>
                {t("like a real examiner","haqiqiy imtihonchi kabi baholang")}
              </span>
            </h1>
            <p style={{ fontSize: 19, lineHeight: 1.55, color: muted, maxWidth: 480, margin: "22px 0 0" }}>
              {t("Instant band scores, detailed feedback, and the tools to actually improve — Task 1 & Task 2, built for Uzbekistan.","Bir zumda band baho, batafsil izoh va yaxshilash vositalari — Task 1 va Task 2, O'zbekiston uchun.")}
            </p>
            <div style={{ display: "flex", gap: 14, marginTop: 34, flexWrap: "wrap" }}>
              <button onClick={() => onStart("signup")} className="lcta" style={{ border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 16, padding: "16px 30px", borderRadius: 14, color: "#fff", background: `linear-gradient(120deg,${coral},${orange})`, boxShadow: "0 12px 28px rgba(255,106,77,0.42)", transition: "transform .18s, box-shadow .18s" }}>{t("Start free →","Bepul boshlash →")}</button>
              <button onClick={() => onStart("login")} className="lout" style={{ border: "1px solid rgba(42,33,30,0.15)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 16, padding: "16px 28px", borderRadius: 14, color: ink, background: "#fff", transition: "all .18s" }}>{t("I have an account","Hisobim bor")}</button>
            </div>
            <div style={{ display: "flex", gap: 22, marginTop: 24, flexWrap: "wrap", fontSize: 14, fontWeight: 600, color: muted }}>
              {[t("No card needed","Karta shart emas"), t("4 official criteria","4 rasmiy mezon"), "UZ · RU · EN"].map((s,i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ color: green, fontWeight: 800 }}>✓</span>{s}</span>
              ))}
            </div>
          </div>

          {/* animated score card */}
          <div style={{ position: "relative" }}>
            <div style={{ position: "relative", background: "#fff", borderRadius: 24, padding: 26, boxShadow: "0 30px 70px rgba(42,33,30,0.16)", animation: "lbob 6s ease-in-out infinite" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22 }}>
                <div style={{ flexShrink: 0, width: 74, height: 74, borderRadius: 20, background: "linear-gradient(135deg,#E9FBF3,#D3F5E7)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid rgba(47,185,138,0.25)", animation: "lcountPop .8s .3s ease both" }}>
                  <span style={{ fontFamily: serif, fontSize: 30, lineHeight: 1, color: greenDark }}>7.5</span>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", color: green, marginTop: 2 }}>BAND</span>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: ink }}>{t("Overall band","Umumiy band")}</div>
                  <div style={{ fontSize: 13, color: muted, marginTop: 2 }}>{t("Scored in 12 seconds","12 soniyada baholandi")}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                {bars.map(([label, score, width, delay]) => (
                  <div key={label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#4A3D38", marginBottom: 6 }}>
                      <span>{label}</span><span style={{ color: coral }}>{score}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 100, background: peach, overflow: "hidden" }}>
                      <div style={{ height: "100%", width, borderRadius: 100, background: `linear-gradient(90deg,${coral},${amber})`, transformOrigin: "left", animation: `lmeter 1.1s ${delay} cubic-bezier(.2,.8,.2,1) both` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, padding: 15, borderRadius: 14, background: "#FFF7EF", border: "1px dashed rgba(255,106,77,0.3)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: greenDark }}><span>✓</span> {t("Clear paragraph structure","Aniq paragraf tuzilmasi")}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#F0512F", marginTop: 8 }}><span>→</span> {t("Add more complex sentences","Murakkab gaplar qo'shing")}</div>
              </div>
            </div>
            <div style={{ position: "absolute", top: -18, right: -14, background: "#fff", padding: "10px 15px", borderRadius: 100, boxShadow: "0 14px 30px rgba(42,33,30,0.14)", display: "flex", alignItems: "center", gap: 8, animation: "lbobB 5s ease-in-out infinite" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: green }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: ink }}>+1.5 bands</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "90px 28px 30px", textAlign: "center" }}>
        <h2 className="lrev" style={{ fontFamily: serif, fontSize: "clamp(28px,4vw,44px)", letterSpacing: "-0.02em", margin: 0, color: ink }}>{t("Everything you need to improve","Yaxshilanish uchun barchasi")}</h2>
        <p className="lrev" style={{ fontSize: 18, color: muted, margin: "14px 0 0" }}>{t("Not just a score — a full coach that shows you exactly what to fix.","Faqat baho emas — nimani tuzatishni aniq ko'rsatadigan to'liq murabbiy.")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 22, marginTop: 52, textAlign: "left" }}>
          {feats.map(([iconBg, icon, title, desc], i) => (
            <div key={i} className="lrev lfeat" style={{ background: "#fff", border: "1px solid rgba(42,33,30,0.06)", borderRadius: 22, padding: 30, boxShadow: "0 10px 30px rgba(42,33,30,0.05)", transition: "transform .2s, box-shadow .2s", transitionDelay: `${i*40}ms` }}>
              <div style={{ width: 52, height: 52, borderRadius: 15, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{icon}</div>
              <h3 style={{ fontFamily: serif, fontSize: 22, margin: "20px 0 8px", color: ink }}>{title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.55, color: muted, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "70px 28px 20px" }}>
        <h2 className="lrev" style={{ fontFamily: serif, fontSize: "clamp(28px,4vw,40px)", letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 48px", color: ink }}>{t("How it works","Qanday ishlaydi")}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20, textAlign: "center" }}>
          {steps.map(([bg2, shadow, title, desc], i) => (
            <div key={i} className="lrev" style={{ transitionDelay: `${i*60}ms` }}>
              <div style={{ width: 54, height: 54, margin: "0 auto", borderRadius: "50%", background: bg2, color: "#fff", fontFamily: serif, fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 10px 22px ${shadow}` }}>{i+1}</div>
              <h4 style={{ fontFamily: serif, fontSize: 22, margin: "16px 0 6px", color: ink }}>{title}</h4>
              <p style={{ fontSize: 15, color: muted, margin: "0 auto", lineHeight: 1.5, maxWidth: 300 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOR CENTERS */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "70px 28px" }}>
        <div className="lrev" style={{ position: "relative", overflow: "hidden", borderRadius: 28, background: `linear-gradient(120deg,${coral} 0%,${orange} 55%,${amber} 100%)`, padding: "64px 40px", textAlign: "center", boxShadow: "0 30px 60px rgba(255,106,77,0.32)" }}>
          <div style={{ position: "absolute", top: -80, right: -40, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.14)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -100, left: -60, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.1)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.16em", color: "rgba(255,255,255,0.9)" }}>{t("FOR IELTS CENTERS","IELTS MARKAZLARI UCHUN")}</div>
            <h2 style={{ fontFamily: serif, fontSize: "clamp(24px,4vw,40px)", color: "#fff", margin: "14px 0 0", letterSpacing: "-0.01em" }}>{t("Give every student an AI writing coach","Har o'quvchiga AI yozuv murabbiysi bering")}</h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.92)", maxWidth: 540, margin: "16px auto 0", lineHeight: 1.55 }}>{t("Let your students practise unlimited essays with instant examiner feedback, while you track every learner's progress in one place.","O'quvchilaringiz cheksiz essay yozib, bir zumda imtihonchi izohini olsin — siz esa har birining o'sishini bir joyda kuzating.")}</p>
            <button onClick={() => onStart("signup")} className="lcenter" style={{ marginTop: 30, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 16, padding: "15px 34px", borderRadius: 13, background: "#fff", color: "#F0512F", boxShadow: "0 12px 26px rgba(0,0,0,0.14)", transition: "transform .18s" }}>{t("Get started","Boshlash")}</button>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "30px 28px 96px", textAlign: "center" }}>
        <h2 className="lrev" style={{ fontFamily: serif, fontSize: "clamp(28px,4vw,46px)", letterSpacing: "-0.02em", margin: 0, color: ink }}>{t("Ready to raise your band?","Bandingizni oshirishga tayyormisiz?")}</h2>
        <p className="lrev" style={{ fontSize: 18, color: muted, margin: "14px 0 0" }}>{t("Write your first essay in the next two minutes.","Birinchi essayingizni ikki daqiqada yozing.")}</p>
        <button onClick={() => onStart("signup")} className="lcta lfinal lrev" style={{ marginTop: 30, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 17, padding: "17px 38px", borderRadius: 15, color: "#fff", background: `linear-gradient(120deg,${coral},${orange})`, boxShadow: "0 14px 32px rgba(255,106,77,0.42)", transition: "transform .18s, box-shadow .18s" }}>{t("Start free →","Bepul boshlash →")}</button>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(42,33,30,0.08)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "26px 28px", display: "flex", alignItems: "center", justifyContent: "center", gap: 11, color: muted, fontSize: 14, fontWeight: 600 }}>
          <div style={{ width: 16, height: 16, background: `linear-gradient(135deg,${coral},${amber})`, borderRadius: 4, transform: "rotate(45deg)" }} />
          IELTS Writing Coach · {new Date().getFullYear()}
        </div>
      </footer>
    </main>
  );
}
