"use client";

import React, { useEffect } from "react";

export default function Landing({ C, lang, onLang, onStart }) {
  const t = (en, uz) => (lang === "uz" ? uz : en);

  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => { entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { threshold: 0.12 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  const navy = "#0E1326", coral = "#FF5A4D", ink = C.ink, paper = C.paper, card = C.card, slate = C.slate, line = C.line, green = "#2E9E6B";
  const wrap = { maxWidth: 1080, margin: "0 auto", padding: "0 22px" };
  const h2 = { fontFamily: "Fraunces, serif", fontWeight: 900, fontSize: "clamp(24px,4vw,36px)", color: ink, margin: "0 0 12px", lineHeight: 1.15 };

  const feats = [
    ["🎯", t("Real examiner scoring", "Haqiqiy imtihonchi bahosi"), t("Band scores on all 4 official IELTS criteria — TR, CC, LR, GRA.", "4 rasmiy IELTS mezoni bo'yicha band baho — TR, CC, LR, GRA.")],
    ["✍️", t("Feedback & fixes", "Izoh va tuzatishlar"), t("Every mistake highlighted, corrected, and explained with the rule.", "Har xato ajratiladi, tuzatiladi va qoidasi tushuntiriladi.")],
    ["⭐", t("Model & improved answers", "Namuna va yaxshilangan javob"), t("See a band-9 model, or your own essay rewritten to your target band.", "Band-9 namuna yoki o'z essayingiz maqsadli bandda qayta yozilgan.")],
    ["🎴", t("Vocabulary & flashcards", "Lug'at va kartochkalar"), t("Save words from your writing and drill them with two-way flashcards.", "Yozuvingizdan so'z saqlang va ikki tomonlama kartochkalarda mashq qiling.")],
    ["📈", t("Progress tracking", "O'sishni kuzatish"), t("Your band trend over time, saved securely to your account.", "Vaqt bo'yicha band o'sishingiz, hisobingizga xavfsiz saqlanadi.")],
    ["🌐", t("Built for Uzbekistan", "O'zbekiston uchun"), t("Bilingual UZ / RU / EN, question translation, light & dark mode.", "UZ / RU / EN, savol tarjimasi, kunduzgi va tungi rejim.")],
  ];

  return (
    <main style={{ background: paper, color: ink, minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes float1{0%,100%{transform:translate(0,0)}50%{transform:translate(20px,-24px)}}
        @keyframes float2{0%,100%{transform:translate(0,0)}50%{transform:translate(-24px,18px)}}
        .reveal{opacity:0;transform:translateY(16px);transition:opacity .6s ease,transform .6s ease}
        .reveal.in{opacity:1;transform:none}
        .lbtn{cursor:pointer;border:none;font-family:inherit;font-weight:700;transition:transform .15s ease,box-shadow .15s ease}
        .lbtn:hover{transform:translateY(-2px)}
        .fcard{transition:transform .18s ease,box-shadow .18s ease}
        .fcard:hover{transform:translateY(-4px);box-shadow:0 12px 30px rgba(0,0,0,.10)}
      `}</style>

      {/* NAV */}
      <div style={{ ...wrap, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 15, height: 15, background: coral, borderRadius: 3, transform: "rotate(45deg)" }} />
          <span style={{ fontFamily: "Fraunces, serif", fontWeight: 900, fontSize: 20, color: ink }}>IELTS Writing Coach</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", background: card, border: `1px solid ${line}`, borderRadius: 9, padding: 3 }}>
            {[["en", "EN"], ["uz", "UZ"]].map(([k, l]) => (<button key={k} onClick={() => onLang(k)} className="lbtn" style={{ padding: "5px 11px", borderRadius: 7, fontSize: 12, background: lang === k ? navy : "transparent", color: lang === k ? "#fff" : slate }}>{l}</button>))}
          </div>
          <button onClick={() => onStart("login")} className="lbtn" style={{ padding: "8px 16px", borderRadius: 9, fontSize: 13, background: "transparent", color: ink, border: `1px solid ${line}` }}>{t("Log in", "Kirish")}</button>
        </div>
      </div>

      {/* HERO */}
      <section style={{ background: `linear-gradient(160deg, ${navy} 0%, #17203A 100%)`, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: "rgba(255,90,77,.22)", filter: "blur(60px)", top: -80, right: -40, animation: "float1 9s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", background: "rgba(90,140,255,.18)", filter: "blur(60px)", bottom: -60, left: -30, animation: "float2 11s ease-in-out infinite" }} />
        <div style={{ ...wrap, display: "flex", gap: 40, alignItems: "center", flexWrap: "wrap", padding: "60px 22px 70px", position: "relative" }}>
          <div style={{ flex: "1 1 380px", animation: "fadeUp .6s ease both" }}>
            <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: coral, background: "rgba(255,90,77,.14)", padding: "6px 12px", borderRadius: 999, marginBottom: 18 }}>{t("AI IELTS examiner", "AI IELTS imtihonchi")}</span>
            <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 900, fontSize: "clamp(30px,5vw,50px)", lineHeight: 1.08, margin: "0 0 16px" }}>{t("Get your IELTS Writing scored like a real examiner", "IELTS Writing'ingizni haqiqiy imtihonchi kabi baholang")}</h1>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: "rgba(255,255,255,.82)", margin: "0 0 26px", maxWidth: 480 }}>{t("Instant band scores, detailed feedback, and the tools to actually improve — Task 1 & Task 2, built for Uzbekistan.", "Bir zumda band baho, batafsil izoh va yaxshilash vositalari — Task 1 va Task 2, O'zbekiston uchun.")}</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => onStart("signup")} className="lbtn" style={{ padding: "14px 28px", borderRadius: 12, fontSize: 15, background: coral, color: "#fff", boxShadow: "0 8px 22px rgba(255,90,77,.35)" }}>{t("Start free →", "Bepul boshlash →")}</button>
              <button onClick={() => onStart("login")} className="lbtn" style={{ padding: "14px 24px", borderRadius: 12, fontSize: 15, background: "rgba(255,255,255,.12)", color: "#fff" }}>{t("I have an account", "Hisobim bor")}</button>
            </div>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginTop: 28, fontSize: 13, color: "rgba(255,255,255,.7)" }}>
              <span>✓ {t("No card needed", "Karta shart emas")}</span>
              <span>✓ {t("4 official criteria", "4 rasmiy mezon")}</span>
              <span>✓ {t("UZ · RU · EN", "UZ · RU · EN")}</span>
            </div>
          </div>
          {/* mock result card */}
          <div style={{ flex: "0 1 320px", animation: "fadeUp .8s ease both" }}>
            <div style={{ background: "#fff", borderRadius: 18, padding: 20, boxShadow: "0 20px 50px rgba(0,0,0,.3)", transform: "rotate(-2deg)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div style={{ width: 60, height: 60, borderRadius: 14, background: `${green}1A`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "Fraunces, serif", fontWeight: 900, fontSize: 24, color: green, lineHeight: 1 }}>7.5</span>
                  <span style={{ fontSize: 8, color: "#5B6478", textTransform: "uppercase", letterSpacing: 1 }}>band</span>
                </div>
                <div style={{ flex: 1 }}>
                  {[["Task", .9], ["Coherence", .85], ["Lexical", .8], ["Grammar", .82]].map(([lb, w], i) => (
                    <div key={i} style={{ marginBottom: 5 }}>
                      <div style={{ fontSize: 10, color: "#5B6478", marginBottom: 2 }}>{lb}</div>
                      <div style={{ height: 5, background: "#EEE", borderRadius: 999 }}><div style={{ height: "100%", width: `${w * 100}%`, background: coral, borderRadius: 999 }} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#16203A", lineHeight: 1.6, background: "#FCFBF7", borderRadius: 10, padding: 12 }}>
                <span style={{ color: green, fontWeight: 700 }}>✓ {t("Clear structure", "Aniq tuzilma")}</span><br />
                <span style={{ color: coral, fontWeight: 700 }}>→ {t("Add complex sentences", "Murakkab gaplar qo'shing")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ ...wrap, padding: "64px 22px 20px" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={h2}>{t("Everything you need to improve", "Yaxshilanish uchun barchasi")}</h2>
          <p style={{ color: slate, fontSize: 16, maxWidth: 560, margin: "0 auto" }}>{t("Not just a score — a full coach that shows you exactly what to fix.", "Faqat baho emas — nimani tuzatishni aniq ko'rsatadigan to'liq murabbiy.")}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
          {feats.map(([ic, tt, dd], i) => (
            <div key={i} className="reveal fcard" style={{ background: card, border: `1px solid ${line}`, borderRadius: 16, padding: 24, transitionDelay: `${i * 40}ms` }}>
              <div style={{ fontSize: 30, marginBottom: 12 }}>{ic}</div>
              <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 18, color: ink, margin: "0 0 6px" }}>{tt}</h3>
              <p style={{ fontSize: 14, color: slate, lineHeight: 1.6, margin: 0 }}>{dd}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ ...wrap, padding: "56px 22px" }}>
        <h2 className="reveal" style={{ ...h2, textAlign: "center", marginBottom: 40 }}>{t("How it works", "Qanday ishlaydi")}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 22 }}>
          {[["1", t("Write", "Yozing"), t("Pick a real IELTS question and write your essay with a timer.", "Haqiqiy IELTS savolini tanlab, taymer bilan essay yozing.")], ["2", t("Get scored", "Baho oling"), t("Our AI examiner grades all 4 criteria and highlights every fix.", "AI imtihonchi 4 mezonni baholaydi va har tuzatishni ko'rsatadi.")], ["3", t("Improve", "Yaxshilang"), t("Study the model answer, drill vocabulary, and watch your band rise.", "Namunani o'rganing, lug'at mashq qiling va bandingiz o'ssin.")]].map(([n, tt, dd], i) => (
            <div key={i} className="reveal" style={{ textAlign: "center", transitionDelay: `${i * 60}ms` }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: coral, color: "#fff", fontFamily: "Fraunces, serif", fontWeight: 900, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>{n}</div>
              <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 20, color: ink, margin: "0 0 8px" }}>{tt}</h3>
              <p style={{ fontSize: 14.5, color: slate, lineHeight: 1.6, maxWidth: 300, margin: "0 auto" }}>{dd}</p>
            </div>
          ))}
        </div>
      </section>

      {/* B2B */}
      <section style={{ ...wrap, padding: "20px 22px 60px" }}>
        <div className="reveal" style={{ background: `linear-gradient(135deg, ${navy}, #1B2540)`, borderRadius: 22, padding: "clamp(28px,5vw,48px)", color: "#fff", textAlign: "center" }}>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: coral, marginBottom: 12 }}>{t("For IELTS centers", "IELTS markazlari uchun")}</span>
          <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 900, fontSize: "clamp(22px,4vw,32px)", margin: "0 0 12px" }}>{t("Give every student an AI writing coach", "Har o'quvchiga AI yozuv murabbiysi bering")}</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,.82)", maxWidth: 560, margin: "0 auto 24px", lineHeight: 1.6 }}>{t("Let your students practise unlimited essays with instant examiner feedback, while you track every learner's progress in one place.", "O'quvchilaringiz cheksiz essay yozib, bir zumda imtihonchi izohini olsin — siz esa har birining o'sishini bir joyda kuzating.")}</p>
          <button onClick={() => onStart("signup")} className="lbtn" style={{ padding: "14px 30px", borderRadius: 12, fontSize: 15, background: coral, color: "#fff" }}>{t("Get started", "Boshlash")}</button>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ ...wrap, padding: "10px 22px 70px", textAlign: "center" }}>
        <h2 className="reveal" style={{ ...h2, marginBottom: 10 }}>{t("Ready to raise your band?", "Bandingizni oshirishga tayyormisiz?")}</h2>
        <p className="reveal" style={{ color: slate, fontSize: 16, marginBottom: 24 }}>{t("Write your first essay in the next two minutes.", "Birinchi essayingizni ikki daqiqada yozing.")}</p>
        <button onClick={() => onStart("signup")} className="lbtn reveal" style={{ padding: "15px 34px", borderRadius: 12, fontSize: 16, background: coral, color: "#fff", boxShadow: "0 8px 22px rgba(255,90,77,.3)" }}>{t("Start free →", "Bepul boshlash →")}</button>
      </section>

      <footer style={{ borderTop: `1px solid ${line}`, padding: "24px 22px", textAlign: "center", color: slate, fontSize: 13 }}>
        <div style={{ ...wrap, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
          <span style={{ width: 12, height: 12, background: coral, borderRadius: 2, transform: "rotate(45deg)", display: "inline-block" }} />
          <span>IELTS Writing Coach · {new Date().getFullYear()}</span>
        </div>
      </footer>
    </main>
  );
}
