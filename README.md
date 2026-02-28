# HF Labs Website

Public website for HF Labs, hosted with GitHub Pages.

## What’s included
- Landing page: `index.html`
- Papers page: `papers/index.html`
- Products page: `products/index.html`
- Product catalog data: `data/products.json`
- Runtime loader script: `assets/products.js`
- Styling: `assets/styles.css`
- Custom domain config: `CNAME` (`hflabs.dev`)

## Next setup steps
1. In repository **Settings → Pages**, set source to deploy from `main` branch (root).
2. In your domain DNS provider, configure `hflabs.dev` to point to GitHub Pages (A records) and optional `www` CNAME.
3. In GitHub Pages settings, enforce HTTPS once DNS is verified.

## Updating papers
Edit `papers/index.html` and add entries for each accepted paper with links to preprint/code.

## Updating products
Edit `data/products.json` and add or update objects in `products[]`. The products page loads this file asynchronously at runtime.
