import { parseCookies } from '../auth/_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");
    
    if (!slug) {
      return new Response(JSON.stringify({ error: "App slug is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const db = env.DB;
    
    // Check app access level
    const appInfo = await db.prepare("SELECT access_level FROM apps_access WHERE slug = ?")
      .bind(slug)
      .first();
      
    // Default to restricted if app is not in D1 DB configuration
    const accessLevel = appInfo ? appInfo.access_level : 'restricted';
    
    if (accessLevel === 'public') {
      return new Response(JSON.stringify({ allowed: true, accessLevel: 'public' }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // It's restricted; verify user session
    const cookies = parseCookies(request.headers);
    const token = cookies["__Secure-Session"];
    
    if (!token) {
      return new Response(JSON.stringify({ allowed: false, reason: "Login required", accessLevel }), {
        status: 200, // Return 200 with permission check result for graceful frontend handling
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const now = Math.floor(Date.now() / 1000);
    const activeSession = await db.prepare(
      "SELECT s.token, u.tier FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > ?"
    ).bind(token, now).first();
    
    if (!activeSession) {
      return new Response(JSON.stringify({ allowed: false, reason: "Session expired or invalid", accessLevel }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response(JSON.stringify({ 
      allowed: true, 
      accessLevel, 
      userTier: activeSession.tier 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error checking authorization." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
