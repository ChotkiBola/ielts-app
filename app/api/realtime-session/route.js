export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json().catch(function () { return {}; });
    const required = process.env.APP_PASSWORD;
    if (required && body.password !== required) {
      return Response.json({ error: "Access code required.", needPassword: true }, { status: 401 });
    }
    const key = process.env.OPENAI_API_KEY;
    if (!key) return Response.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });

    const model = process.env.OPENAI_REALTIME_MODEL || "gpt-4o-realtime-preview-2024-12-17";
    const instructions = body.instructions || "You are a helpful assistant.";

    const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: model,
          instructions: instructions,
          audio: {
            input: {
              transcription: { model: "whisper-1" },
              turn_detection: { type: "server_vad" },
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
