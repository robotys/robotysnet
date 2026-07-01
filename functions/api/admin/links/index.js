import { verifyAdmin } from '../_utils.js';

// GET /api/admin/links - List links with pagination and search
export async function onRequestGet(context) {
  const { request, env } = context;
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Access denied. Admin authorization required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = (page - 1) * limit;

  const db = env.DB;
  try {
    const searchQuery = `%${q}%`;
    
    // Fetch links ordered by sort
    const { results } = await db.prepare(
      "SELECT id, text, url, sort, created_at, updated_at FROM links WHERE text LIKE ? OR url LIKE ? ORDER BY sort ASC LIMIT ? OFFSET ?"
    ).bind(searchQuery, searchQuery, limit, offset).all();

    // Count total links matching search criteria
    const totalRow = await db.prepare(
      "SELECT COUNT(*) as count FROM links WHERE text LIKE ? OR url LIKE ?"
    ).bind(searchQuery, searchQuery).first();
    
    const total = totalRow ? totalRow.count : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return new Response(JSON.stringify({
      links: results,
      total,
      page,
      totalPages
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch links: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// POST /api/admin/links - Create a new link
export async function onRequestPost(context) {
  const { request, env } = context;
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Access denied. Admin authorization required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  const db = env.DB;
  const now = Math.floor(Date.now() / 1000);

  try {
    const body = await request.json();
    const { text, url } = body;

    if (!text || !url) {
      return new Response(JSON.stringify({ error: "Text and URL are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get max sort value to assign next sort index
    const maxSortRow = await db.prepare("SELECT MAX(sort) as maxSort FROM links").first();
    const nextSort = maxSortRow && maxSortRow.maxSort ? maxSortRow.maxSort + 1 : 1;

    await db.prepare(
      "INSERT INTO links (text, url, sort, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(text, url, nextSort, now, now).run();

    return new Response(JSON.stringify({
      success: true,
      message: "Link created successfully."
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to create link: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
