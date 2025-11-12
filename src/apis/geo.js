const API = "/api";
const base = `${API}/dashboard/geo`;

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

export async function getGeoKpiData() {
  return fetchJson(base);
}
