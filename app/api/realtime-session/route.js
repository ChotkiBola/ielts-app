export const runtime = "nodejs";
import { createClient } from "@supabase/supabase-js";

// --- Monetization: server-side plan/limit enforcement ---
// LAUNCH_PROMO=true (default) means everyone gets unlimited access while we
// are pre-launch / running a 100% discount. Flip the env var to "false" on
// Vercel once payments (Payme/Click) are wired up to start enforcing limits.
const LAUNCH_PROMO = process.env.LAUNCH_PROMO !== "false";
const FREE_WEEKLY_ESSAYS = 3;
const FREE_WEEKLY_SPEAKING = 1;

function getSupaAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function getUserFromAuthHeader(request, body) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : (body && body.accessToken) || null;
  if (!token) return null;
  const admin = getSupaAdmin();
  if (!admin) return null;
  try {
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data || !data.user) return null;
    return data.user;
  } catch (e) { return null; }
}

async function checkLimit(request, body, mode) {
  if (LAUNCH_PROMO) return null; // promo active: no limits at all right now
  const admin = getSupaAdmin();
  if (!admin) return null; // service role not configured — fail open, don't block users
  const user = await getUserFromAuthHeader(request, body);
  if (!user) return null; // guest / local-only mode — not tracked, allowed through

  const { data: profile } = await admin.from("profiles").select("plan, plan_expires").eq("user_id", user.id).single();
  const isPro = !!(profile && profile.plan === "pro" && (!profile.plan_expires || new Date(profile.plan_expires) > new Date()));
  if (isPro) return null;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  let q = admin.from("history").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", weekAgo);
  q = mode === "speakScore" ? q.eq("task_type", "spk") : q.neq("task_type", "spk");
  const { count } = await q;
  const limit = mode === "speakScore" ? FREE_WEEKLY_SPEAKING : FREE_WEEKLY_ESSAYS;
  if ((count || 0) >= limit) {
    return Response.json({ error: "Weekly free limit reached. Upgrade to Pro for unlimited access.", limitReached: true, limit, plan: "free" }, { status: 402 });
  }
  return null;
}

const TASK_DESC = {
  t2:  { name: "IELTS Writing Task 2 essay", first: "Task Response", min: 250 },
  t1a: { name: "IELTS Academic Writing Task 1 report describing visual data", first: "Task Achievement", min: 150 },
  t1g: { name: "IELTS General Training Writing Task 1 letter", first: "Task Achievement", min: 150 },
};

function clampBand(x) { return Math.max(4, Math.min(8, Math.round(x * 2) / 2)); }

const HITS = new Map();
function rateLimited(ip) {
  const now = Date.now(), win = 60 * 60 * 1000, max = 60;
  const e = HITS.get(ip);
  if (!e || now - e.start > win) { HITS.set(ip, { start: now, count: 1 }); return false; }
  e.count++;
  return e.count > max;
}

// Robustly pull the JSON object out of a model response even if there is
// stray text around it, by matching the first { to its balanced closing }.
function extractJson(text) {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in response.");
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return JSON.parse(text.slice(start, i + 1));
    }
  }
  // Depth never closed - response was truncated mid-object.
  throw new Error("JSON object was truncated (likely hit the token limit).");
}

function mockScore(essay, words, lang) {
  const uz = lang === "uz";
  let base = 5.5;
  if (words >= 130) base += 0.5;
  if (words >= 230) base += 0.5;
  const tr = clampBand(base), cc = clampBand(base + 0.5), lr = clampBand(base), gra = clampBand(base - 0.5);
  const patterns = [
    { t: "very important", fix: "crucial", type: "vocabulary", rule: uz ? "Kuchli sifatlar takrorni kamaytiradi." : "Stronger adjectives avoid repetition." },
    { t: "a lot of", fix: "a great deal of", type: "vocabulary", rule: uz ? "Akademik uslubda rasmiyroq iboralar." : "Use more formal phrases in academic writing." },
    { t: "I think", fix: "It is widely believed that", type: "cohesion", rule: uz ? "Shaxssiz tuzilma rasmiyroq." : "Impersonal structures sound more formal." },
    { t: "dont", fix: "do not", type: "grammar", rule: uz ? "Yozma ishda qisqartma ishlatilmaydi." : "Avoid contractions in formal writing." },
  ];
  const low = essay.toLowerCase();
  const errors = [];
  for (const p of patterns) {
    const idx = low.indexOf(p.t.toLowerCase());
    if (idx >= 0) errors.push({ text: essay.substr(idx, p.t.length), fix: p.fix, type: p.type, rule: p.rule });
    if (errors.length >= 4) break;
  }
  return {
    tr: { band: tr, note: uz ? "(Namuna) Vazifani bajargansiz; aniqroq bering." : "(Demo) You address the task; be more precise." },
    cc: { band: cc, note: uz ? "(Namuna) Bog'lovchilarni xilma-xil ishlating." : "(Demo) Vary your linking words." },
    lr: { band: lr, note: uz ? "(Namuna) Ko'proq akademik collocation qo'shing." : "(Demo) Add more academic collocations." },
    gra: { band: gra, note: uz ? "(Namuna) Murakkab gaplarni ko'paytiring." : "(Demo) Use more complex sentences." },
    strengths: uz ? ["(Namuna) Tuzilma aniq", "Haqiqiy baho uchun API key qo'shing"] : ["(Demo) Clear structure", "Add an API key for real scoring"],
    improvements: uz ? ["(Namuna) Misollarni kengaytiring", "Takror so'zlarni almashtiring", "Xulosani kuchaytiring"] : ["(Demo) Develop examples", "Replace repeated words", "Strengthen the conclusion"],
    errors,
    synonyms: [{ word: "good", alts: ["beneficial", "advantageous", "valuable"] }],
    paragraphs: [{ label: uz ? "Kirish" : "Introduction", note: uz ? "(Namuna) Pozitsiyani aniqroq bering." : "(Demo) State your position more clearly." }, { label: uz ? "Asosiy qism" : "Body", note: uz ? "(Namuna) Misol bilan kuchaytiring." : "(Demo) Support with an example." }],
    toTarget: uz ? "(Namuna) Maqsadli band uchun murakkab gaplar va aniq misollar qo'shing." : "(Demo) Add complex sentences and concrete examples to reach your target band.",
    demo: true,
  };
}

async function callClaude(system, userMsg, maxTokens) {
  const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6", max_tokens: maxTokens, system, messages: [{ role: "user", content: userMsg }] }),
  });
  const data = await apiRes.json();
  if (data.error) throw new Error(data.error.message || "Anthropic API error.");
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const required = process.env.APP_PASSWORD;
    if (required && body.password !== required) return Response.json({ error: "Access code required or incorrect.", needPassword: true }, { status: 401 });
    const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    if (rateLimited(ip)) return Response.json({ error: "Too many requests. Please wait a while and try again." }, { status: 429 });

    const { mode = "score", taskType = "t2", targetBand, target, word, question, qType, essay, words, lang, chartSummary } = body;
    const language = lang === "uz" ? "Uzbek" : "English";
    const tm = TASK_DESC[taskType] || TASK_DESC.t2;
    const hasKey = !!process.env.ANTHROPIC_API_KEY;
    const chartCtx = chartSummary ? `\n\n[The visual the candidate describes contains this exact data]: ${chartSummary}` : "";
    const prompt = `Prompt (${qType || ""}):\n${question || ""}${chartCtx}`;

    if (mode === "translate") {
      const tgt = target === "ru" ? "Russian" : "Uzbek";
      if (!hasKey) return Response.json({ text: `(demo) ${tgt} translation appears here once an API key is set.` });
      const system = `Translate the following IELTS writing question into natural, clear ${tgt}. Keep any chart/data description. Respond with JSON ONLY: {"text":"the translation"}.`;
      const clean = await callClaude(system, prompt, 700);
      try { return Response.json(JSON.parse(clean)); } catch { return Response.json({ text: clean }); }
    }

    // Cambridge-style word lookup (used by saved-word "Explain" AND the Vocab search bar)
    if (mode === "explain") {
      if (!word) return Response.json({ error: "No word." }, { status: 400 });
      if (!hasKey) return Response.json({ pos: "noun", meaning: "(demo) meaning here", usage: "(demo) usage", synonyms: ["synonym1", "synonym2"], examples: ["(demo) example sentence."] });
      const system = `You are an English dictionary for IELTS learners, in the clear style of the Cambridge Dictionary. For the given word or phrase, respond with JSON ONLY: {"pos":"part of speech e.g. noun/verb/adjective/phrase","meaning":"clear short definition","usage":"how it is typically used, register and common collocations","synonyms":["s1","s2","s3"],"examples":["natural example sentence","another example"]}. Write "meaning" and "usage" in ${language}; the examples in English. If the input is not a real English word, set meaning to a brief note that it was not found.`;
      const clean = await callClaude(system, `Word/phrase: ${word}`, 600);
      try { return Response.json(JSON.parse(clean)); } catch { return Response.json({ meaning: clean, synonyms: [], examples: [] }); }
    }

    if (mode === "model") {
      if (!hasKey) return Response.json({ essay: lang === "uz" ? "(Namuna) Band-9 model javob uchun API key qo'shing." : "(Demo) Add an API key for a real band-9 model answer." });
      const system = `You are an IELTS examiner-trainer writing a band 9.0 model answer for a ${tm.name}. Write a complete, natural answer of about ${tm.min + 40} words with clear paragraphing. For Task 1, accurately report and compare the data. Respond with JSON ONLY: {"essay":"the full model answer"}.`;
      const clean = await callClaude(system, prompt, 1300);
      try { return Response.json(JSON.parse(clean)); } catch { return Response.json({ essay: clean }); }
    }

    if (mode === "improve") {
      if (!essay) return Response.json({ error: "No essay to improve." }, { status: 400 });
      if (!hasKey) return Response.json({ improved: essay, changes: [lang === "uz" ? "(Namuna) Qayta yozish uchun API key qo'shing." : "(Demo) Add an API key for a real rewrite."] });
      const tb = targetBand || 8;
      const system = `You are an IELTS writing coach. Rewrite the candidate's ${tm.name} to reach approximately band ${tb}, KEEPING their ideas but improving vocabulary, grammar, cohesion and structure. Respond with JSON ONLY: {"improved":"the full rewritten text","changes":["short note","short note","short note"]}. Write "changes" in ${language}; the improved text in English.`;
      const clean = await callClaude(system, `${prompt}\n\nCandidate answer:\n${essay}`, 1400);
      try { return Response.json(JSON.parse(clean)); } catch { return Response.json({ improved: clean, changes: [] }); }
    }

    if (mode === "speakScore") {
      const limitResp = await checkLimit(request, body, "speakScore");
      if (limitResp) return limitResp;
      const transcript = body.transcript;
      if (!transcript) return Response.json({ error: "No transcript." }, { status: 400 });
      if (!hasKey) return Response.json({ fc: { band: 6, note: "(demo)" }, lr: { band: 6, note: "(demo)" }, gra: { band: 6, note: "(demo)" }, errors: [], overall: 6, strengths: ["(demo)"], improvements: ["(demo)"], pron_note: "(demo) Add an API key for real scoring." });
      const system = `You are a certified IELTS Speaking examiner. You are given the transcript of a shortened mock IELTS Speaking test (Parts 1-3). Lines starting with "Examiner:" are the examiner; lines starting with "Candidate:" are the candidate. Score ONLY the candidate using official IELTS Speaking band descriptors for: Fluency and Coherence (fc), Lexical Resource (lr), Grammatical Range and Accuracy (gra). Bands 0-9 in 0.5 steps; be realistically strict. Pronunciation cannot be assessed from a transcript, so do NOT score it; instead write one short honest sentence in "pron_note" explaining it was not assessed. Also identify up to 5 specific language errors from the candidate's speech: each "text" must be an exact substring from a Candidate line, "fix" is the corrected English version, "type" is one of grammar|vocabulary|cohesion, and "rule" is a VERY BRIEF explanation (max 12 words). Keep every note, strength and improvement to ONE short sentence - be concise everywhere, this must fit in a limited response. Respond with MINIFIED JSON ONLY, no markdown fences, exactly this shape: {"fc":{"band":N,"note":"S"},"lr":{"band":N,"note":"S"},"gra":{"band":N,"note":"S"},"errors":[{"text":"exact phrase from candidate","fix":"corrected version","type":"grammar|vocabulary|cohesion","rule":"brief rule"}],"strengths":["S","S"],"improvements":["S","S"],"pron_note":"S"}. Write all text (notes, strengths, improvements, pron_note, rule) in ${language}; "fix" always in English.`;
      const clean = await callClaude(system, `Transcript:\n${transcript}`, 2200);
      let parsed;
      try { parsed = extractJson(clean); }
      catch (parseErr) {
        return Response.json({ error: "Could not parse examiner output. Please try again.", debug: (process.env.NODE_ENV !== "production" ? clean.slice(0, 400) : undefined) }, { status: 502 });
      }
      const bs = [parsed?.fc?.band, parsed?.lr?.band, parsed?.gra?.band].filter((x) => typeof x === "number");
      if (bs.length === 3) parsed.overall = Math.round((bs.reduce((a, b) => a + b, 0) / 3) * 2) / 2;
      return Response.json(parsed);
    }

    if (mode === "gapCheck") {
      const original = body.original, rewrite = body.rewrite;
      if (!original || !rewrite) return Response.json({ error: "Missing original or rewrite." }, { status: 400 });
      if (!hasKey) return Response.json({ good: true, feedback: "(demo) Add an API key for real feedback.", idealRewrite: original });
      const tb = Number(body.targetBand) || 7.5;
      const system = `You are an IELTS writing coach. The candidate is practising rewriting one flawed sentence from their own past work at approximately band ${tb}. Compare their ORIGINAL flawed sentence with their REWRITE. Judge honestly whether the rewrite is a genuine improvement (better grammar, vocabulary or clarity), not just different. Respond with MINIFIED JSON ONLY: {"good":true or false,"feedback":"one or two concise, encouraging but honest sentences on what improved or still needs work","idealRewrite":"a strong band ${tb} example rewrite of the ORIGINAL sentence"}. Write "feedback" in ${language}; "idealRewrite" always in English.`;
      const clean = await callClaude(system, `ORIGINAL: ${original}\n\nREWRITE: ${rewrite}`, 500);
      try { return Response.json(extractJson(clean)); }
      catch { return Response.json({ error: "Could not parse feedback. Try again." }, { status: 502 }); }
    }

    // SCORE
    const limitRespEssay = await checkLimit(request, body, "score");
    if (limitRespEssay) return limitRespEssay;
    if (!essay || typeof essay !== "string") return Response.json({ error: "No essay provided." }, { status: 400 });
    let parsed;
    if (!hasKey) {
      parsed = mockScore(essay, words || 0, lang);
    } else {
      const t1note = taskType.startsWith("t1") ? ` Because this is Task 1, also judge whether the candidate accurately reports and compares the data; penalise factual misreadings under ${tm.first}.` : "";
      const tgt = Number(targetBand) || null;
      const tgtNote = tgt ? ` The candidate is aiming for band ${tgt}. In "toTarget", state in one or two concrete sentences the single most important thing currently keeping them below band ${tgt} and exactly what to do about it.` : "";
      const system = `You are a certified IELTS Writing examiner. Score the candidate's ${tm.name} using the official band descriptors for the four criteria: ${tm.first} (tr), Coherence and Cohesion (cc), Lexical Resource (lr), Grammatical Range and Accuracy (gra). Bands 0-9 in 0.5 steps; be realistically strict. If under ${tm.min} words, penalise ${tm.first}.${t1note}${tgtNote} Respond with MINIFIED JSON ONLY (no markdown/fences), exactly: {"tr":{"band":N,"note":"S"},"cc":{"band":N,"note":"S"},"lr":{"band":N,"note":"S"},"gra":{"band":N,"note":"S"},"strengths":["S","S"],"improvements":["S","S","S"],"errors":[{"text":"EXACT phrase from the answer","fix":"correction","type":"grammar|vocabulary|spelling|cohesion","rule":"the short grammar or usage rule that explains the fix, so the learner understands WHY"}],"synonyms":[{"word":"an overused or basic word from the answer","alts":["better1","better2","better3"]}],"paragraphs":[{"label":"a 2-4 word tag for the paragraph e.g. Introduction / Body 1 / Conclusion","note":"one concise sentence of feedback on that paragraph"}],"toTarget":"${tgt ? "see instructions" : ""}"}. The "tr" key holds the ${tm.first} score. Up to 6 errors; each "text" MUST be an exact substring of the answer. Up to 3 synonyms entries. Provide one "paragraphs" entry per paragraph the candidate actually wrote (in order). Each "note" is one concise sentence. Write note/strengths/improvements/rule/paragraphs notes/toTarget in ${language}; "fix" and "alts" always in English.`;
      const userMsg = `${prompt}\n\nCandidate answer (${words || ""} words):\n${essay}`;
      const clean = await callClaude(system, userMsg, 2100);
      try { parsed = extractJson(clean); }
      catch { return Response.json({ error: "Could not parse examiner output. Please try again." }, { status: 502 }); }
    }
    const bands = [parsed?.tr?.band, parsed?.cc?.band, parsed?.lr?.band, parsed?.gra?.band].filter((x) => typeof x === "number");
    if (bands.length === 4) parsed.overall = Math.round((bands.reduce((a, b) => a + b, 0) / 4) * 2) / 2;
    return Response.json(parsed);
  } catch (e) {
    return Response.json({ error: e.message || "Server error." }, { status: 500 });
  }
}