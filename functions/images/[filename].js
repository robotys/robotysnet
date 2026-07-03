export async function onRequestGet(context) {
  const { env, params } = context;
  const { filename } = params;
  const bucket = env.IMAGES_BUCKET;

  if (!bucket) {
    return new Response("R2 bucket binding IMAGES_BUCKET not found", { status: 500 });
  }

  try {
    const object = await bucket.get(filename);

    if (!object) {
      return new Response("Image not found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(object.body, {
      headers
    });
  } catch (err) {
    return new Response("Error reading file: " + err.message, { status: 500 });
  }
}
