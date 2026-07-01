export async function onRequestGet(context) {
  const { env } = context;
  const db = env.DB;
  
  try {
    const { results } = await db.prepare(
      "SELECT id, text, url FROM links ORDER BY sort ASC"
    ).all();

    return new Response(JSON.stringify({ links: results }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch links: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
