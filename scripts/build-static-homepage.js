import fs from 'fs';
import path from 'path';

const distIndexPath = path.resolve('dist/index.html');
const distTemplatePath = path.resolve('dist/index_template.html');

async function run() {
  console.log('Preparing homepage template...');

  // 1. Read Vite's compiled index.html to extract stylesheets
  const htmlContent = fs.readFileSync(distIndexPath, 'utf-8');
  
  // Extract CSS link tags
  const cssRegex = /<link rel="stylesheet"[^>]*>/g;
  const cssMatches = htmlContent.match(cssRegex) || [];
  const cssTags = cssMatches.join('\n  ');

  // 2. Construct the HTML template shell with LINKS_PLACEHOLDER
  const templateHtml = `<!doctype html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>robotys.net</title>
  ${cssTags}
</head>

<body>
  <div id="root">
    <div class="app-card">
      <div class="columns-container">
        <!-- Left Column - persistent profile info -->
        <section class="left-column">
          <div class="header-content">
            <div class="avatar-circle">
              <img src="/robot-dp.png" alt="robotys profile avatar" />
            </div>
            <a href="/" class="brand-title">robotys.net</a>
          </div>

          <div style="margin-top: 16px;">
            <p style="font-size: 1rem; line-height: 1.7; margin-bottom: 7px;">
              Nearing 20 years doing web dev: still learning and 'bettering'. Love: web, automation, data/reporting, server, outdoor and ride (motorbike). Hate: bully, zealot, tyrant and clueless people. Pursuit: balance between form and function.
            </p>
            <quote style="font-size: 1.1rem; line-height: 1.7; margin-bottom: 12px; display: block; font-style: italic;"> "Life should be simple, but not simpler."</quote>
            <a href="/posts/" class="blue-link" style="font-size: 0.95rem; font-weight: 600;">
              Check my posts &rarr;
            </a>
          </div>
        </section>

        <!-- Right Column - Navigation / Links -->
        <section class="right-column">
          <div>
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 16px;">Featured:</h3>
            <ul class="links-list">
              <!-- LINKS_PLACEHOLDER -->
            </ul>
          </div>
        </section>
      </div>
    </div>
  </div>
</body>

</html>
`;

  // 3. Write template to dist/index_template.html
  fs.writeFileSync(distTemplatePath, templateHtml, 'utf-8');
  console.log('Successfully generated dist/index_template.html');

  // 4. Delete dist/index.html so Cloudflare Pages will run the serverless edge function for / requests
  fs.unlinkSync(distIndexPath);
  console.log('Deleted dist/index.html to enable Edge-SSR routing.');
}

run().catch(err => {
  console.error('Failed to prepare homepage template:', err);
  process.exit(1);
});
