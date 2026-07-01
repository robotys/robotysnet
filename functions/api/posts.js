// GET /api/posts - Get list of published posts sorted by publication date
export async function onRequestGet(context) {
  const { env } = context;
  const db = env.DB;

  try {
    const { results } = await db.prepare(
      "SELECT slug, title, hook, published_at FROM posts WHERE status = 'published' ORDER BY published_at DESC"
    ).all();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60" // Cache publicly for 60 seconds
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch posts: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
