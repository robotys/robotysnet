import { parseCookies } from './_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    const cookies = parseCookies(request.headers);
    const token = cookies["__Secure-Session"];
    
    if (!token) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const db = env.DB;
    const now = Math.floor(Date.now() / 1000);
    
    // Find active session
    const session = await db.prepare(
      "SELECT s.*, u.email, u.tier FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > ?"
    ).bind(token, now).first();
    
    if (!session) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response(JSON.stringify({
      user: { id: session.user_id, email: session.email, tier: session.tier }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error checking session status." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
