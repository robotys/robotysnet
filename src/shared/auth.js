// Shared Authentication Client Utility

export async function fetchSession() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) return null;
    const data = await response.json();
    return data.user; // returns { id, email, tier } or null
  } catch (err) {
    console.error("Failed to query user session:", err);
    return null;
  }
}

export async function performLogin(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }
  return data.user;
}

export async function performRegister(email, password) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  return data;
}

export async function performLogout() {
  const response = await fetch('/api/auth/logout', { method: 'POST' });
  return response.ok;
}

export async function checkAppPermission(slug) {
  try {
    const response = await fetch(`/api/apps/check?slug=${slug}`);
    if (!response.ok) return { allowed: false, accessLevel: 'restricted' };
    const data = await response.json();
    return data; // returns { allowed, accessLevel, userTier }
  } catch (err) {
    console.error("Authorization check failed:", err);
    return { allowed: false, accessLevel: 'restricted' };
  }
}
