// POST /.netlify/functions/upload
// Body: { path, content } — content is base64, path like "covers/PKG-001.png".
//
// Auth: Netlify Identity. getUser() reads the nf_jwt cookie set at login; no
// session → 401. Writes go through the GitHub Contents API using GITHUB_TOKEN
// (fine-grained PAT, Contents read+write, scoped to this repo only — set it as
// a Netlify env var, never in code). Creates the file, or overwrites it when it
// already exists (GitHub needs the current sha for that).
//
// Limits: 4 MB per file (Netlify functions cap request bodies at 6 MB and
// base64 inflates ~33%), images only, inside the five library folders.
import { getUser } from '@netlify/identity'

const OWNER = 'autosponsor'
const REPO = 'eotwsg-media-library'
const BRANCH = 'main'
const ROOTS = ['website/', 'gumroad/', 'blog/', 'newsletter/', 'covers/']
const ALLOWED_EXT = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif']
const MAX_BYTES = 4 * 1024 * 1024

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const user = await getUser().catch(() => null)
  if (!user) return json({ error: 'Unauthorized — sign in to the gallery first' }, 401)

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  const { path, content } = body || {}
  if (typeof path !== 'string' || typeof content !== 'string') {
    return json({ error: 'Body must be { path, content }' }, 400)
  }
  const clean = path.replace(/^\/+/, '')
  if (!ROOTS.some((r) => clean.startsWith(r)) || clean.includes('..') || clean.endsWith('/')) {
    return json({ error: 'Path must sit inside website/, gumroad/, blog/, newsletter/ or covers/' }, 400)
  }
  const ext = clean.split('.').pop().toLowerCase()
  if (!ALLOWED_EXT.includes(ext)) {
    return json({ error: `Extension .${ext} is not allowed` }, 400)
  }
  const approxBytes = Math.floor(content.length * 0.75)
  if (approxBytes > MAX_BYTES) {
    return json({ error: 'File too large — 4 MB max per upload' }, 413)
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return json({ error: 'Server misconfigured: GITHUB_TOKEN env var is not set' }, 500)
  }

  const api = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${clean}`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'eotwsg-media-library-upload',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  // If the file already exists, GitHub needs its sha to overwrite it.
  let sha
  const existing = await fetch(`${api}?ref=${BRANCH}`, { headers })
  if (existing.ok) {
    sha = (await existing.json()).sha
  } else if (existing.status !== 404) {
    return json({ error: `GitHub lookup failed (${existing.status})` }, 502)
  }

  const res = await fetch(api, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `${sha ? 'Replace' : 'Upload'} ${clean} via media library gallery (${user.email})`,
      content,
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    return json({ error: `GitHub upload failed (${res.status}): ${text.slice(0, 300)}` }, 502)
  }
  const data = await res.json()
  return json({
    ok: true,
    path: clean,
    replaced: Boolean(sha),
    size: data.content?.size ?? approxBytes,
    cdn_url: `https://cdn.jsdelivr.net/gh/${OWNER}/${REPO}@${BRANCH}/${clean}`,
    github_url:
      data.content?.html_url ?? `https://github.com/${OWNER}/${REPO}/blob/${BRANCH}/${clean}`,
    note: 'jsDelivr can take a few minutes to list a new file; the CDN link works once it does.',
  })
}
