import { verifyAdmin } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const session = await verifyAdmin(request, env);
  
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const url = new URL(request.url);
    const filenameParam = url.searchParams.get('filename') || 'image.png';
    const mimeTypeParam = url.searchParams.get('type') || 'application/octet-stream';

    // Read the raw binary request body directly
    const buffer = await request.arrayBuffer();

    if (!buffer || buffer.byteLength === 0) {
      return new Response(JSON.stringify({ error: "Empty file payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 1. Compute MD5 Checksum
    const hashBuffer = await crypto.subtle.digest("MD5", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 2. Determine File Extension
    let extension = 'png';
    if (filenameParam && filenameParam.includes('.')) {
      extension = filenameParam.split('.').pop().toLowerCase();
    } else if (mimeTypeParam) {
      const parts = mimeTypeParam.split('/');
      if (parts.length === 2) {
        extension = parts[1].toLowerCase();
      }
    }

    const filename = `${hashHex}.${extension}`;

    // 3. Upload to R2 Bucket
    const bucket = env.IMAGES_BUCKET;
    if (!bucket) {
      return new Response(JSON.stringify({ error: "R2 bucket binding IMAGES_BUCKET not found" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    await bucket.put(filename, buffer, {
      httpMetadata: {
        contentType: mimeTypeParam,
        cacheControl: 'public, max-age=31536000',
      }
    });

    return new Response(JSON.stringify({
      success: true,
      url: `/images/${filename}`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Upload failed: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
