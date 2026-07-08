export const runtime = "nodejs";

// Returns a short-lived OpenAI Realtime client secret to the browser so it
// can open a direct WebRTC connection to OpenAI. Protected by the app's
// access-code gate and only ever called from our own domain. The real
// OPENAI_API_KEY never leaves the server.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const required = process.env.APP_PASSWORD;
    if (required && body.password !== required) {
      return Response.json({ error: "Access code required.", needPassword: true }, { status: 401 });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return Response.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });

    // Hardcoded (not relying on a Vercel env var, which was not taking effect
    // in earlier testing). "gpt-realtime-mini" is the current GA Realtime model.
    const model = "gpt-realtime-mini";
    const instructions = body.instructions || "You are a helpful assistant.";

    const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: model,
          instructions: instructions,
          audio: {
            input: {
              // language: "en" + a newer transcribe model prevents the
              // transcript hallucinating random CJK text during silence.
              transcription: { model: "gpt-4o-mini-transcribe", language: "en" },
              // Gentler turn detection so the examiner doesn't cut the
              // candidate off mid-sentence during a thinking pause.
              turn_detection: { type: "server_vad", threshold: 0.65, prefix_padding_ms: 300, silence_duration_ms: 1100 },
            },
            output: { voice: "alloy" },
          },
        },
      }),
    });
    const data = await res.json();
    const ekValue = data.value || (data.client_secret && data.client_secret.value);
    if (!res.ok || !ekValue) {
      return Response.json({ error: (data.error && data.error.message) || JSON.stringify(data).slice(0, 300) }, { status: 502 });
    }
    return Response.json({ ek: ekValue, model: model });
  } catch (e) {
    return Response.json({ error: e.message || "Server error." }, { status: 500 });
  }
}