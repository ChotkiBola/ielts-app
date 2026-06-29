export const runtime = "nodejs";

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

function mockScore(essay, words, lang) {
  const uz = lang === "uz";
  let base = 5.5;
  if (words >= 130) base += 0.5;
  if (words >= 230) base += 0.5;
  const tr = clampBand(base), cc = clampBand(base + 0.5), lr = clampBand(base), gra = clampBand(base - 0.5);
  const patterns = [
    { t: "very important", fix: "crucial", type: "vocabulary" },
    { t: "a lot of", fix: "a great deal of", type: "vocabulary" },
    { t: "I think", fix: "It is widely believed that", type: "cohesion" },
    { t: "nowadays", fix: "in recent years", type: "vocabulary" },
    { t: "good", fix: "beneficial", type: "vocabulary" },
    { t: "bad", fix: "detrimental", type: "vocabulary" },
    { t: "big", fix: "significant", type: "vocabulary" },
    { t: "dont", fix: "do not", type: "grammar" },
  ];
  const low = essay.toLowerCase();
  const errors = [];
  for (const p of patterns) {
    const idx = low.indexOf(p.t.toLowerCase());
    if (idx >= 0) errors.push({ text: essay.substr(idx, p.t.length), fix: p.fix, type: p.type });
    if (errors.length >= 4) break;
  }
  return {
    tr: { band: tr, note: uz ? "(Namuna) Vazifani bajargansiz; asosiy ma'lumotlarni aniqroq bering." : "(Demo) You address the task; report the key data more clearly." },
    cc: { band: cc, note: uz ? "(Namuna) Bog'lovchilarni xilma-xil ishlating." : "(Demo) Vary your linking words for smoother flow." },
    lr: { band: lr, note: uz ? "(Namuna) Lug'at yaxshi; ko'proq akademik collocation qo'shing." : "(Demo) Decent vocabulary; add more academic collocations." },
    gra: { band: gra, note: uz ? "(Namuna) Murakkab gaplarni ko'paytiring." : "(Demo) Use more complex sentence structures." },
    strengths: uz ? ["(Namuna) Tuzilma aniq", "Haqiqiy baho uchun .env.local ga API key qo'shing"] : ["(Demo) Clear structure", "Add an API key in .env.local for real scoring"],
    improvements: uz ? ["(Namuna) Misollarni kengaytiring", "Takrorlanuvchi so'zlarni almashtiring", "Xulosani kuchaytiring"] : ["(Demo) Develop your examples", "Replace repeated words", "Strengthen the conclusion"],
    errors,
    synonyms: [{ word: "good", alts: ["beneficial", "advantageous", "valuable"] }],
    demo: true,
  };
}

async function callClaude(system, userMsg, maxTokens) {
  const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
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
    if (required && body.password !== required) {
      return Response.json({ error: "Access code required or incorrect.", needPassword: true }, { status: 401 });
    }
    const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    if (rateLimited(ip)) {
      return Response.json({ error: "Too many requests. Please wait a while and try again." }, { status: 429 });
    }

    const { mode = "score", taskType = "t2", targetBand, target, word, question, qType, essay, words, lang, chartSummary } = body;
    const language = lang === "uz" ? "Uzbek" : "English";
    const tm = TASK_DESC[taskType] || TASK_DESC.t2;
    const hasKey = !!process.env.ANTHROPIC_API_KEY;
    const chartCtx = chartSummary ? `\n\n[The visual the candidate describes contains this exact data]: ${chartSummary}` : "";
    const prompt = `Prompt (${qType || ""}):\n${question || ""}${chartCtx}`;

    // ---------- TRANSLATE QUESTION ----------
    if (mode === "translate") {
      const tgt = target === "ru" ? "Russian" : "Uzbek";
      if (!hasKey) return Response.json({ text: `(demo) ${tgt} translation appears here once an API key is set.` });
      const system = `Translate the following IELTS writing question into natural, clear ${tgt}. Keep any chart/data description. Respond with JSON ONLY: {"text":"the translation"}.`;
      const clean = await callClaude(system, prompt, 700);
      try { return Response.json(JSON.parse(clean)); } catch { return Response.json({ text: clean }); }
    }

    // ---------- EXPLAIN A SAVED WORD ----------
    if (mode === "explain") {
      if (!word) return Response.json({ error: "No word." }, { status: 400 });
      if (!hasKey) return Response.json({ meaning: "(demo) meaning here", synonyms: ["synonym1", "synonym2"], example: "(demo) example sentence." });
      const system = `You are an English vocabulary coach for IELTS. For the given word or phrase, respond with JSON ONLY: {"meaning":"short meaning","synonyms":["s1","s2","s3"],"example":"one natural example sentence using it"}. Write "meaning" in ${language}; the example in English.`;
      const clean = await callClaude(system, `Word/phrase: ${word}`, 500);
      try { return Response.json(JSON.parse(clean)); } catch { return Response.json({ meaning: clean, synonyms: [], example: "" }); }
    }

    // ---------- MODEL ANSWER ----------
    if (mode === "model") {
      if (!hasKey) return Response.json({ essay: lang === "uz" ? "(Namuna) Haqiqiy band-9 model javob uchun API key qo'shing." : "(Demo) Add an API key for a real band-9 model answer." });
      const system = `You are an IELTS examiner-trainer writing a band 9.0 model answer for a ${tm.name}. Write a complete, natural, high-level answer of about ${tm.min + 40} words with clear paragraphing. For Task 1, accurately report and compare the data given. Respond with JSON ONLY: {"essay":"the full model answer"}.`;
      const clean = await callClaude(system, prompt, 1300);
      try { return Response.json(JSON.parse(clean)); } catch { return Response.json({ essay: clean }); }
    }

    // ---------- IMPROVE MY ESSAY ----------
    if (mode === "improve") {
      if (!essay) return Response.json({ error: "No essay to improve." }, { status: 400 });
      if (!hasKey) return Response.json({ improved: essay, changes: [lang === "uz" ? "(Namuna) Haqiqiy qayta yozish uchun API key qo'shing." : "(Demo) Add an API key for a real rewrite."] });
      const tb = targetBand || 8;
      const system = `You are an IELTS writing coach. Rewrite the candidate's ${tm.name} to reach approximately band ${tb}, KEEPING their ideas and content but improving vocabulary, grammar, cohesion and structure. Respond with JSON ONLY: {"improved":"the full rewritten text","changes":["short note","short note","short note"]}. Write "changes" in ${language}; the improved text in English.`;
      const clean = await callClaude(system, `${prompt}\n\nCandidate answer:\n${essay}`, 1400);
      try { return Response.json(JSON.parse(clean)); } catch { return Response.json({ improved: clean, changes: [] }); }
    }

    // ---------- SCORE (default) ----------
    if (!essay || typeof essay !== "string") {
      return Response.json({ error: "No essay provided." }, { status: 400 });
    }
    let parsed;
    if (!hasKey) {
      parsed = mockScore(essay, words || 0, lang);
    } else {
      const t1note = taskType.startsWith("t1") ? ` Because this is Task 1, also judge whether the candidate accurately reports and compares the data shown; penalise factual misreadings under ${tm.first}.` : "";
      const system = `You are a certified IELTS Writing examiner. Score the candidate's ${tm.name} using the official IELTS band descriptors for the four criteria: ${tm.first} (tr), Coherence and Cohesion (cc), Lexical Resource (lr), Grammatical Range and Accuracy (gra). Bands are 0-9 in 0.5 steps; be realistically strict like a real examiner. If the answer is under ${tm.min} words, penalise ${tm.first}.${t1note} Respond with MINIFIED JSON ONLY (no markdown, no code fences, no preamble), matching exactly: {"tr":{"band":N,"note":"S"},"cc":{"band":N,"note":"S"},"lr":{"band":N,"note":"S"},"gra":{"band":N,"note":"S"},"strengths":["S","S"],"improvements":["S","S","S"],"errors":[{"text":"EXACT phrase from the answer","fix":"correction","type":"grammar|vocabulary|spelling|cohesion"}],"synonyms":[{"word":"an overused or basic word from the answer","alts":["better1","better2","better3"]}]}. The "tr" key holds the ${tm.first} score. Up to 8 errors; each "text" MUST be an exact substring of the answer. Up to 3 synonyms entries for repeated/basic words. Each note is one concise sentence. Write note/strengths/improvements in ${language}; "fix" and "alts" always in English.`;
      const userMsg = `${prompt}\n\nCandidate answer (${words || ""} words):\n${essay}`;
      const clean = await callClaude(system, userMsg, 1600);
      try { parsed = JSON.parse(clean); }
      catch { return Response.json({ error: "Could not parse examiner output. Please try again." }, { status: 502 }); }
    }
    const bands = [parsed?.tr?.band, parsed?.cc?.band, parsed?.lr?.band, parsed?.gra?.band].filter((x) => typeof x === "number");
    if (bands.length === 4) parsed.overall = Math.round((bands.reduce((a, b) => a + b, 0) / 4) * 2) / 2;
    return Response.json(parsed);
  } catch (e) {
    return Response.json({ error: e.message || "Server error." }, { status: 500 });
  }
}