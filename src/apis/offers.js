const API = "/api";
const base = `${API}/offers`;

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

export async function getOffersBySalesman() {
  return fetchJson(`${base}/per-salesman`);
}

/**
 * Fetch offers per country (with optional filters).
 * @param {Object} filters - { startDate, endDate, dealerId? }
 */
export async function getOffersByCountry(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  return fetchJson(`${base}/per-country?${query}`);
}

/**
 * Fetch offer status distribution.
 * @param {Object} filters - { startDate, endDate, dealerId? }
 */
export async function getOfferStatusDistribution(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  return fetchJson(`${base}/status-distribution?${query}`);
}

/**
 * Fetch average offer value.
 * @param {Object} filters
 */
export async function getAverageOfferValue(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  return fetchJson(`${base}/average-value?${query}`);
}

/**

 * @param {Object} filters - { startDate, endDate, dealerId? }
 */
export async function getTotalDiscounts(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  return fetchJson(`${base}/discounts-given?${query}`);
}
