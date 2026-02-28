(() => {
  const dataUrl = "/data/products.json";
  const grid = document.querySelector("[data-products-grid]");
  const state = document.querySelector("[data-products-state]");

  if (!grid || !state) {
    return;
  }

  const clearChildren = (node) => {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  };

  const setState = (kind, message) => {
    state.className = `products-state ${kind}`;
    state.textContent = message;
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
    const status = typeof rawProduct.status === "string" ? rawProduct.status.trim() : "Planned";
    const category = typeof rawProduct.category === "string" ? rawProduct.category.trim() : "General";
    const badges = Array.isArray(rawProduct.badges)
      ? rawProduct.badges.filter((badge) => typeof badge === "string" && badge.trim().length > 0)
      : [];

    const links = Array.isArray(rawProduct.links)
      ? rawProduct.links
          .filter((link) => link && typeof link === "object")
          .map((link) => ({
            label: typeof link.label === "string" && link.label.trim().length > 0 ? link.label.trim() : "Link",
            url: typeof link.url === "string" ? link.url.trim() : ""
          }))
          .filter((link) => link.url.length > 0)
      : [];

    return { id, name, tagline, summary, status, category, badges, links };
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
    for (const link of product.links) {
      const anchor = createElement("a", "", link.label);
      anchor.href = link.url;
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
      links.appendChild(anchor);
    }

    const inquiryLink = createElement("a", "secondary-link", "Inquire");
    inquiryLink.href = buildInquiryUrl(product.id);
    links.appendChild(inquiryLink);

    card.appendChild(links);
    return card;
  };

  const loadProducts = async () => {
    setState("loading", "Loading products…");

    try {
      const response = await fetch(dataUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to fetch products (${response.status})`);
      }

      const payload = await response.json();
      const products = Array.isArray(payload.products)
        ? payload.products.map(normalizeProduct).filter(Boolean)
        : [];

      clearChildren(grid);

      if (products.length === 0) {
        setState("empty", "No products are listed yet. Check back soon.");
        return;
      }

      products.sort((left, right) => left.name.localeCompare(right.name));

      for (const product of products) {
        grid.appendChild(renderProduct(product));
      }

      const updatedAt = typeof payload.updatedAt === "string" && payload.updatedAt.trim().length > 0
        ? ` Updated ${payload.updatedAt.trim()}.`
        : "";

      setState("ready", `${products.length} product${products.length === 1 ? "" : "s"} loaded.${updatedAt}`);
    } catch (error) {
      clearChildren(grid);
      setState("error", "Unable to load products right now. Please refresh and try again.");
      console.error("[products] load failed", error);
    }
  };

  loadProducts();
})();
