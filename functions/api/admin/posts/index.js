import { verifyAdmin } from '../_utils.js';

// GET /api/admin/posts - List posts with pagination and search
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
    
    // Fetch posts
    const { results } = await db.prepare(
      "SELECT uuid, slug, status, title, created_at, updated_at, published_at FROM posts WHERE title LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
    ).bind(searchQuery, limit, offset).all();

    // Count total posts matching search criteria
    const totalRow = await db.prepare(
      "SELECT COUNT(*) as count FROM posts WHERE title LIKE ?"
    ).bind(searchQuery).first();
    
    const total = totalRow ? totalRow.count : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return new Response(JSON.stringify({
      posts: results,
      total,
      page,
      totalPages
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch posts: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// POST /api/admin/posts - Create a new post draft
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
  const uuid = `pos-${crypto.randomUUID()}`;
  const slug = `untitled-post-${now}`;

  try {
    await db.prepare(
      "INSERT INTO posts (uuid, slug, status, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(uuid, slug, 'unpublished', 'Untitled Post', now, now).run();

    return new Response(JSON.stringify({
      success: true,
      post: { uuid }
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to create post draft: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
