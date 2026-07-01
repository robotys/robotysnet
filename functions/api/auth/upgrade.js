import { parseCookies } from './_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const cookies = parseCookies(request.headers);
    const token = cookies["__Secure-Session"];
    
    if (!token) {
      return new Response(JSON.stringify({ error: "Authentication required." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const db = env.DB;
    const now = Math.floor(Date.now() / 1000);
    
    // Find session
    const session = await db.prepare(
      "SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?"
    ).bind(token, now).first();
    
    if (!session) {
      return new Response(JSON.stringify({ error: "Session invalid or expired." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Upgrade user to 'paid'
    await db.prepare("UPDATE users SET tier = 'paid' WHERE id = ?").bind(session.user_id).run();
    
    // Retrieve updated user details
    const user = await db.prepare("SELECT id, email, tier FROM users WHERE id = ?")
      .bind(session.user_id)
      .first();
      
    return new Response(JSON.stringify({
      success: true,
      message: "Upgraded to paid membership tier.",
      user: { id: user.id, email: user.email, tier: user.tier }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error during subscription upgrade." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
