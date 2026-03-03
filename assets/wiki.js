(() => {
  const DEFAULT_PAGE = "/docs/index.md";
  const DOCS_ROOT = "/docs/";
  const SOURCE_BASE_URL = "https://github.com/hf-laboratories/hflabs.dev/blob/main";

  const state = document.querySelector("[data-wiki-state]");
  const content = document.querySelector("[data-wiki-content]");
  const pathDisplay = document.querySelector("[data-wiki-path]");
  const sourceLink = document.querySelector("[data-wiki-source-link]");

  if (!state || !content) {
    return;
  }

  const setState = (kind, message) => {
    state.className = `products-state ${kind}`;
    state.textContent = message;
  };

  const isExternalUrl = (value) => /^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith("mailto:") || value.startsWith("tel:");

  const normalizePagePath = (value) => {
    let candidate = typeof value === "string" ? value.trim() : "";

    if (!candidate) {
      return DEFAULT_PAGE;
    }

    if (isExternalUrl(candidate)) {
      try {
        const url = new URL(candidate);
        candidate = `${url.pathname}${url.search || ""}${url.hash || ""}`;
      } catch {
        return DEFAULT_PAGE;
      }
    }

    if (!candidate.startsWith("/")) {
      candidate = `/${candidate}`;
    }

    const hashIndex = candidate.indexOf("#");
    if (hashIndex >= 0) {
      candidate = candidate.slice(0, hashIndex);
    }

    const queryIndex = candidate.indexOf("?");
    if (queryIndex >= 0) {
      candidate = candidate.slice(0, queryIndex);
    }

    candidate = candidate.replace(/\/+/g, "/");

    if (candidate.endsWith("/")) {
      candidate = `${candidate}index.md`;
    } else if (!candidate.toLowerCase().endsWith(".md")) {
      candidate = `${candidate}.md`;
    }

    if (!candidate.startsWith(DOCS_ROOT)) {
      return DEFAULT_PAGE;
    }

    return candidate;
  };

  const resolveRelativePath = (currentPage, relativeHref) => {
    const [hrefPath] = relativeHref.split("#");

    if (!hrefPath || hrefPath.trim().length === 0) {
      return currentPage;
    }

    try {
      const resolved = new URL(hrefPath, `https://hflabs.dev${currentPage}`);
      return normalizePagePath(resolved.pathname);
    } catch {
      return null;
    }
  };

  const rewriteLinks = (currentPage) => {
    const anchors = content.querySelectorAll("a[href]");

    for (const anchor of anchors) {
      const href = anchor.getAttribute("href") || "";

      if (!href || href.startsWith("#")) {
        continue;
      }

      if (isExternalUrl(href)) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        continue;
      }

      const [hrefPath, hashPart] = href.split("#");
      const resolvedPage = resolveRelativePath(currentPage, hrefPath || "");
      if (!resolvedPage) {
        continue;
      }

      const hashSuffix = hashPart ? `#${hashPart}` : "";
      anchor.href = `/wiki/?page=${encodeURIComponent(resolvedPage)}${hashSuffix}`;
    }
  };

  const rewriteImages = (currentPage) => {
    const images = content.querySelectorAll("img[src]");

    for (const image of images) {
      const src = image.getAttribute("src") || "";
      if (!src || src.startsWith("#") || src.startsWith("data:") || isExternalUrl(src)) {
        continue;
      }

      try {
        const resolved = new URL(src, `https://hflabs.dev${currentPage}`);
        image.src = `${resolved.pathname}${resolved.search || ""}${resolved.hash || ""}`;
      } catch {
        // Keep original src if resolution fails.
      }
    }
  };

  const renderMarkdown = async () => {
    const params = new URLSearchParams(window.location.search);
    const page = normalizePagePath(params.get("page") || DEFAULT_PAGE);

    if (pathDisplay) {
      pathDisplay.textContent = `Current page: ${page}`;
    }

    if (sourceLink) {
      sourceLink.href = `${SOURCE_BASE_URL}${page}`;
    }

    setState("loading", "Loading documentation…");

    try {
      const response = await fetch(page, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load markdown (${response.status})`);
      }

      const markdown = await response.text();

      if (!window.marked || typeof window.marked.parse !== "function") {
        throw new Error("Markdown renderer failed to load");
      }

      content.innerHTML = window.marked.parse(markdown, {
        gfm: true,
        breaks: false,
        headerIds: true,
        mangle: false
      });

      rewriteLinks(page);
      rewriteImages(page);

      const title = content.querySelector("h1");
      if (title && typeof title.textContent === "string" && title.textContent.trim().length > 0) {
        document.title = `HF Labs Docs - ${title.textContent.trim()}`;
      }

      setState("ready", "Documentation loaded.");
    } catch (error) {
      content.innerHTML = "";
      setState("error", "Unable to load this markdown page. Check that the file exists under /docs and refresh.");
      console.error("[wiki] load failed", error);
    }
  };

  renderMarkdown();
})();
