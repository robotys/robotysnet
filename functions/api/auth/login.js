import { verifyPassword, generateToken, serializeSessionCookie } from './_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.DB;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Math.floor(Date.now() / 1000);
  const tenMinutesAgo = now - 600;

  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 1. Clean up old attempts for this IP and check current count
    await db.prepare("DELETE FROM login_attempts WHERE ip = ? AND attempt_time < ?").bind(ip, tenMinutesAgo).run();
    
    const attemptCountRow = await db.prepare(
      "SELECT COUNT(*) as count FROM login_attempts WHERE ip = ? AND attempt_time >= ?"
    ).bind(ip, tenMinutesAgo).first();
    
    const attempts = attemptCountRow ? attemptCountRow.count : 0;

    if (attempts >= 3) {
      return new Response(JSON.stringify({ 
        error: "Too many login attempts. Please try again after 10 minutes." 
      }), {
        status: 429,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email.toLowerCase()).first();
    
    if (!user) {
      // Record failed attempt
      await db.prepare("INSERT INTO login_attempts (ip, attempt_time) VALUES (?, ?)").bind(ip, now).run();
      return new Response(JSON.stringify({ error: "Invalid email or password." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      // Record failed attempt
      await db.prepare("INSERT INTO login_attempts (ip, attempt_time) VALUES (?, ?)").bind(ip, now).run();
      return new Response(JSON.stringify({ error: "Invalid email or password." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Clear login attempts on successful login
    await db.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();

    // Generate session
    const token = generateToken();
    const expiresInSeconds = 7 * 24 * 60 * 60; // 7 days session
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    
    await db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
      .bind(token, user.id, expiresAt)
      .run();
      
    const cookie = serializeSessionCookie(token, expiresAt);
    
    return new Response(JSON.stringify({ 
      success: true, 
      user: { id: user.id, email: user.email, tier: user.tier } 
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Set-Cookie": cookie
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error occurred during login." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
