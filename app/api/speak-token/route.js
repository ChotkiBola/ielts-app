export const runtime = "nodejs";

// Mints a short-lived ephemeral token so the browser can open a
// Gemini Live WebSocket without ever seeing the real API key.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const required = process.env.APP_PASSWORD;
    if (required && body.password !== required) {
      return Response.json({ error: "Access code required.", needPassword: true }, { status: 401 });
    }
    const key = process.env.GEMINI_API_KEY;
    if (!key) return Response.json({ error: "GEMINI_API_KEY is not configured on the server." }, { status: 500 });

    const model = process.env.GEMINI_LIVE_MODEL || "gemini-live-2.5-flash";
    const expire = new Date(Date.now() + 12 * 60 * 1000).toISOString(); // 12 min session window
    const newSessionExpire = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // must START within 2 min

    const res = await fetch("https://generativelanguage.googleapis.com/v1alpha/auth_tokens", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ uses: 1, expireTime: expire, newSessionExpireTime: newSessionExpire }),
    });
    const data = await res.json();
    if (!res.ok || !data.name) {
      return Response.json({ error: (data.error && data.error.message) || "Could not create session token." }, { status: 502 });
    }
    return Response.json({ token: data.name, model });
  } catch (e) {
    return Response.json({ error: e.message || "Server error." }, { status: 500 });
  }
}
