import { verifyAdmin } from '../_utils.js';

// GET /api/admin/posts/[uuid] - Fetch a specific post
export async function onRequestGet(context) {
  const { request, env, params } = context;
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Access denied. Admin authorization required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { uuid } = params;
  const db = env.DB;

  try {
    const post = await db.prepare(
      "SELECT uuid, slug, status, tags, title, hook, markdown, created_at, updated_at, published_at FROM posts WHERE uuid = ?"
    ).bind(uuid).first();

    if (!post) {
      return new Response(JSON.stringify({ error: "Post not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(post), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch post: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// PUT /api/admin/posts/[uuid] - Update an existing post
export async function onRequestPut(context) {
  const { request, env, params } = context;
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Access denied. Admin authorization required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { uuid } = params;
  const db = env.DB;

  try {
    const body = await request.json();
    let { title, slug, status, tags, hook, markdown } = body;

    if (!title || !slug) {
      return new Response(JSON.stringify({ error: "Title and slug are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Clean and validate slug as kebab-case
    slug = slug.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (!slug) {
      return new Response(JSON.stringify({ error: "Invalid slug format." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Fetch existing post to check publication date
    const existing = await db.prepare(
      "SELECT published_at FROM posts WHERE uuid = ?"
    ).bind(uuid).first();

    if (!existing) {
      return new Response(JSON.stringify({ error: "Post not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const now = Math.floor(Date.now() / 1000);
    let published_at = existing.published_at;

    if (status === 'published') {
      if (!published_at) {
        published_at = now;
      }
    } else {
      published_at = null;
    }

    // Execute update statement
    await db.prepare(
      "UPDATE posts SET title = ?, slug = ?, status = ?, tags = ?, hook = ?, markdown = ?, updated_at = ?, published_at = ? WHERE uuid = ?"
    ).bind(title, slug, status || 'unpublished', tags || '', hook || '', markdown || '', now, published_at, uuid).run();

    return new Response(JSON.stringify({
      success: true,
      message: "Post updated successfully."
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to update post: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
