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

    const res = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        voice: "alloy",
        instructions: instructions,
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: { type: "server_vad" },
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.client_secret || !data.client_secret.value) {
      return Response.json({ error: (data.error && data.error.message) || "Could not create realtime session." }, { status: 502 });
    }
    return Response.json({ ek: data.client_secret.value, model: model });
  } catch (e) {
    return Response.json({ error: e.message || "Server error." }, { status: 500 });
  }
}
