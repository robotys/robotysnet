export async function onRequestGet(context) {
  const { env } = context;
  const db = env.DB;

  try {
    const row = await db.prepare("SELECT COUNT(*) as count FROM users").first();
    const count = row ? row.count : 0;
    
    return new Response(JSON.stringify({
      hasUsers: count > 0
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to check setup status: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
