# Acetate Landing

Standalone product in `apps/landing`, independent of `apps/frontend`.

Open `index.html` directly in a browser. No server, dependencies, framework, or build step is required. All styling, images, and JavaScript are local files. Keep this directory together when copying or hosting it.

- `index.html`: approved landing page with interactive demo transactions and charts.
- `landing.css` and `landing.js`: browser-only styles and script. The script is a classic bundle so it also works with `file://` URLs.
- `assets/`: logo, favicon, and statement photograph.
- `terms-of-service.html`, `privacy-policy.html`, and `legal.css`: existing legal documents, linked from the footer. Their legal wording is unchanged.

The Sign in link opens https://app.acetate.me/login. Authentication belongs to the application, not this static page.

For hosting, publish this directory as static files. The existing `vercel.json` has no build command and preserves the `/privacy-policy` and `/terms-of-service` aliases used by the application. Direct `.html` links work without rewrites and from disk.

The landing page uses fictional data and local, in-memory category corrections. It does not upload statements, train an agent, or save corrections. Reloading restores the example. The source design remains in `prototypes/acetate-landing-page/simple.*` at the workspace root; update this static copy when changing that prototype.
