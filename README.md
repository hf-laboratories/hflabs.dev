# HF Labs Website

Public website for HF Labs, hosted with GitHub Pages.

## What’s included
- Landing page: `index.html`
- Papers page: `papers/index.html`
- Products page: `products/index.html`
- Product details page: `products/details/index.html`
- Documentation wiki page: `wiki/index.html`
- Inquiry page: `inquiry/index.html`
- Product catalog data: `data/products.json`
- Documentation markdown source: `docs/index.md` and files under `docs/`
- Runtime scripts: `assets/products.js`, `assets/inquiry.js`, `assets/product-details.js`, `assets/wiki.js`
- Inquiry storage automation: `.github/workflows/stash-inquiry-submissions.yml`
- Inquiry inbox folder: `inquiries/inbox/`
- Styling: `assets/styles.css`
- Custom domain config: `CNAME` (`hflabs.dev`)

## Next setup steps
1. In repository **Settings → Pages**, set source to deploy from `main` branch (root).
2. In your domain DNS provider, configure `hflabs.dev` to point to GitHub Pages (A records) and optional `www` CNAME.
3. In GitHub Pages settings, enforce HTTPS once DNS is verified.
4. In repository **Settings → Actions → General**, allow GitHub Actions to run and ensure `GITHUB_TOKEN` has write access to contents/issues.

## Updating papers
Edit `papers/index.html` and add entries for each accepted paper with links to preprint/code.

## Updating products
Edit `data/products.json` and add or update objects in `products[]`. The products page loads this file asynchronously at runtime.

## Updating docs wiki content
1. Add or update markdown files under `docs/`.
2. Keep `docs/index.md` as the entry point.
3. Use relative markdown links between docs (for example `./releases/index.md`).
4. Open `/wiki/` or `/wiki/?page=/docs/<path>.md` to view rendered docs.

## Inquiry submission flow
1. A user clicks **Inquire** on a product card, which opens `/inquiry/?product=<id>&source=<path>`.
2. The inquiry form validates multiple-choice + short-string fields.
3. On submit, the user is redirected to a prefilled GitHub issue.
4. Workflow `.github/workflows/stash-inquiry-submissions.yml` extracts the JSON payload and stores it in `inquiries/inbox/YYYY/MM/DD/`.
