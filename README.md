# Acetate Landing

Standalone product in `apps/landing`, independent of `apps/frontend`.

Open `index.html` directly in a browser. No server, dependencies, framework, or build step is required. All styling, images, and JavaScript are local files. Keep this directory together when copying or hosting it.

- `index.html`: approved landing page with interactive demo transactions and charts.
- `landing.css` and `landing.js`: browser-only styles and script. The script is a classic bundle so it also works with `file://` URLs.
- `assets/`: logo, favicon, statement photograph, and Gabriel’s portrait.
- `contact.html` and `contact.css`: creator introduction and contact links, using the supplied résumé and portrait.
- `navigation.css`: shared navigation and contact controls with hover, keyboard-focus, and pressed states.
- `terms-of-service.html`, `privacy-policy.html`, and `legal.css`: existing legal documents, linked from the footer. Their legal wording is unchanged.

The Sign in link opens the floating sign-in card. Supabase is loaded on demand, and the app backend handles verified session handoff and invitation requests.

For hosting, publish this directory as static files. The existing `vercel.json` has no build command and preserves the `/privacy-policy` and `/terms-of-service` aliases used by the application. Direct `.html` links work without rewrites and from disk.

The landing page uses fictional data and local, in-memory category corrections. It does not upload statements, train an agent, or save corrections. Reloading restores the example. This standalone repository is the current landing source; the earlier prototype is not kept in sync.

Contact icons use Phosphor Icons Core 2.1.1 Regular, with unmodified paths. License: `assets/PHOSPHOR-LICENSE.txt`.

## SEO and static fallbacks

Canonical URLs use `https://www.acetate.me`, matching the live redirect. `robots.txt` and `sitemap.xml` cover the four public pages. Vercel redirects `.html` aliases to their canonical paths while direct files still open from disk. Validate redirect/rewrite behavior after deployment.

The initial HTML includes the full demo and charts. JavaScript adds interaction and scroll motion. After changing the demo data or render functions in `landing.js`, run `node scripts/sync-demo.mjs` and commit the refreshed `index.html`. This is an optional authoring step, not a hosting requirement. Static controls stay disabled until their interaction is available. The no-script view exposes projection assumptions.

The statement photo uses responsive AVIF with WebP fallbacks; the portrait uses WebP, which measured smaller for that image. Both have variants at 320, 480, 640, 960, and 1440 pixels. Sizes match the CSS image slots, including statement padding. Original PNG assets are preserved. To regenerate image encodings offline, run `python3 scripts/optimize-images.py` with Pillow and AVIF support installed. This authoring tool is not required to host or open the page. `acetate-social-en.png` is the English sharing card. Structured data describes Acetate and Gabriel using visible information; it makes no rating, pricing, or financial-adviser claims.

After deployment: validate redirects, sitemap and canonical URLs; inspect the page in Search Console; validate structured data; run mobile/desktop PageSpeed. Search Console verification needs the owner's account and must not be fabricated in the HTML.

## Sign-in card rollout

`sign-in.css` and `sign-in.js` implement the landing-owned dialog. Google uses PKCE with a callback to `https://www.acetate.me/?auth=callback`. The original Next.js app provides `/api/auth/config`, `/api/auth/authorize`, `/api/auth/session`, and `/auth/receive`; its existing `/api/request-access` remains unchanged. The receiver verifies identity and creates the same Supabase SSR cookies used by the original dashboard. Vercel rewrites keep the landing static. Opening HTML from disk previews the design but authentication requires HTTPS hosting (localhost is suitable for isolated UI tests).

Use the existing Acetate Supabase project and preserve its RP ID `www.acetate.me`. Register the exact landing callback. After Google sign-in, authorized members without passkeys can enroll or skip setup. The original app allowlist and Resend configuration remain in place. No Frontend 0.2 deployment is required. The vendored Supabase browser SDK is version 2.110.8 and is fetched only after a sign-in action. Invitation submissions in screenshot tests used a localhost fixture, not real mail delivery.
