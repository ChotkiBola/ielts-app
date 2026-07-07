"use client";
import React from "react";

const serif = "'Fraunces', 'DM Serif Display', serif";
const GRAD = "linear-gradient(120deg,var(--accent),var(--accent2))";

export const FREE_DAILY_SCORES = 3;

const PLANS = [
  {
    id: "free",
    name: { en: "Cocoon", uz: "Pilla" },
    tagline: { en: "Start your transformation", uz: "O'zgarishni boshlang" },
    price: { en: "Free", uz: "Bepul" },
    period: { en: "forever", uz: "doimiy" },
    features: [
      { en: `${FREE_DAILY_SCORES} essay scorings per day`, uz: `Kuniga ${FREE_DAILY_SCORES} ta essay baholash` },
      { en: "Full question bank (Task 1 & 2)", uz: "To'liq savollar bazasi (Task 1 va 2)" },
      { en: "Vocab builder & flashcards", uz: "Lug'at va kartochkalar" },
      { en: "History & band trend", uz: "Tarix va band o'zgarishi" },
    ],
  },
  {
    id: "premium",
    name: { en: "Butterfly", uz: "Kapalak" },
    tagline: { en: "Everything, unlimited", uz: "Hammasi, cheksiz" },
    price: { en: "49,000 so'm", uz: "49 000 so'm" },
    period: { en: "per month", uz: "oyiga" },
    highlight: true,
    badge: { en: "Most popular", uz: "Eng ommabop" },
    features: [
      { en: "Unlimited essay scoring", uz: "Cheksiz essay baholash" },
      { en: "Band-9 model answers", uz: "Band-9 namuna javoblar" },
      { en: "Rewrites at your target band", uz: "Maqsad band darajasida qayta yozish" },
      { en: "Weakness Gym — drills from your own mistakes", uz: "Xatolar zali — o'z xatolaringizdan mashqlar" },
      { en: "Full speaking mock exams", uz: "To'liq speaking mock imtihonlari" },
    ],
  },
  {
    id: "premium-year",
    name: { en: "Butterfly · Year", uz: "Kapalak · Yil" },
    tagline: { en: "For the committed", uz: "Jiddiy tayyorlanuvchilar uchun" },
    price: { en: "399,000 so'm", uz: "399 000 so'm" },
    period: { en: "per year · save 32%", uz: "yiliga · 32% tejang" },
    gold: true,
    badge: { en: "Best value", uz: "Eng foydali" },
    features: [
      { en: "Everything in Butterfly", uz: "Kapalakdagi hamma narsa" },
      { en: "12 months for the price of 8", uz: "8 oy narxiga 12 oy" },
      { en: "Early access to new features", uz: "Yangi funksiyalarga birinchi kirish" },
    ],
  },
];

function Check({ color = "var(--good)" }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 3 }}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function PricingCards({ lang = "en", plan = "free", onChoose, dark = false }) {
  const t = (o) => (o ? o[lang] || o.en : "");
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, alignItems: "stretch" }}>
      {PLANS.map((p) => {
        const active = plan === "premium" ? p.id !== "free" : p.id === "free";
        const border = p.highlight ? "2px solid var(--accent)" : p.gold ? "2px solid var(--gold)" : `1px solid ${dark ? "rgba(255,255,255,0.14)" : "var(--border)"}`;
        return (
          <div key={p.id} style={{ position: "relative", display: "flex", flexDirection: "column", background: dark ? "rgba(255,255,255,0.05)" : "var(--surface)", border, borderRadius: 22, padding: "26px 22px 22px", boxShadow: p.highlight ? "0 24px 55px -18px rgba(109,79,224,0.45)" : "0 6px 22px rgba(36,30,51,0.06)", transform: p.highlight ? "scale(1.02)" : "none" }}>
            {p.badge && (
              <span style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", background: p.gold ? "linear-gradient(120deg,#B87F2E,#E3B25C)" : GRAD, padding: "5px 13px", borderRadius: 999, whiteSpace: "nowrap" }}>
                {p.gold ? "★ " : "✦ "}{t(p.badge)}
              </span>
            )}
            <div style={{ fontFamily: serif, fontSize: 21, color: dark ? "#F2EDFB" : "var(--text)" }}>{t(p.name)}</div>
            <div style={{ fontSize: 12.5, color: dark ? "rgba(242,237,251,0.6)" : "var(--muted)", marginTop: 2 }}>{t(p.tagline)}</div>
            <div style={{ margin: "16px 0 4px", display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
              <span style={{ fontFamily: serif, fontSize: 30, color: p.gold ? "var(--gold)" : p.highlight ? "var(--accent)" : dark ? "#F2EDFB" : "var(--text)", lineHeight: 1 }}>{t(p.price)}</span>
              <span style={{ fontSize: 12, color: dark ? "rgba(242,237,251,0.55)" : "var(--faint)", fontWeight: 700 }}>{t(p.period)}</span>
            </div>
            <ul style={{ listStyle: "none", margin: "14px 0 20px", padding: 0, display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
              {p.features.map((f, i) => (
                <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, lineHeight: 1.45, color: dark ? "rgba(242,237,251,0.85)" : "var(--text)" }}>
                  <Check color={p.gold ? "var(--gold)" : p.highlight ? "var(--accent)" : "var(--good)"} />
                  <span>{t(f)}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => onChoose && onChoose(p.id)}
              disabled={active}
              style={{
                cursor: active ? "default" : "pointer", border: "none", fontFamily: "inherit", fontWeight: 700,
                width: "100%", padding: "13px", borderRadius: 12, fontSize: 14, transition: "all .18s ease",
                background: active ? (dark ? "rgba(255,255,255,0.08)" : "var(--surface-2)") : p.gold ? "linear-gradient(120deg,#B87F2E,#E3B25C)" : p.highlight ? GRAD : "transparent",
                color: active ? (dark ? "rgba(242,237,251,0.5)" : "var(--faint)") : p.highlight || p.gold ? "#fff" : dark ? "#F2EDFB" : "var(--text)",
                boxShadow: !active && p.highlight ? "0 10px 26px rgba(109,79,224,0.35)" : "none",
                outline: !active && !p.highlight && !p.gold ? `1.5px solid ${dark ? "rgba(255,255,255,0.25)" : "var(--border)"}` : "none",
              }}
            >
              {active
                ? lang === "uz" ? "Joriy reja" : "Current plan"
                : p.id === "free"
                  ? lang === "uz" ? "Bepul boshlash" : "Start free"
                  : lang === "uz" ? "Premium olish →" : "Get Premium →"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

const REASONS = {
  limit: {
    en: `You've used your ${FREE_DAILY_SCORES} free scorings for today.`,
    uz: `Bugungi ${FREE_DAILY_SCORES} ta bepul baholashni ishlatdingiz.`,
  },
  model: { en: "Band-9 model answers are a Premium feature.", uz: "Band-9 namuna javoblar — Premium funksiya." },
  improve: { en: "Target-band rewrites are a Premium feature.", uz: "Maqsad band darajasida qayta yozish — Premium funksiya." },
  gap: { en: "The Weakness Gym is a Premium feature.", uz: "Xatolar zali — Premium funksiya." },
  generic: { en: "Unlock everything with Premium.", uz: "Premium bilan hammasini oching." },
};

export default function UpgradeModal({ lang = "en", reason = "generic", plan = "free", requested = false, onClose, onChoose }) {
  const r = REASONS[reason] || REASONS.generic;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(19,16,32,.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 18, overflowY: "auto" }}>
      <div className="cardin" onClick={(e) => e.stopPropagation()} style={{ background: "var(--app-bg)", borderRadius: 26, padding: "30px 26px 26px", width: 900, maxWidth: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 40px 90px rgba(0,0,0,0.4)", position: "relative" }}>
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 16, right: 16, width: 34, height: 34, borderRadius: 10, border: "none", cursor: "pointer", background: "var(--surface-2)", color: "var(--muted)", fontSize: 15, fontWeight: 700 }}>✕</button>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>
            ✦ {lang === "uz" ? "Premium" : "Premium"}
          </div>
          <h2 style={{ fontFamily: serif, fontSize: "clamp(22px,3vw,30px)", color: "var(--text)", margin: 0, lineHeight: 1.2 }}>
            {lang === "uz" ? "Pilladan kapalakka" : "From cocoon to butterfly"}
          </h2>
          <p style={{ fontSize: 14, color: "var(--muted)", margin: "8px auto 0", maxWidth: 480, lineHeight: 1.55 }}>{r[lang] || r.en}</p>
        </div>

        {requested ? (
          <div style={{ textAlign: "center", background: "var(--surface)", border: "1px solid var(--good)", borderRadius: 18, padding: "26px 22px", maxWidth: 480, margin: "0 auto" }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>🦋</div>
            <div style={{ fontFamily: serif, fontSize: 19, color: "var(--text)", marginBottom: 6 }}>
              {lang === "uz" ? "So'rov yuborildi!" : "Request sent!"}
            </div>
            <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              {lang === "uz"
                ? "Tez orada siz bilan bog'lanamiz va Premium'ni faollashtiramiz. To'lov (Payme/Click) tez orada qo'shiladi."
                : "We'll contact you shortly to activate Premium. Online payment (Payme/Click) is coming soon."}
            </p>
          </div>
        ) : (
          <PricingCards lang={lang} plan={plan} onChoose={onChoose} />
        )}
      </div>
    </div>
  );
}
