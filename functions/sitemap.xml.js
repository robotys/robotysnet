export async function onRequestGet(context) {
  const { env, request } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  try {
    const { results } = await db.prepare(
      "SELECT slug, updated_at, published_at FROM posts WHERE status = 'published' ORDER BY published_at DESC"
    ).all();

    // Standard static pages
    const staticUrls = [
      { loc: '/', changefreq: 'weekly', priority: '1.0' },
      { loc: '/posts/', changefreq: 'weekly', priority: '0.8' },
      { loc: '/posts/adcompare.html', changefreq: 'monthly', priority: '0.9' },
      { loc: '/posts/autolog.html', changefreq: 'monthly', priority: '0.9' },
      { loc: '/posts/freeqrcode.html', changefreq: 'monthly', priority: '0.9' }
    ];

    const postUrls = results.map(post => {
      const timestamp = post.updated_at || post.published_at || Math.floor(Date.now() / 1000);
      const date = new Date(timestamp * 1000);
      const isoDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
      return {
        loc: `/post/${post.slug}`,
        lastmod: isoDate,
        changefreq: 'monthly',
        priority: '0.9'
      };
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.map(u => `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
${postUrls.map(u => `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (err) {
    return new Response("Error generating sitemap: " + err.message, { status: 500 });
  }
}
