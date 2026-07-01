import { parseCookies, serializeSessionCookie } from './_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const cookies = parseCookies(request.headers);
    const token = cookies["__Secure-Session"];
    
    if (token) {
      const db = env.DB;
      // Delete session from DB
      await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    }
    
    // Clear cookie (expires in past)
    const expiredCookie = serializeSessionCookie("", 0);
    
    return new Response(JSON.stringify({ success: true, message: "Logged out successfully." }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": expiredCookie
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error occurred during logout." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
