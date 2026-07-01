export async function onRequestGet(context) {
  const { env, params } = context;
  const { slug } = params;
  const db = env.DB;

  try {
    const post = await db.prepare(
      "SELECT title, hook, markdown, updated_at, published_at FROM posts WHERE slug = ? AND status = 'published'"
    ).bind(slug).first();

    if (!post) {
      return new Response("Page not found", { status: 404 });
    }

    const htmlContent = markdownToHtml(post.markdown || '');
    const publishDate = new Date((post.published_at || post.updated_at) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} | robotys.net</title>
  <meta name="description" content="${escapeHtml(post.hook || '')}">
  <link rel="icon" type="image/png" href="/favicon.png" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Gveret+Levin&family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap');

    :root {
      --page-bg: #faf9f6;
      --text-primary: #111111;
      --gray-muted: #6e6a64;
      --border-dark: #222222;
      --link-blue: #0022ff;
      --link-blue-hover: #0011aa;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      background-color: var(--page-bg);
      color: var(--text-primary);
      font-family: var(--font-sans);
      line-height: 1.6;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
    }
    
    .app-card {
      width: 100%;
      max-width: 960px;
      background-color: transparent;
      display: flex;
      flex-direction: column;
    }

    .columns-container {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      margin-top: 16px;
      width: 100%;
    }
    
    .left-column {
      padding: 24px 32px 24px 0;
    }
    
    .right-column {
      padding: 24px 0 24px 32px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }
    
    @media (max-width: 768px) {
      .columns-container {
        grid-template-columns: 1fr;
      }
      .left-column {
        padding: 24px 0;
      }
      .right-column {
        padding: 24px 0;
      }
    }
    
    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 28px;
    }
    
    .avatar-circle {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      overflow: hidden;
      background-color: #eee;
      flex-shrink: 0;
    }
    
    .avatar-circle img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .brand-title {
      font-family: 'Gveret Levin', cursive;
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.03em;
      text-decoration: none;
      cursor: pointer;
    }
    
    h1 {
      font-size: 2.2rem;
      font-weight: 600;
      margin-bottom: 8px;
      line-height: 1.2;
    }

    .meta-info {
      font-size: 0.85rem;
      color: var(--gray-muted);
      margin-bottom: 24px;
    }
    
    h2 {
      font-size: 1.4rem;
      font-weight: 600;
      margin-top: 32px;
      margin-bottom: 12px;
    }
    
    h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-top: 24px;
      margin-bottom: 8px;
    }
    
    p {
      margin-bottom: 16px;
      font-size: 0.95rem;
    }
    
    a, .blue-link {
      color: var(--link-blue);
      text-decoration: none;
      font-weight: 500;
      cursor: pointer;
      transition: color 0.15s ease;
    }
    
    a:hover, .blue-link:hover {
      color: var(--link-blue-hover);
    }

    pre {
      background-color: #f1efe9;
      border: 1px solid #dddcd6;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
      margin-bottom: 16px;
    }

    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      background-color: #f1efe9;
      padding: 2px 4px;
      border-radius: 3px;
    }

    pre code {
      background-color: transparent;
      padding: 0;
    }

    .links-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .links-list li {
      position: relative;
      padding-left: 16px;
      font-size: 0.95rem;
    }

    .links-list li::before {
      content: "";
      position: absolute;
      left: 0;
      color: var(--text-primary);
    }

    ul, ol {
      margin-bottom: 16px;
      padding-left: 20px;
    }

    li {
      margin-bottom: 6px;
      font-size: 0.95rem;
    }

    .content ul, .content ol {
      padding-left: 20px;
      margin-bottom: 16px;
    }

    .content li {
      list-style-type: disc;
      margin-bottom: 6px;
    }
  </style>
</head>
<body>

  <div class="app-card">
    <div class="columns-container">
      <!-- Left Column -->
      <section class="left-column">
        <div class="header-content">
          <div class="avatar-circle">
            <img src="/robot-dp.png" alt="robotys profile avatar" />
          </div>
          <a href="/" class="brand-title">robotys.net</a>
        </div>
        
        <main>
          <h1>${escapeHtml(post.title)}</h1>
          <div class="meta-info">Published on ${publishDate}</div>
          
          <div class="content">
            ${htmlContent}
          </div>
          
          <div style="margin-top: 40px; border-top: 1px solid var(--border-dark); padding-top: 20px;">
            <a href="/posts/" class="blue-link">&larr; Back to Posts</a>
          </div>
        </main>
      </section>

      <!-- Right Column -->
      <section class="right-column">
      </section>
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (err) {
    return new Response("Failed to generate page: " + err.message, { status: 500 });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  // Escape HTML tags to prevent injection (excluding what we format ourselves)
  let html = escapeHtml(markdown);

  // Code blocks (```lang ... ```)
  html = html.replace(/```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)```/g, (match, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code (`code`)
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Paragraphs and Lists
  const lines = html.split('\n');
  let inList = false;
  const processedLines = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        processedLines.push('<ul>');
        inList = true;
      }
      processedLines.push(`<li>${trimmed.substring(2)}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      
      // If it's a structural tag or empty, don't wrap in p
      if (!trimmed) {
        continue;
      }
      
      if (trimmed.startsWith('<h') || trimmed.startsWith('<pre') || trimmed.startsWith('</pre') || trimmed.startsWith('<code') || trimmed.startsWith('</code') || trimmed.startsWith('<ul') || trimmed.startsWith('</ul') || trimmed.startsWith('<li')) {
        processedLines.push(line);
      } else {
        processedLines.push(`<p>${line}</p>`);
      }
    }
  }

  if (inList) {
    processedLines.push('</ul>');
  }

  return processedLines.join('\n');
}
