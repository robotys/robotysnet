import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://robotys.net';

const urls = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/posts/', changefreq: 'weekly', priority: '0.8' },
  { loc: '/posts/adcompare.html', changefreq: 'monthly', priority: '0.9' },
  { loc: '/posts/autolog.html', changefreq: 'monthly', priority: '0.9' },
  { loc: '/posts/freeqrcode.html', changefreq: 'monthly', priority: '0.9' }
];

function generateSitemap() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${BASE_URL}${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  // Target paths
  const publicPath = path.join(__dirname, '../public/sitemap.xml');
  const distDir = path.join(__dirname, '../dist');
  const distPath = path.join(distDir, 'sitemap.xml');

  // Write to public folder (for dev)
  fs.writeFileSync(publicPath, xml, 'utf8');
  console.log(`Sitemap written to public/sitemap.xml`);

  // Write to dist folder (if exists, for production build)
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(distPath, xml, 'utf8');
    console.log(`Sitemap written to dist/sitemap.xml`);
  }
}

generateSitemap();
