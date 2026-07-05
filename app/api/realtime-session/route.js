export const runtime = "nodejs";

// Hardcoded (not relying on Vercel env var, which was not taking effect).
// Upgrade option: "gpt-realtime-1.5" (better hearing/voice, higher cost). Default stays mini for now.
const REALTIME_MODEL = "gpt-realtime-mini";

export async function POST(request) {
  try {
    const body = await request.json().catch(function () { return {}; });
    const required = process.env.APP_PASSWORD;
    if (required && body.password !== required) {
      return Response.json({ error: "Access code required.", needPassword: true }, { status: 401 });
    }
    const key = process.env.OPENAI_API_KEY;
    if (!key) return Response.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });

    const model = REALTIME_MODEL;
    const instructions = body.instructions || "You are a helpful assistant.";

    // Turn detection: semantic VAD (waits for the candidate to actually finish
    // a thought, not just a fixed silence window) with low eagerness so it
    // tolerates natural thinking pauses. Falls back to a tuned server_vad if
    // the account/model rejects semantic_vad.
    const turnDetectionCandidates = [
      { type: "semantic_vad", eagerness: "low" },
      { type: "server_vad", threshold: 0.65, prefix_padding_ms: 300, silence_duration_ms: 1100 },
    ];
    // Transcription: newer model pinned to English so silence/noise doesn't
    // get hallucinated into CJK text. Falls back through older models, but
    // always keeps the language hint.
    const transcriptionCandidates = [
      { model: "gpt-4o-mini-transcribe", language: "en" },
      { model: "gpt-4o-transcribe", language: "en" },
      { model: "whisper-1", language: "en" },
    ];

    let data = null;
    let res = null;
    let lastErrorMsg = "";

    for (let ti = 0; ti < transcriptionCandidates.length; ti++) {
      for (let vi = 0; vi < turnDetectionCandidates.length; vi++) {
        res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
          method: "POST",
          headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
          body: JSON.stringify({
            session: {
              type: "realtime",
              model: model,
              instructions: instructions,
              audio: {
                input: {
                  transcription: transcriptionCandidates[ti],
                  turn_detection: turnDetectionCandidates[vi],
                },
                output: { voice: "alloy" },
              },
            },
          }),
        });
        data = await res.json();
        const ekValue = data.value || (data.client_secret && data.client_secret.value);
        if (res.ok && ekValue) {
          return Response.json({ ek: ekValue, model: model });
        }
        lastErrorMsg = (data.error && data.error.message) || JSON.stringify(data).slice(0, 300);
      }
    }

    return Response.json({ error: lastErrorMsg || "Could not start realtime session." }, { status: 502 });
  } catch (e) {
    return Response.json({ error: e.message || "Server error." }, { status: 500 });
  }
}
