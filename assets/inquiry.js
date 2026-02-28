(() => {
  const repoIssueUrl = "https://github.com/hf-laboratories/hflabs.dev/issues/new";
  const productsDataUrl = "/data/products.json";

  const shortPattern = /^[A-Za-z0-9 _\-\.,@]{1,120}$/;
  const messagePattern = /^[A-Za-z0-9 _\-\.,@\r\n]{1,600}$/;
  const emailPattern = /^[A-Za-z0-9._,-]+@[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+$/;
  const productIdPattern = /^[A-Za-z0-9_-]{1,80}$/;

  const allowedInquiryTypes = new Set([
    "Demo Request",
    "Pricing",
    "Integration",
    "Support",
    "Partnership",
    "Other"
  ]);

  const allowedBudgetBands = new Set([
    "Unknown",
    "Under 10k",
    "10k to 50k",
    "50k to 250k",
    "Over 250k"
  ]);

  const allowedTimelines = new Set([
    "Immediate",
    "This Quarter",
    "Next Quarter",
    "Exploring"
  ]);

  const allowedContactMethods = new Set(["Email", "GitHub"]);

  const form = document.querySelector("[data-inquiry-form]");
  const productSelect = document.querySelector("[data-product-select]");
  const sourceDisplay = document.querySelector("[data-source-display]");
  const sourceInput = document.querySelector("[data-source-input]");
  const errorList = document.querySelector("[data-form-errors]");
  const submitStatus = document.querySelector("[data-submit-status]");

  if (!form || !productSelect || !sourceDisplay || !sourceInput || !errorList || !submitStatus) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const spawnedProduct = (params.get("product") || "").trim();
  const querySource = (params.get("source") || "").trim();
  const fallbackSource = document.referrer ? "external-referrer" : "/products/";
  const sourcePage = querySource.length > 0 ? querySource : fallbackSource;

  sourceInput.value = sourcePage;
  sourceDisplay.textContent = `Inquiry source: ${sourcePage}${spawnedProduct ? ` (product: ${spawnedProduct})` : ""}`;

  const clearErrors = () => {
    errorList.innerHTML = "";
    errorList.hidden = true;
  };

  const showErrors = (messages) => {
    errorList.innerHTML = "";
    for (const message of messages) {
      const item = document.createElement("li");
      item.textContent = message;
      errorList.appendChild(item);
    }
    errorList.hidden = messages.length === 0;
  };

  const setStatus = (kind, message) => {
    submitStatus.className = `products-state ${kind}`;
    submitStatus.textContent = message;
  };

  const sanitize = (value) => (typeof value === "string" ? value.trim() : "");

  const addProductOption = (productId, productName, selected) => {
    const option = document.createElement("option");
    option.value = productId;
    option.textContent = `${productName} (${productId})`;
    if (selected) {
      option.selected = true;
    }
    productSelect.appendChild(option);
  };

  const populateProducts = async () => {
    let matchedSpawnedProduct = false;

    try {
      const response = await fetch(productsDataUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to fetch products (${response.status})`);
      }

      const payload = await response.json();
      const products = Array.isArray(payload.products) ? payload.products : [];
      products.sort((left, right) => {
        const leftName = typeof left?.name === "string" ? left.name : "";
        const rightName = typeof right?.name === "string" ? right.name : "";
        return leftName.localeCompare(rightName);
      });

      for (const product of products) {
        if (!product || typeof product !== "object") {
          continue;
        }

        const productId = sanitize(product.id);
        const productName = sanitize(product.name) || productId;

        if (!productId || !productIdPattern.test(productId)) {
          continue;
        }

        const isSelected = spawnedProduct.length > 0 && productId === spawnedProduct;
        if (isSelected) {
          matchedSpawnedProduct = true;
        }

        addProductOption(productId, productName, isSelected);
      }
    } catch (error) {
      console.error("[inquiry] failed to load products", error);
      setStatus("error", "Product list could not be loaded. You can still submit by selecting/typing valid values.");
    }

    if (spawnedProduct.length > 0 && !matchedSpawnedProduct && productIdPattern.test(spawnedProduct)) {
      addProductOption(spawnedProduct, spawnedProduct, true);
    }
  };

  const validateShort = (value, fieldName, required, errors) => {
    if (!value) {
      if (required) {
        errors.push(`${fieldName} is required.`);
      }
      return;
    }

    if (!shortPattern.test(value)) {
      errors.push(`${fieldName} contains invalid characters.`);
    }
  };

  const validate = (input) => {
    const errors = [];

    if (!productIdPattern.test(input.productId)) {
      errors.push("Product selection is invalid.");
    }

    if (!allowedInquiryTypes.has(input.inquiryType)) {
      errors.push("Inquiry type must be selected from the list.");
    }

    if (!allowedBudgetBands.has(input.budgetBand)) {
      errors.push("Budget band must be selected from the list.");
    }

    if (!allowedTimelines.has(input.timeline)) {
      errors.push("Timeline must be selected from the list.");
    }

    if (!allowedContactMethods.has(input.preferredContact)) {
      errors.push("Preferred follow-up must be selected from the list.");
    }

    validateShort(input.name, "Name", true, errors);
    validateShort(input.organization, "Organization", false, errors);
    validateShort(input.subject, "Subject", true, errors);

    if (!input.email) {
      errors.push("Email is required.");
    } else if (!emailPattern.test(input.email)) {
      errors.push("Email format is invalid or uses unsupported characters.");
    }

    if (!input.message) {
      errors.push("Inquiry message is required.");
    } else if (!messagePattern.test(input.message)) {
      errors.push("Inquiry message contains invalid characters.");
    }

    return errors;
  };

  const createIssueBody = (payload) => {
    const inquiry = payload.inquiry;
    return [
      "<!-- inquiry-submission:v1 -->",
      "# HF Labs inquiry submission",
      "",
      "This issue was generated from the hosted inquiry form.",
      "",
      "## Summary",
      `- Product: ${inquiry.productId}`,
      `- Type: ${inquiry.inquiryType}`,
      `- Timeline: ${inquiry.timeline}`,
      `- Preferred contact: ${inquiry.preferredContact}`,
      `- Source page: ${payload.source.sourcePage}`,
      "",
      "## Payload",
      "```json",
      JSON.stringify(payload, null, 2),
      "```"
    ].join("\n");
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();

    const formData = new FormData(form);

    const input = {
      productId: sanitize(formData.get("productId")),
      inquiryType: sanitize(formData.get("inquiryType")),
      budgetBand: sanitize(formData.get("budgetBand")),
      timeline: sanitize(formData.get("timeline")),
      preferredContact: sanitize(formData.get("preferredContact")),
      name: sanitize(formData.get("name")),
      organization: sanitize(formData.get("organization")),
      email: sanitize(formData.get("email")),
      subject: sanitize(formData.get("subject")),
      message: typeof formData.get("message") === "string" ? formData.get("message").trim() : ""
    };

    const errors = validate(input);
    if (errors.length > 0) {
      showErrors(errors);
      setStatus("error", "Please fix the highlighted validation issues before submitting.");
      return;
    }

    const payload = {
      schemaVersion: "inquiry.v1",
      submittedAtUtc: new Date().toISOString(),
      source: {
        spawnedFromProduct: spawnedProduct || input.productId,
        sourcePage,
        inquiryPage: window.location.pathname,
        referrer: document.referrer || ""
      },
      inquiry: input
    };

    const title = `[Inquiry] ${input.productId} - ${input.subject}`;
    const body = createIssueBody(payload);

    const query = new URLSearchParams({
      title,
      labels: "inquiry-submission",
      body
    });

    setStatus("loading", "Redirecting to GitHub to finalize submission…");
    window.location.assign(`${repoIssueUrl}?${query.toString()}`);
  });

  populateProducts();
})();
