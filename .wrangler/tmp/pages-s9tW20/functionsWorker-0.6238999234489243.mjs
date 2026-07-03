var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/auth/_utils.js
var PBKDF2_ITERATIONS = 1e5;
var HASH_LENGTH = 32;
var SALT_LENGTH = 16;
function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(generateToken, "generateToken");
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hashBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    baseKey,
    HASH_LENGTH * 8
  );
  const saltHex = Array.from(salt, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(new Uint8Array(hashBits), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${saltHex}.${hashHex}`;
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, storedHashAndSalt) {
  const parts = storedHashAndSalt.split(".");
  if (parts.length !== 2) return false;
  const [saltHex, storedHashHex] = parts;
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hashBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    baseKey,
    HASH_LENGTH * 8
  );
  const computedHashHex = Array.from(new Uint8Array(hashBits), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return timingSafeEqual(computedHashHex, storedHashHex);
}
__name(verifyPassword, "verifyPassword");
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
__name(timingSafeEqual, "timingSafeEqual");
function serializeSessionCookie(token, expiresAt) {
  const cookieName = "__Secure-Session";
  const dateStr = new Date(expiresAt * 1e3).toUTCString();
  return `${cookieName}=${token}; Path=/; Expires=${dateStr}; HttpOnly; Secure; SameSite=Lax`;
}
__name(serializeSessionCookie, "serializeSessionCookie");
function parseCookies(headers) {
  const list = {};
  const cookieHeader = headers.get("Cookie");
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach((cookie) => {
    let [name, ...rest] = cookie.split("=");
    name = name.trim();
    if (!name) return;
    const val = rest.join("=").trim();
    list[name] = decodeURIComponent(val);
  });
  return list;
}
__name(parseCookies, "parseCookies");

// api/admin/_utils.js
async function verifyAdmin(request, env) {
  const cookies = parseCookies(request.headers);
  const token = cookies["__Secure-Session"];
  if (!token) return null;
  const db = env.DB;
  const now = Math.floor(Date.now() / 1e3);
  try {
    const session = await db.prepare(
      "SELECT u.id, u.email FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > ?"
    ).bind(token, now).first();
    if (!session || session.email !== "robotys@gmail.com") {
      return null;
    }
    return session;
  } catch (err) {
    console.error("verifyAdmin failed:", err);
    return null;
  }
}
__name(verifyAdmin, "verifyAdmin");

// api/admin/images/upload.js
async function onRequestPost(context) {
  const { request, env } = context;
  const session = await verifyAdmin(request, env);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const buffer = await new Response(file).arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("MD5", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    let extension = "png";
    if (file.name && file.name.includes(".")) {
      extension = file.name.split(".").pop().toLowerCase();
    } else if (file.type) {
      const parts = file.type.split("/");
      if (parts.length === 2) {
        extension = parts[1].toLowerCase();
      }
    }
    const filename = `${hashHex}.${extension}`;
    const bucket = env.IMAGES_BUCKET;
    if (!bucket) {
      return new Response(JSON.stringify({ error: "R2 bucket binding IMAGES_BUCKET not found" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    await bucket.put(filename, buffer, {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
        cacheControl: "public, max-age=31536000"
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
__name(onRequestPost, "onRequestPost");

// api/admin/links/[id].js
async function onRequestPut(context) {
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
  const now = Math.floor(Date.now() / 1e3);
  try {
    const body = await request.json();
    if (body.reorder) {
      const direction = body.reorder;
      const current = await db.prepare("SELECT sort FROM links WHERE id = ?").bind(parseInt(id, 10)).first();
      if (!current) {
        return new Response(JSON.stringify({ error: "Link not found." }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }
      let swapTarget;
      if (direction === "up") {
        swapTarget = await db.prepare(
          "SELECT id, sort FROM links WHERE sort < ? ORDER BY sort DESC LIMIT 1"
        ).bind(current.sort).first();
      } else if (direction === "down") {
        swapTarget = await db.prepare(
          "SELECT id, sort FROM links WHERE sort > ? ORDER BY sort ASC LIMIT 1"
        ).bind(current.sort).first();
      }
      if (swapTarget) {
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
__name(onRequestPut, "onRequestPut");
async function onRequestDelete(context) {
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
__name(onRequestDelete, "onRequestDelete");

// api/admin/posts/[uuid].js
async function onRequestGet(context) {
  const { request, env, params } = context;
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Access denied. Admin authorization required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const { uuid } = params;
  const db = env.DB;
  try {
    const post = await db.prepare(
      "SELECT uuid, slug, status, tags, title, hook, markdown, created_at, updated_at, published_at FROM posts WHERE uuid = ?"
    ).bind(uuid).first();
    if (!post) {
      return new Response(JSON.stringify({ error: "Post not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(post), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch post: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet, "onRequestGet");
async function onRequestPut2(context) {
  const { request, env, params } = context;
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Access denied. Admin authorization required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const { uuid } = params;
  const db = env.DB;
  try {
    const body = await request.json();
    let { title, slug, status, tags, hook, markdown } = body;
    if (!title || !title.trim()) {
      return new Response(JSON.stringify({ error: "Title is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!slug || !slug.trim()) {
      slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    } else {
      slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
    if (!slug) {
      return new Response(JSON.stringify({ error: "Invalid slug format." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!hook || !hook.trim()) {
      const blocks = (markdown || "").split(/\n\s*\n/);
      let firstParagraph = "";
      for (const block of blocks) {
        const trimmed = block.trim();
        if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("- ") && !trimmed.startsWith("* ") && !trimmed.startsWith("![")) {
          firstParagraph = trimmed.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/_([^_]+)_/g, "$1").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1").replace(/`([^`]+)`/g, "$1");
          break;
        }
      }
      if (firstParagraph) {
        hook = firstParagraph.length > 200 ? firstParagraph.substring(0, 197) + "..." : firstParagraph;
      } else {
        hook = "";
      }
    }
    const existing = await db.prepare(
      "SELECT published_at FROM posts WHERE uuid = ?"
    ).bind(uuid).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: "Post not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const now = Math.floor(Date.now() / 1e3);
    let published_at = existing.published_at;
    if (status === "published") {
      if (!published_at) {
        published_at = now;
      }
    } else {
      published_at = null;
    }
    await db.prepare(
      "UPDATE posts SET title = ?, slug = ?, status = ?, tags = ?, hook = ?, markdown = ?, updated_at = ?, published_at = ? WHERE uuid = ?"
    ).bind(title, slug, status || "unpublished", tags || "", hook || "", markdown || "", now, published_at, uuid).run();
    return new Response(JSON.stringify({
      success: true,
      message: "Post updated successfully."
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to update post: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPut2, "onRequestPut");

// api/admin/links/index.js
async function onRequestGet2(context) {
  const { request, env } = context;
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Access denied. Admin authorization required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const offset = (page - 1) * limit;
  const db = env.DB;
  try {
    const searchQuery = `%${q}%`;
    const { results } = await db.prepare(
      "SELECT id, text, url, sort, created_at, updated_at FROM links WHERE text LIKE ? OR url LIKE ? ORDER BY sort ASC LIMIT ? OFFSET ?"
    ).bind(searchQuery, searchQuery, limit, offset).all();
    const totalRow = await db.prepare(
      "SELECT COUNT(*) as count FROM links WHERE text LIKE ? OR url LIKE ?"
    ).bind(searchQuery, searchQuery).first();
    const total = totalRow ? totalRow.count : 0;
    const totalPages = Math.ceil(total / limit) || 1;
    return new Response(JSON.stringify({
      links: results,
      total,
      page,
      totalPages
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch links: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet2, "onRequestGet");
async function onRequestPost2(context) {
  const { request, env } = context;
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Access denied. Admin authorization required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const db = env.DB;
  const now = Math.floor(Date.now() / 1e3);
  try {
    const body = await request.json();
    const { text, url } = body;
    if (!text || !url) {
      return new Response(JSON.stringify({ error: "Text and URL are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const maxSortRow = await db.prepare("SELECT MAX(sort) as maxSort FROM links").first();
    const nextSort = maxSortRow && maxSortRow.maxSort ? maxSortRow.maxSort + 1 : 1;
    await db.prepare(
      "INSERT INTO links (text, url, sort, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(text, url, nextSort, now, now).run();
    return new Response(JSON.stringify({
      success: true,
      message: "Link created successfully."
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to create link: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost2, "onRequestPost");

// api/admin/posts/index.js
async function onRequestGet3(context) {
  const { request, env } = context;
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Access denied. Admin authorization required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const offset = (page - 1) * limit;
  const db = env.DB;
  try {
    const searchQuery = `%${q}%`;
    const { results } = await db.prepare(
      "SELECT uuid, slug, status, title, created_at, updated_at, published_at FROM posts WHERE title LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
    ).bind(searchQuery, limit, offset).all();
    const totalRow = await db.prepare(
      "SELECT COUNT(*) as count FROM posts WHERE title LIKE ?"
    ).bind(searchQuery).first();
    const total = totalRow ? totalRow.count : 0;
    const totalPages = Math.ceil(total / limit) || 1;
    return new Response(JSON.stringify({
      posts: results,
      total,
      page,
      totalPages
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch posts: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet3, "onRequestGet");
async function onRequestPost3(context) {
  const { request, env } = context;
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Access denied. Admin authorization required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const db = env.DB;
  const now = Math.floor(Date.now() / 1e3);
  const uuid = `pos-${crypto.randomUUID()}`;
  const slug = `untitled-post-${now}`;
  try {
    await db.prepare(
      "INSERT INTO posts (uuid, slug, status, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(uuid, slug, "unpublished", "Untitled Post", now, now).run();
    return new Response(JSON.stringify({
      success: true,
      post: { uuid }
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to create post draft: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost3, "onRequestPost");

// api/apps/check.js
async function onRequestGet4(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");
    if (!slug) {
      return new Response(JSON.stringify({ error: "App slug is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const db = env.DB;
    const appInfo = await db.prepare("SELECT access_level FROM apps_access WHERE slug = ?").bind(slug).first();
    const accessLevel = appInfo ? appInfo.access_level : "restricted";
    if (accessLevel === "public") {
      return new Response(JSON.stringify({ allowed: true, accessLevel: "public" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    const cookies = parseCookies(request.headers);
    const token = cookies["__Secure-Session"];
    if (!token) {
      return new Response(JSON.stringify({ allowed: false, reason: "Login required", accessLevel }), {
        status: 200,
        // Return 200 with permission check result for graceful frontend handling
        headers: { "Content-Type": "application/json" }
      });
    }
    const now = Math.floor(Date.now() / 1e3);
    const activeSession = await db.prepare(
      "SELECT s.token, u.tier FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > ?"
    ).bind(token, now).first();
    if (!activeSession) {
      return new Response(JSON.stringify({ allowed: false, reason: "Session expired or invalid", accessLevel }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({
      allowed: true,
      accessLevel,
      userTier: activeSession.tier
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error checking authorization." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet4, "onRequestGet");

// api/auth/login.js
async function onRequestPost4(context) {
  const { request, env } = context;
  const db = env.DB;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Math.floor(Date.now() / 1e3);
  const tenMinutesAgo = now - 600;
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    await db.prepare("DELETE FROM login_attempts WHERE ip = ? AND attempt_time < ?").bind(ip, tenMinutesAgo).run();
    const attemptCountRow = await db.prepare(
      "SELECT COUNT(*) as count FROM login_attempts WHERE ip = ? AND attempt_time >= ?"
    ).bind(ip, tenMinutesAgo).first();
    const attempts = attemptCountRow ? attemptCountRow.count : 0;
    if (attempts >= 3) {
      return new Response(JSON.stringify({
        error: "Too many login attempts. Please try again after 10 minutes."
      }), {
        status: 429,
        headers: { "Content-Type": "application/json" }
      });
    }
    const user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email.toLowerCase()).first();
    if (!user) {
      await db.prepare("INSERT INTO login_attempts (ip, attempt_time) VALUES (?, ?)").bind(ip, now).run();
      return new Response(JSON.stringify({ error: "Invalid email or password." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      await db.prepare("INSERT INTO login_attempts (ip, attempt_time) VALUES (?, ?)").bind(ip, now).run();
      return new Response(JSON.stringify({ error: "Invalid email or password." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    await db.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();
    const token = generateToken();
    const expiresInSeconds = 7 * 24 * 60 * 60;
    const expiresAt = Math.floor(Date.now() / 1e3) + expiresInSeconds;
    await db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").bind(token, user.id, expiresAt).run();
    const cookie = serializeSessionCookie(token, expiresAt);
    return new Response(JSON.stringify({
      success: true,
      user: { id: user.id, email: user.email, tier: user.tier }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookie
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error occurred during login." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost4, "onRequestPost");

// api/auth/logout.js
async function onRequestPost5(context) {
  const { request, env } = context;
  try {
    const cookies = parseCookies(request.headers);
    const token = cookies["__Secure-Session"];
    if (token) {
      const db = env.DB;
      await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    }
    const expiredCookie = serializeSessionCookie("", 0);
    return new Response(JSON.stringify({ success: true, message: "Logged out successfully." }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": expiredCookie
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error occurred during logout." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost5, "onRequestPost");

// api/auth/me.js
async function onRequestGet5(context) {
  const { request, env } = context;
  try {
    const cookies = parseCookies(request.headers);
    const token = cookies["__Secure-Session"];
    if (!token) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    const db = env.DB;
    const now = Math.floor(Date.now() / 1e3);
    const session = await db.prepare(
      "SELECT s.*, u.email, u.tier FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > ?"
    ).bind(token, now).first();
    if (!session) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({
      user: { id: session.user_id, email: session.email, tier: session.tier }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error checking session status." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet5, "onRequestGet");

// api/auth/register.js
async function onRequestPost6(context) {
  const { request, env } = context;
  try {
    const { email, password } = await request.json();
    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Invalid email address format." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!password || password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters long." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const db = env.DB;
    const existingUser = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email.toLowerCase()).first();
    if (existingUser) {
      return new Response(JSON.stringify({ error: "Email already registered." }), {
        status: 409,
        headers: { "Content-Type": "application/json" }
      });
    }
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    await db.prepare("INSERT INTO users (id, email, password_hash, tier) VALUES (?, ?, ?, ?)").bind(userId, email.toLowerCase(), passwordHash, "registered").run();
    return new Response(JSON.stringify({ success: true, message: "User registered successfully." }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error occurred during registration: " + error.message + " stack: " + error.stack }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost6, "onRequestPost");

// api/auth/setup-status.js
async function onRequestGet6(context) {
  const { env } = context;
  const db = env.DB;
  try {
    const row = await db.prepare("SELECT COUNT(*) as count FROM users").first();
    const count = row ? row.count : 0;
    return new Response(JSON.stringify({
      hasUsers: count > 0
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to check setup status: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet6, "onRequestGet");

// api/auth/upgrade.js
async function onRequestPost7(context) {
  const { request, env } = context;
  try {
    const cookies = parseCookies(request.headers);
    const token = cookies["__Secure-Session"];
    if (!token) {
      return new Response(JSON.stringify({ error: "Authentication required." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const db = env.DB;
    const now = Math.floor(Date.now() / 1e3);
    const session = await db.prepare(
      "SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?"
    ).bind(token, now).first();
    if (!session) {
      return new Response(JSON.stringify({ error: "Session invalid or expired." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    await db.prepare("UPDATE users SET tier = 'paid' WHERE id = ?").bind(session.user_id).run();
    const user = await db.prepare("SELECT id, email, tier FROM users WHERE id = ?").bind(session.user_id).first();
    return new Response(JSON.stringify({
      success: true,
      message: "Upgraded to paid membership tier.",
      user: { id: user.id, email: user.email, tier: user.tier }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error during subscription upgrade." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost7, "onRequestPost");

// api/links.js
async function onRequestGet7(context) {
  const { env } = context;
  const db = env.DB;
  try {
    const { results } = await db.prepare(
      "SELECT id, text, url FROM links ORDER BY sort ASC"
    ).all();
    return new Response(JSON.stringify({ links: results }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch links: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet7, "onRequestGet");

// api/posts.js
async function onRequestGet8(context) {
  const { env } = context;
  const db = env.DB;
  try {
    const { results } = await db.prepare(
      "SELECT slug, title, hook, published_at FROM posts WHERE status = 'published' ORDER BY published_at DESC"
    ).all();
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch posts: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet8, "onRequestGet");

// images/[filename].js
async function onRequestGet9(context) {
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
__name(onRequestGet9, "onRequestGet");

// post/[slug].js
async function onRequestGet10(context) {
  const { env, params, request } = context;
  const { slug } = params;
  const db = env.DB;
  try {
    const post = await db.prepare(
      "SELECT title, hook, markdown, updated_at, published_at FROM posts WHERE slug = ? AND status = 'published'"
    ).bind(slug).first();
    if (!post) {
      return new Response("Page not found", { status: 404 });
    }
    const htmlContent = markdownToHtml(post.markdown || "");
    const publishDate = new Date((post.published_at || post.updated_at) * 1e3).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    let ogImageUrl = "";
    const imgRegex = /!\[.*?\]\((.*?)\)/;
    const match2 = (post.markdown || "").match(imgRegex);
    if (match2 && match2[1]) {
      ogImageUrl = match2[1];
      if (ogImageUrl.startsWith("/")) {
        const urlObj = new URL(request.url);
        ogImageUrl = `${urlObj.origin}${ogImageUrl}`;
      }
    }
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} | robotys.net</title>
  <meta name="description" content="${escapeHtml(post.hook || "")}">
  <meta property="og:title" content="${escapeHtml(post.title)}" />
  <meta property="og:description" content="${escapeHtml(post.hook || "")}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${request.url}" />
  ${ogImageUrl ? `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />` : ""}
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
__name(onRequestGet10, "onRequestGet");
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
__name(escapeHtml, "escapeHtml");
function markdownToHtml(markdown) {
  if (!markdown) return "";
  let html = escapeHtml(markdown);
  html = html.replace(/```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)```/g, (match2, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });
  html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; display: block; margin: 16px 0;" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  const lines = html.split("\n");
  let inList = false;
  const processedLines = [];
  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        processedLines.push("<ul>");
        inList = true;
      }
      processedLines.push(`<li>${trimmed.substring(2)}</li>`);
    } else {
      if (inList) {
        processedLines.push("</ul>");
        inList = false;
      }
      if (!trimmed) {
        continue;
      }
      if (trimmed.startsWith("<h") || trimmed.startsWith("<pre") || trimmed.startsWith("</pre") || trimmed.startsWith("<code") || trimmed.startsWith("</code") || trimmed.startsWith("<ul") || trimmed.startsWith("</ul") || trimmed.startsWith("<li")) {
        processedLines.push(line);
      } else {
        processedLines.push(`<p>${line}</p>`);
      }
    }
  }
  if (inList) {
    processedLines.push("</ul>");
  }
  return processedLines.join("\n");
}
__name(markdownToHtml, "markdownToHtml");

// admin/[[path]].js
async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const rewriteUrl = new URL("/apps/admin/index.html", url.origin);
  return env.ASSETS.fetch(rewriteUrl);
}
__name(onRequest, "onRequest");

// sitemap.xml.js
async function onRequestGet11(context) {
  const { env, request } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  try {
    const { results } = await db.prepare(
      "SELECT slug, updated_at, published_at FROM posts WHERE status = 'published' ORDER BY published_at DESC"
    ).all();
    const staticUrls = [
      { loc: "/", changefreq: "weekly", priority: "1.0" },
      { loc: "/posts/", changefreq: "weekly", priority: "0.8" },
      { loc: "/posts/adcompare.html", changefreq: "monthly", priority: "0.9" },
      { loc: "/posts/autolog.html", changefreq: "monthly", priority: "0.9" },
      { loc: "/posts/freeqrcode.html", changefreq: "monthly", priority: "0.9" }
    ];
    const postUrls = results.map((post) => {
      const timestamp = post.updated_at || post.published_at || Math.floor(Date.now() / 1e3);
      const date = new Date(timestamp * 1e3);
      const isoDate = date.toISOString().split("T")[0];
      return {
        loc: `/post/${post.slug}`,
        lastmod: isoDate,
        changefreq: "monthly",
        priority: "0.9"
      };
    });
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.map((u) => `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
${postUrls.map((u) => `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
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
__name(onRequestGet11, "onRequestGet");

// posts/index.js
async function onRequest2(context) {
  const { request, env } = context;
  const db = env.DB;
  try {
    const templateUrl = new URL("/posts/index_template.html", request.url);
    const response = await env.ASSETS.fetch(templateUrl);
    if (!response.ok) {
      return new Response("Posts index template not found in deployment assets.", { status: 500 });
    }
    let html = await response.text();
    const { results } = await db.prepare(
      "SELECT slug, title, published_at FROM posts WHERE status = 'published' ORDER BY published_at DESC"
    ).all();
    let postsHtml = "";
    if (results.length === 0) {
      postsHtml = `<li style="list-style:none; padding-left:0; color:var(--gray-muted); font-style:italic;">No articles published yet.</li>`;
    } else {
      postsHtml = results.map((post) => `
        <li style="margin-bottom: 0; list-style-type: none; padding-left: 0;">
          <a href="/post/${post.slug}" style="font-weight: 600; font-size: 1.05rem; display: inline-block;">
            ${post.title} &rarr;
          </a>
        </li>
      `).join("\n");
    }
    html = html.replace("<!-- POSTS_PLACEHOLDER -->", postsHtml);
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
__name(onRequest2, "onRequest");

// index.js
async function onRequest3(context) {
  const { request, env } = context;
  const db = env.DB;
  try {
    const templateUrl = new URL("/index_template.html", request.url);
    const response = await env.ASSETS.fetch(templateUrl);
    if (!response.ok) {
      return new Response("Homepage template not found in deployment assets.", { status: 500 });
    }
    let html = await response.text();
    const { results } = await db.prepare(
      "SELECT text, url FROM links ORDER BY sort ASC"
    ).all();
    const isExternal = /* @__PURE__ */ __name((url) => url.startsWith("http"), "isExternal");
    const linksHtml = results.map((link) => {
      const targetAttr = isExternal(link.url) ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `              <li>
                <a href="${link.url}"${targetAttr}>${link.text}</a> \u2192
              </li>`;
    }).join("\n");
    html = html.replace("<!-- LINKS_PLACEHOLDER -->", linksHtml);
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
__name(onRequest3, "onRequest");

// ../.wrangler/tmp/pages-s9tW20/functionsRoutes-0.9878228694490175.mjs
var routes = [
  {
    routePath: "/api/admin/images/upload",
    mountPath: "/api/admin/images",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/admin/links/:id",
    mountPath: "/api/admin/links",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/admin/links/:id",
    mountPath: "/api/admin/links",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut]
  },
  {
    routePath: "/api/admin/posts/:uuid",
    mountPath: "/api/admin/posts",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/admin/posts/:uuid",
    mountPath: "/api/admin/posts",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut2]
  },
  {
    routePath: "/api/admin/links",
    mountPath: "/api/admin/links",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/admin/links",
    mountPath: "/api/admin/links",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/admin/posts",
    mountPath: "/api/admin/posts",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/admin/posts",
    mountPath: "/api/admin/posts",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/apps/check",
    mountPath: "/api/apps",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/auth/login",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/auth/logout",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/auth/me",
    mountPath: "/api/auth",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/auth/register",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/auth/setup-status",
    mountPath: "/api/auth",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/auth/upgrade",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/links",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/api/posts",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/images/:filename",
    mountPath: "/images",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet9]
  },
  {
    routePath: "/post/:slug",
    mountPath: "/post",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet10]
  },
  {
    routePath: "/admin/:path*",
    mountPath: "/admin",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/sitemap.xml",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet11]
  },
  {
    routePath: "/posts",
    mountPath: "/posts",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  }
];

// ../../../.npm/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-EBsWul/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-EBsWul/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.6238999234489243.mjs.map
