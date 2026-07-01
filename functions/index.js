export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;

  try {
    // 1. Fetch the template file from ASSETS
    const templateUrl = new URL('/index_template.html', request.url);
    const response = await env.ASSETS.fetch(templateUrl);
    
    if (!response.ok) {
      return new Response("Homepage template not found in deployment assets.", { status: 500 });
    }

    let html = await response.text();

    // 2. Query D1 for links sorted by sort ASC
    const { results } = await db.prepare(
      "SELECT text, url FROM links ORDER BY sort ASC"
    ).all();

    // 3. Render links HTML
    const isExternal = (url) => url.startsWith('http');
    const linksHtml = results.map(link => {
      const targetAttr = isExternal(link.url) ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `              <li>
                <a href="${link.url}"${targetAttr}>${link.text}</a> →
              </li>`;
    }).join('\n');

    // 4. Inject links into template
    html = html.replace('<!-- LINKS_PLACEHOLDER -->', linksHtml);

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
