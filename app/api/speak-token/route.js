export const runtime = "nodejs";

// Returns the API key + model directly to the browser so it can open
// the Gemini Live WebSocket. Protected by the app's access-code gate
// and only ever called from our own domain.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const required = process.env.APP_PASSWORD;
    if (required && body.password !== required) {
      return Response.json({ error: "Access code required.", needPassword: true }, { status: 401 });
    }
    const key = process.env.GEMINI_API_KEY;
    if (!key) return Response.json({ error: "GEMINI_API_KEY is not configured on the server." }, { status: 500 });
    const model = process.env.GEMINI_LIVE_MODEL || "gemini-2.0-flash-live-001";
    return Response.json({ key, model });
  } catch (e) {
    return Response.json({ error: e.message || "Server error." }, { status: 500 });
  }
}