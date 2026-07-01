import { hashPassword } from './_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { email, password } = await request.json();
    
    // Basic validation
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: "Invalid email address format." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (!password || password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters long." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Check if user already exists
    const db = env.DB;
    const existingUser = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email.toLowerCase()).first();
    
    if (existingUser) {
      return new Response(JSON.stringify({ error: "Email already registered." }), {
        status: 409,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Hash password and save
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    
    await db.prepare("INSERT INTO users (id, email, password_hash, tier) VALUES (?, ?, ?, ?)")
      .bind(userId, email.toLowerCase(), passwordHash, 'registered')
      .run();
      
    return new Response(JSON.stringify({ success: true, message: "User registered successfully." }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error occurred during registration: " + error.message + " stack: " + error.stack }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
