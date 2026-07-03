export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;

  try {
    // 1. Fetch the posts index template from ASSETS
    const templateUrl = new URL('/posts/index_template.html', request.url);
    const response = await env.ASSETS.fetch(templateUrl);

    if (!response.ok) {
      return new Response("Posts index template not found in deployment assets.", { status: 500 });
    }

    let html = await response.text();

    // 2. Query D1 for all published posts, ordered by published_at DESC
    const { results } = await db.prepare(
      "SELECT slug, title, published_at FROM posts WHERE status = 'published' ORDER BY published_at DESC"
    ).all();

    // 3. Render posts list HTML
    let postsHtml = "";
    if (results.length === 0) {
      postsHtml = `<li style="list-style:none; padding-left:0; color:var(--gray-muted); font-style:italic;">No articles published yet.</li>`;
    } else {
      postsHtml = results.map(post => `
        <li style="margin-bottom: 0; list-style-type: none; padding-left: 0;">
          <a href="/post/${post.slug}" style="font-weight: 600; font-size: 1.05rem; display: inline-block;">
            ${post.title} &rarr;
          </a>
        </li>
      `).join('\n');
    }

    // 4. Inject posts list into template placeholder
    html = html.replace('<!-- POSTS_PLACEHOLDER -->', postsHtml);

    // 5. Return dynamic response
    return new Response(html, {
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (err) {
    return new Response(`Edge-SSR Error: ${err.message}`, { status: 500 });
  }
}
