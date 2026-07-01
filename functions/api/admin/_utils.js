import { parseCookies } from '../auth/_utils.js';

export async function verifyAdmin(request, env) {
  const cookies = parseCookies(request.headers);
  const token = cookies["__Secure-Session"];
  if (!token) return null;

  const db = env.DB;
  const now = Math.floor(Date.now() / 1000);

  try {
    const session = await db.prepare(
      "SELECT u.id, u.email FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > ?"
    ).bind(token, now).first();

    if (!session || session.email !== 'robotys@gmail.com') {
      return null;
    }

    return session;
  } catch (err) {
    console.error("verifyAdmin failed:", err);
    return null;
  }
}
