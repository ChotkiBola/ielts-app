# IELTS Writing Coach

A real, deployable web app. A student writes an IELTS Task 2 essay, and Claude scores it
across the four official criteria (TR / CC / LR / GRA), highlights specific mistakes inline,
gives strengths and improvements, and saves a writing history with a band-trend chart.
Built with Next.js. The Anthropic API key stays on the server (never exposed to the browser).

## What's inside
- **Write** — pick a question, write with a 40-min timer and live word count, get scored.
- **Inline corrections** — mistakes are underlined in the essay; tap to see the fix.
- **Vocab** — topic-based band-7+ academic vocabulary.
- **History** — every scored essay is saved in the browser, with a band-trend chart.
- Full **English / Uzbek** toggle for all feedback.

## Run it locally (5 minutes)

1. Install Node.js 18+ from https://nodejs.org if you don't have it.
2. In this folder, install dependencies:
   ```
   npm install
   ```
3. Get an Anthropic API key at https://console.anthropic.com (API Keys → Create Key).
4. Copy `.env.local.example` to `.env.local` and paste your key:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-real-key
   ```
5. Start the app:
   ```
   npm run dev
   ```
6. Open http://localhost:3000

## Deploy free on Vercel

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com → New Project → import the repo.
3. In the project's **Environment Variables**, add `ANTHROPIC_API_KEY` with your key.
   (Optional: add `ANTHROPIC_MODEL`, e.g. `claude-haiku-4-5-20251001` for lower cost.)
4. Deploy. You get a live URL you can share.

## Cost note
Each scored essay is one Anthropic API call. Haiku is the cheapest model; Sonnet (default)
gives stronger feedback. Set `ANTHROPIC_MODEL` to switch. Check current pricing at
https://www.anthropic.com/pricing before going live.

## Next steps (when you're ready to scale)
- Add accounts + a database so history syncs across devices (history is browser-only now).
- Add Teacher / Student / Admin roles.
- Let teachers upload their own vocab and model material (the knowledge-base idea).
- Add Task 1 and a sentence-variation engine.
