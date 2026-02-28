(() => {
  const dataUrl = "/data/products.json";
  const state = document.querySelector("[data-detail-state]");
  const mount = document.querySelector("[data-product-detail]");

  if (!state || !mount) {
    return;
  }

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

  const clearMount = () => {
    while (mount.firstChild) {
      mount.removeChild(mount.firstChild);
    }
  };

  const setState = (kind, message) => {
    state.className = `products-state ${kind}`;
    state.textContent = message;
  };

  const buildInquiryUrl = (productId) => {
    const params = new URLSearchParams();
    params.set("product", productId);
    params.set("source", window.location.pathname || "/products/details/");
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
    const detailsRaw = typeof rawProduct.details === "string" ? rawProduct.details.trim() : "";
    const details = detailsRaw.length > 0 ? detailsRaw : summary;
    const status = typeof rawProduct.status === "string" ? rawProduct.status.trim() : "Planned";
    const category = typeof rawProduct.category === "string" ? rawProduct.category.trim() : "General";
    const badges = Array.isArray(rawProduct.badges)
      ? rawProduct.badges.filter((badge) => typeof badge === "string" && badge.trim().length > 0)
      : [];

    return { id, name, tagline, summary, details, status, category, badges };
  };

  const renderProductIndex = (products) => {
    const card = createElement("article", "card product-detail-card");
    card.appendChild(createElement("h2", "", "Select a product"));
    card.appendChild(createElement("p", "", "Choose a product to view the detailed textual description."));

    const list = createElement("ul", "product-details-list");
    for (const product of products) {
      const item = createElement("li", "");
      const link = createElement("a", "", product.name);
      link.href = `/products/details/?product=${encodeURIComponent(product.id)}`;
      item.appendChild(link);
      list.appendChild(item);
    }

    card.appendChild(list);
    mount.appendChild(card);
  };

  const renderProductDetails = (product) => {
    const card = createElement("article", "card product-detail-card");

    card.appendChild(createElement("h2", "product-title", product.name));

    if (product.tagline) {
      card.appendChild(createElement("p", "product-tagline", product.tagline));
    }

    const meta = createElement("div", "product-meta");
    meta.appendChild(createElement("span", "pill", product.category));

    const statusClass = product.status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    meta.appendChild(createElement("span", `pill status-${statusClass}`, product.status));
    card.appendChild(meta);

    if (product.details) {
      const paragraphs = product.details.split(/\n\n+/).filter((chunk) => chunk.trim().length > 0);
      for (const paragraph of paragraphs) {
        card.appendChild(createElement("p", "product-detail-copy", paragraph.trim()));
      }
    }

    if (product.badges.length > 0) {
      const badges = createElement("ul", "product-badges");
      for (const badge of product.badges) {
        badges.appendChild(createElement("li", "", badge));
      }
      card.appendChild(badges);
    }

    const actions = createElement("div", "detail-actions");

    const back = createElement("a", "secondary-link", "Back to products");
    back.href = "/products/";
    actions.appendChild(back);

    const inquiry = createElement("a", "", "Inquire");
    inquiry.href = buildInquiryUrl(product.id);
    actions.appendChild(inquiry);

    card.appendChild(actions);
    mount.appendChild(card);
  };

  const loadDetails = async () => {
    const params = new URLSearchParams(window.location.search);
    const requestedId = (params.get("product") || "").trim().toLowerCase();

    setState("loading", "Loading product details…");

    try {
      const response = await fetch(dataUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to fetch products (${response.status})`);
      }

      const payload = await response.json();
      const products = Array.isArray(payload.products)
        ? payload.products.map(normalizeProduct).filter(Boolean)
        : [];

      products.sort((left, right) => left.name.localeCompare(right.name));
      clearMount();

      if (products.length === 0) {
        setState("empty", "No products are available yet.");
        return;
      }

      if (!requestedId) {
        renderProductIndex(products);
        setState("ready", "Choose a product to view details.");
        return;
      }

      const product = products.find((item) => item.id.toLowerCase() === requestedId);
      if (!product) {
        renderProductIndex(products);
        setState("error", "Requested product was not found. Choose from the list below.");
        return;
      }

      renderProductDetails(product);
      setState("ready", `${product.name} details loaded.`);
    } catch (error) {
      clearMount();
      setState("error", "Unable to load product details right now. Please refresh and try again.");
      console.error("[product-details] load failed", error);
    }
  };

  loadDetails();
})();
