(() => {
  const dataUrl = "/data/products.json";
  const productGrid = document.querySelector("[data-products-grid]");
  const productState = document.querySelector("[data-products-state]");
  const portfolioGrid = document.querySelector("[data-portfolio-grid]");
  const portfolioState = document.querySelector("[data-portfolio-state]");

  if (!productGrid || !productState) {
    return;
  }

  const clearChildren = (node) => {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  };

  const setState = (target, kind, message) => {
    if (!target) {
      return;
    }

    target.className = `products-state ${kind}`;
    target.textContent = message;
  };

  const createElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }

    if (typeof text === "string") {
      element.textContent = text;
    }

    return element;
  };

  const buildInquiryUrl = (productId) => {
    const params = new URLSearchParams();
    params.set("product", productId);
    params.set("source", window.location.pathname || "/products/");
    return `/inquiry/?${params.toString()}`;
  };

  const buildDetailsUrl = (productId) => {
    const params = new URLSearchParams();
    params.set("product", productId);
    return `/products/details/?${params.toString()}`;
  };

  const normalizeBadges = (rawBadges) => {
    return Array.isArray(rawBadges)
      ? rawBadges.filter((badge) => typeof badge === "string" && badge.trim().length > 0)
      : [];
  };

  const normalizeProduct = (rawProduct, index) => {
    if (!rawProduct || typeof rawProduct !== "object") {
      return null;
    }

    const id = typeof rawProduct.id === "string" && rawProduct.id.trim().length > 0
      ? rawProduct.id.trim()
      : `product-${index + 1}`;

    const name = typeof rawProduct.name === "string" && rawProduct.name.trim().length > 0
      ? rawProduct.name.trim()
      : "Untitled product";

    const tagline = typeof rawProduct.tagline === "string" ? rawProduct.tagline.trim() : "";
    const summary = typeof rawProduct.summary === "string" ? rawProduct.summary.trim() : "";
    const details = typeof rawProduct.details === "string" ? rawProduct.details.trim() : "";
    const status = typeof rawProduct.status === "string" ? rawProduct.status.trim() : "Planned";
    const category = typeof rawProduct.category === "string" ? rawProduct.category.trim() : "General";
    const badges = normalizeBadges(rawProduct.badges);

    return { id, name, tagline, summary, details, status, category, badges };
  };

  const normalizePortfolioItem = (rawItem, index) => {
    if (!rawItem || typeof rawItem !== "object") {
      return null;
    }

    const id = typeof rawItem.id === "string" && rawItem.id.trim().length > 0
      ? rawItem.id.trim()
      : `portfolio-${index + 1}`;

    const name = typeof rawItem.name === "string" && rawItem.name.trim().length > 0
      ? rawItem.name.trim()
      : "Untitled portfolio item";

    const tagline = typeof rawItem.tagline === "string" ? rawItem.tagline.trim() : "";
    const summary = typeof rawItem.summary === "string" ? rawItem.summary.trim() : "";
    const status = typeof rawItem.status === "string" ? rawItem.status.trim() : "Live";
    const category = typeof rawItem.category === "string" ? rawItem.category.trim() : "Portfolio";
    const badges = normalizeBadges(rawItem.badges);

    const downloadUrl = typeof rawItem.downloadUrl === "string" ? rawItem.downloadUrl.trim() : "";
    const sourceUrl = typeof rawItem.sourceUrl === "string" ? rawItem.sourceUrl.trim() : "";

    return { id, name, tagline, summary, status, category, badges, downloadUrl, sourceUrl };
  };

  const renderProduct = (product) => {
    const card = createElement("article", "product-card");
    card.dataset.productId = product.id;

    const title = createElement("h2", "product-title", product.name);
    card.appendChild(title);

    if (product.tagline) {
      card.appendChild(createElement("p", "product-tagline", product.tagline));
    }

    if (product.summary) {
      card.appendChild(createElement("p", "product-summary", product.summary));
    }

    const meta = createElement("div", "product-meta");
    meta.appendChild(createElement("span", "pill", product.category));

    const statusClass = product.status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    meta.appendChild(createElement("span", `pill status-${statusClass}`, product.status));
    card.appendChild(meta);

    if (product.badges.length > 0) {
      const badgeList = createElement("ul", "product-badges");
      for (const badge of product.badges) {
        badgeList.appendChild(createElement("li", "", badge));
      }
      card.appendChild(badgeList);
    }

    const links = createElement("div", "product-links");

    const detailsLink = createElement("a", "secondary-link", "Details");
    detailsLink.href = buildDetailsUrl(product.id);
    links.appendChild(detailsLink);

    const inquiryLink = createElement("a", "", "Inquire");
    inquiryLink.href = buildInquiryUrl(product.id);
    links.appendChild(inquiryLink);

    card.appendChild(links);
    return card;
  };

  const renderPortfolioItem = (item) => {
    const card = createElement("article", "product-card");
    card.dataset.portfolioId = item.id;

    const title = createElement("h2", "product-title", item.name);
    card.appendChild(title);

    if (item.tagline) {
      card.appendChild(createElement("p", "product-tagline", item.tagline));
    }

    if (item.summary) {
      card.appendChild(createElement("p", "product-summary", item.summary));
    }

    const meta = createElement("div", "product-meta");
    meta.appendChild(createElement("span", "pill", item.category));

    const statusClass = item.status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    meta.appendChild(createElement("span", `pill status-${statusClass}`, item.status));
    card.appendChild(meta);

    if (item.badges.length > 0) {
      const badgeList = createElement("ul", "product-badges");
      for (const badge of item.badges) {
        badgeList.appendChild(createElement("li", "", badge));
      }
      card.appendChild(badgeList);
    }

    const links = createElement("div", "product-links");

    if (item.sourceUrl) {
      const sourceLink = createElement("a", "secondary-link", "Source");
      sourceLink.href = item.sourceUrl;
      sourceLink.target = "_blank";
      sourceLink.rel = "noopener noreferrer";
      links.appendChild(sourceLink);
    }

    if (item.downloadUrl) {
      const downloadLink = createElement("a", "", "Download");
      downloadLink.href = item.downloadUrl;
      downloadLink.target = "_blank";
      downloadLink.rel = "noopener noreferrer";
      links.appendChild(downloadLink);
    }

    if (links.childElementCount > 0) {
      card.appendChild(links);
    }

    return card;
  };

  const renderProducts = (payload) => {
    const products = Array.isArray(payload.products)
      ? payload.products.map(normalizeProduct).filter(Boolean)
      : [];

    clearChildren(productGrid);

    if (products.length === 0) {
      setState(productState, "empty", "No products are listed yet. Check back soon.");
      return;
    }

    products.sort((left, right) => left.name.localeCompare(right.name));

    for (const product of products) {
      productGrid.appendChild(renderProduct(product));
    }

    const updatedAt = typeof payload.updatedAt === "string" && payload.updatedAt.trim().length > 0
      ? ` Updated ${payload.updatedAt.trim()}.`
      : "";

    setState(productState, "ready", `${products.length} product${products.length === 1 ? "" : "s"} loaded.${updatedAt}`);
  };

  const renderPortfolio = (payload) => {
    if (!portfolioGrid || !portfolioState) {
      return;
    }

    const portfolioItems = Array.isArray(payload.portfolio)
      ? payload.portfolio.map(normalizePortfolioItem).filter(Boolean)
      : [];

    clearChildren(portfolioGrid);

    if (portfolioItems.length === 0) {
      setState(portfolioState, "empty", "No portfolio software is listed yet. Check back soon.");
      return;
    }

    portfolioItems.sort((left, right) => left.name.localeCompare(right.name));

    for (const item of portfolioItems) {
      portfolioGrid.appendChild(renderPortfolioItem(item));
    }

    setState(
      portfolioState,
      "ready",
      `${portfolioItems.length} portfolio item${portfolioItems.length === 1 ? "" : "s"} loaded.`
    );
  };

  const loadProducts = async () => {
    setState(productState, "loading", "Loading products…");
    setState(portfolioState, "loading", "Loading portfolio software…");

    try {
      const response = await fetch(dataUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to fetch products (${response.status})`);
      }

      const payload = await response.json();
      renderProducts(payload);
      renderPortfolio(payload);
    } catch (error) {
      clearChildren(productGrid);
      setState(productState, "error", "Unable to load products right now. Please refresh and try again.");

      if (portfolioGrid) {
        clearChildren(portfolioGrid);
      }
      setState(portfolioState, "error", "Unable to load portfolio software right now. Please refresh and try again.");

      console.error("[products] load failed", error);
    }
  };

  loadProducts();
})();
