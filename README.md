# EOTWSG Media Library

One home for every EOTWSG image — website, Gumroad, blog, newsletter, and the
pack covers — with a lite, Identity-gated gallery page for browsing, downloading,
and uploading. Public repo (owner-ruled 2026-11-15): images are public-facing
assets, served fast worldwide by the jsDelivr CDN, exactly like the newsletter
image repo.

**Repo:** https://github.com/autosponsor/eotwsg-media-library
**Gallery (after deploy):** https://eotwsg-media-library.netlify.app/ (site name set at deploy time)

## Layout

| Folder | What's in it | Files |
|---|---|---:|
| `covers/` | The 12 Gumroad pack covers (PKG-001–PKG-012), 1376×768 PNG, photorealistic style | 12 |
| `website/` | eotwsg.com site assets: hero + section art, pack cards (pkg-001–011, pkg-013), posters, favicon | 63 |
| `website/assets-new/` | User-supplied + alternate site art variants (tracked in the website repo under `assets-new/`) | 22 |
| `website/app-img/` | Field Library app image variants that differ from the site versions (incl. the app's pkg-012 + pkg-013 cards) | 9 |
| `website/app-icons/` | Field Library PWA icons (192 / 512 / 512-maskable) | 3 |
| `gumroad/` | Gumroad store imagery: 12 interior-spread thumbnails (1200×1200) + the live Off-Grid Battery Revival cover | 13 |
| `blog/` | Blog images — empty for now (Blogger hosts its own images; file new ones here) | 0 |
| `newsletter/` | Grid-Down Weekly issue images, one dated folder per issue (hero + item art) | 14 |
| **Total** | | **136** |

## CDN URLs (jsDelivr)

Every file is reachable at:

```
https://cdn.jsdelivr.net/gh/autosponsor/eotwsg-media-library@main/<path>
```

Examples:

```
https://cdn.jsdelivr.net/gh/autosponsor/eotwsg-media-library@main/covers/PKG-001.png
https://cdn.jsdelivr.net/gh/autosponsor/eotwsg-media-library@main/newsletter/2026-11-09/hero.jpg
https://cdn.jsdelivr.net/gh/autosponsor/eotwsg-media-library@main/website/hero-command.webp
```

Use `@main` for always-current links. For a link that must never change, pin a commit:
`https://cdn.jsdelivr.net/gh/autosponsor/eotwsg-media-library@<sha>/<path>`.

## The gallery

`index.html` at the repo root is the whole gallery — one static page, no build
step. It lists images through the jsDelivr data API (no GitHub token needed for
reads), shows thumbnails from the CDN, and gives a copyable CDN link, GitHub
link, and full-size view for every image.

- **Browse:** grid + folder filter + filename search. Thumbnails are lazy-loaded.
- **Download:** open the full-size CDN image, or copy the CDN/GitHub link.
- **Upload:** pick a folder and files in the Upload panel. Uploads go through
  `netlify/functions/upload.js`, which commits them to this repo via the GitHub
  API. Images only (png, jpg, webp, gif, svg, avif), 4 MB max per file.
  Uploading a file with the same name as an existing one **replaces** it.
- **Freshness:** jsDelivr can take a few minutes to list a newly uploaded file.
  The CDN link in the upload result works once it does; hit Refresh in the
  gallery to re-check.
- **Deploys:** every upload is a commit to `main`, which triggers a Netlify
  redeploy. Batch uploads when you can — each deploy costs credits.

## Netlify Identity gate (invite-only)

The gallery is protected by Netlify Identity, using the current
`@netlify/identity` package (v2, headless — the old `netlify-identity-widget`
is superseded). There is no pre-built login modal: the page has a small
EOTWSG-styled sign-in form, plus invite-acceptance and password-recovery flows.

- **Browser:** `index.html` imports `@netlify/identity` from esm.sh and calls
  `login()` / `getUser()` / `logout()` / `handleAuthCallback()` /
  `acceptInvite()` / `requestPasswordRecovery()`. The gallery only renders
  after a successful sign-in.
- **Server:** `netlify/functions/upload.js` is a Netlify Functions v2 function
  (`export default`) that calls `getUser()` and returns 401 without a valid
  session — uploads are genuinely protected, not just hidden.
- **What the gate does and doesn't do:** it gates the gallery page and the
  upload endpoint. It does **not** hide the images — this is a public repo, so
  anyone with a CDN link can view an image, exactly like the newsletter image
  repo. That matches the owner's ruling: these are public-facing assets.

## Owner setup (do once, after the Nov 16 credit reset)

### 1. Create the Netlify site
Netlify dashboard → **Add new site → Import an existing project → GitHub** →
pick `autosponsor/eotwsg-media-library`. No build command; `netlify.toml` in
the repo sets the publish directory (`.`) and the functions directory.
Suggested site name: `eotwsg-media-library`
→ https://eotwsg-media-library.netlify.app/

### 2. Enable Netlify Identity
Site dashboard → **Site configuration → Identity → Enable Identity**.
Then under **Registration preferences**, choose **Invite only** (nobody can
self-register). Under **Identity → Users**, invite your email
(`matthew.s.danielson@gmail.com`).

### 3. Accept the invite
Open the invite email and click the link — it lands on the gallery page, which
shows a "set your password" form. Set a password and you're in. (Password reset
works the same way via the "Forgot your password?" link on the sign-in form.)

### 4. Create the GitHub token for uploads
GitHub → Settings → Developer settings → **Personal access tokens →
Fine-grained tokens → Generate new token**:
- Token name: `eotwsg-media-library-upload`
- Resource owner: `autosponsor`
- Repository access: **Only select repositories** → `eotwsg-media-library`
- Permissions → Repository permissions → **Contents: Read and write**
- No other permissions needed. No expiration is fine (or set one and rotate it);
  the token lives only in the Netlify env var below, never in code.

### 5. Set the Netlify env var
Site dashboard → **Site configuration → Environment variables → Add a variable**:
- Key: `GITHUB_TOKEN`
- Value: the token from step 4
- Scope: all (the upload function reads it at runtime)

Then redeploy once (Deploys → Trigger deploy) so the function picks the var up.
Uploads work from then on.

## Filing notes (what went where, and what was skipped)

- **PKG-002 cover:** the local source file was named `PKG-002-sample.png` — it
  is pixel-identical to the live Gumroad PKG-002 cover (verified against the
  live download, 1376×768), so it was filed as `covers/PKG-002.png`.
- **PKG-013 Winter:** skipped on purpose — the Winter Pack keeps the owner's own
  image, and no Winter cover file exists in `~/workspace/gumroad-covers/`. The
  owner's Winter image is at `~/workspace/user/files/1000231454_1_o4yp.png`
  (2048×1143 landscape JPEG); file it as `covers/PKG-013.jpg` on request.
- **Battery cover:** filed as `gumroad/off-grid-battery-revival-cover.jpg` —
  the live cover (1373×2047 portrait, dimensions verified against Gumroad).
  The source file is named `.png` but holds JPEG bytes, so the extension was
  corrected to `.jpg` to match.
- **Newsletter:** the canonical set comes from the `eotwsg-newsletter-images`
  repo (14 files). The website repo's `assets/newsletter/` copies are
  byte-identical duplicates and were not filed twice.
- **App images:** `app/assets/img/` files byte-identical to site assets
  (pkg-002–pkg-006) were skipped; the 9 that differ (or are app-only, like
  pkg-012) live in `website/app-img/`.
- **Skipped:** `contact-sheet-8.png` (a contact sheet, not a cover);
  `assets-new/` `.json` sidecar files (not images); the 9:16 Grid-Down Weekly
  social promo webp (ambiguous home — social, not a newsletter issue image);
  book cover proofs (Post-Collapse Engineering wraparound, Compact cover proof
  — KDP assets, not website/Gumroad/blog/newsletter); the many unidentified
  user-uploaded files in `~/workspace/user/files/` (file individually on request).
