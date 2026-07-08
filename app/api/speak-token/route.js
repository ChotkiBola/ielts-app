export const runtime = "nodejs";

// Returns a short-lived OpenAI Realtime client secret to the browser so it
// can open a direct WebSocket to OpenAI. Protected by the app's access-code
// gate and only ever called from our own domain. The real OPENAI_API_KEY
// never leaves the server.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const required = process.env.APP_PASSWORD;
    if (required && body.password !== required) {
      return Response.json({ error: "Access code required.", needPassword: true }, { status: 401 });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return Response.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
    const model = process.env.OPENAI_REALTIME_MODEL || "gpt-4o-realtime-preview-2024-12-17";

    const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ session: { type: "realtime", model: model } }),
    });
    const data = await res.json();
    if (!res.ok || !data.client_secret || !data.client_secret.value) {
      return Response.json({ error: (data.error && data.error.message) || "Could not create realtime token." }, { status: 502 });
    }
    return Response.json({ ek: data.client_secret.value, model });
  } catch (e) {
    return Response.json({ error: e.message || "Server error." }, { status: 500 });
  }
}