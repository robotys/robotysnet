import { verifyAdmin } from '../_utils.js';

// PUT /api/admin/links/[id] - Update a link (e.g. status or sorting)
export async function onRequestPut(context) {
  const { request, env, params } = context;
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Access denied. Admin authorization required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { id } = params;
  const db = env.DB;
  const now = Math.floor(Date.now() / 1000);

  try {
    const body = await request.json();
    
    // Check if this is a reordering request
    if (body.reorder) {
      const direction = body.reorder;
      // Get current link's sort value
      const current = await db.prepare("SELECT sort FROM links WHERE id = ?").bind(parseInt(id, 10)).first();
      if (!current) {
        return new Response(JSON.stringify({ error: "Link not found." }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      let swapTarget;
      if (direction === 'up') {
        // Find the link with the largest sort < current.sort
        swapTarget = await db.prepare(
          "SELECT id, sort FROM links WHERE sort < ? ORDER BY sort DESC LIMIT 1"
        ).bind(current.sort).first();
      } else if (direction === 'down') {
        // Find the link with the smallest sort > current.sort
        swapTarget = await db.prepare(
          "SELECT id, sort FROM links WHERE sort > ? ORDER BY sort ASC LIMIT 1"
        ).bind(current.sort).first();
      }

      if (swapTarget) {
        // Swap sort values in a batch transaction
        await db.batch([
          db.prepare("UPDATE links SET sort = ?, updated_at = ? WHERE id = ?").bind(swapTarget.sort, now, parseInt(id, 10)),
          db.prepare("UPDATE links SET sort = ?, updated_at = ? WHERE id = ?").bind(current.sort, now, swapTarget.id)
        ]);
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Link sorted successfully."
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Standard update path
    const { text, url } = body;

    if (!text || !url) {
      return new Response(JSON.stringify({ error: "Text and URL are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    await db.prepare(
      "UPDATE links SET text = ?, url = ?, updated_at = ? WHERE id = ?"
    ).bind(text, url, now, parseInt(id, 10)).run();

    return new Response(JSON.stringify({
      success: true,
      message: "Link updated successfully."
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to update link: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// DELETE /api/admin/links/[id] - Delete a link
export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Access denied. Admin authorization required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { id } = params;
  const db = env.DB;

  try {
    await db.prepare("DELETE FROM links WHERE id = ?").bind(parseInt(id, 10)).run();
    return new Response(JSON.stringify({
      success: true,
      message: "Link deleted successfully."
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to delete link: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
