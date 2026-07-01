export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Rewrite the request destination internally to serve the admin React SPA container
  const rewriteUrl = new URL('/apps/admin/index.html', url.origin);

  // Fetch and return the target asset from Cloudflare Pages static assets
  return env.ASSETS.fetch(rewriteUrl);
}
