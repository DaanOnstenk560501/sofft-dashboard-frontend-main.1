const API = "/api";
const base = `${API}/cross-sell-products`;

async function fetchJson(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  let data = null;
  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
    }
  }

  if (!res.ok) {
    const err = new Error(
      (data && (data.message || data.error)) || `HTTP ${res.status}`
    );
    if (data && data.errors) err.fieldErrors = data.errors;
    throw err;
  }

  return data;
}

export async function getTotalUpsellValue() {
  return fetchJson(`${base}/total-upsell-value`);
}

export async function getAverageUpsellValue() {
  return fetchJson(`${base}/average-upsell-value`);
}

export async function getDiscountedUpsells() {
  return fetchJson(`${base}/discounted-upsells`);
}

export async function getTopUpsellCategories(mode = "count") {
  const endpoint =
    mode === "value"
      ? `${base}/top-upsell-categories-value`
      : `${base}/top-upsell-categories-count`;
  return fetchJson(endpoint);
}

export async function getTopUpsellItems(mode = "count") {
  const endpoint =
    mode === "value"
      ? `${base}/top-upsell-items-value`
      : `${base}/top-upsell-items-count`;
  return fetchJson(endpoint);
}
