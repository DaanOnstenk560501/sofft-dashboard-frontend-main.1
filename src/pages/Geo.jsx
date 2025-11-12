import { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { getGeoKpiData } from "../apis/geo";

const WORLD_GEOJSON_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const ZERO_SALES_FILL = "#d2dfd7";
const COLOR_STOPS = ["#d7f2df", "#aee4c5", "#7acc9d", "#49a374", "#2f7b51", "#18553a"];
const COLOR_EXPONENT = 0.55;
const INITIAL_VIEWPORT = { center: [8, 20], zoom: 1.2 };
const ZOOM_MIN = 1;
const ZOOM_MAX = 8;

const fallbackGeoKpi = {
  updatedAt: null,
  currency: "EUR",
  entries: [
    { countryCode: "USA", countryName: "United States", sales: 420000 },
    { countryCode: "DEU", countryName: "Germany", sales: 365000 },
    { countryCode: "FRA", countryName: "France", sales: 292500 },
    { countryCode: "GBR", countryName: "United Kingdom", sales: 248400 },
    { countryCode: "ESP", countryName: "Spain", sales: 210300 },
    { countryCode: "ITA", countryName: "Italy", sales: 189200 },
    { countryCode: "BRA", countryName: "Brazil", sales: 152000 },
    { countryCode: "CAN", countryName: "Canada", sales: 143600 },
    { countryCode: "AUS", countryName: "Australia", sales: 127500 },
    { countryCode: "IND", countryName: "India", sales: 118900 },
  ],
};

// --- Helper functions (same as before) ---
function normalizeCountryRecord(record) {
  if (!record || typeof record !== "object") return null;
  const rawCode =
    record.countryCode ??
    record.countryISO ??
    record.countryIso ??
    record.country?.code ??
    record.code ??
    record.iso_code;

  const numericValue =
    record.sales ??
    record.totalSales ??
    record.revenue ??
    record.value ??
    record.amount ??
    record.total ??
    record.count;

  if (!rawCode || numericValue === undefined || numericValue === null) return null;

  const parsedValue = Number(numericValue);
  if (Number.isNaN(parsedValue) || parsedValue < 0) return null;

  const code = String(rawCode).trim().toUpperCase();
  const countryName =
    record.countryName ??
    record.country?.name ??
    record.name ??
    record.label ??
    record.title ??
    code;

  const ordersValue =
    record.orders ??
    record.orderCount ??
    record.totalOrders ??
    record.ordersCount ??
    record.countOrders ??
    record.count;

  const parsedOrders = Number(ordersValue);

  return {
    countryCode: code,
    countryName,
    sales: parsedValue,
    orders: Number.isFinite(parsedOrders) && parsedOrders >= 0 ? parsedOrders : 0,
  };
}

function extractGeoPayload(payload) {
  const meta = {
    updatedAt: payload?.updatedAt ?? null,
    currency: payload?.currency ?? payload?.meta?.currency ?? null,
  };

  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.entries)
    ? payload.entries
    : Array.isArray(payload?.countries)
    ? payload.countries
    : Array.isArray(payload?.data)
    ? payload.data
    : [];

  const entries = rows
    .map((row) => normalizeCountryRecord(row))
    .filter((row) => row !== null)
    .sort((a, b) => b.sales - a.sales);

  return { entries, meta };
}

function normalizeName(value) {
  if (!value) return "";
  return value
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function rgbToHex([r, g, b]) {
  const toHex = (value) => value.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function interpolateColor(ratio) {
  const safeRatio = Math.min(Math.max(ratio, 0), 1);
  const adjusted = Math.pow(safeRatio, COLOR_EXPONENT);
  const scaled = adjusted * (COLOR_STOPS.length - 1);
  const lowerIndex = Math.floor(scaled);
  const upperIndex = Math.min(COLOR_STOPS.length - 1, Math.ceil(scaled));

  if (lowerIndex === upperIndex) {
    return COLOR_STOPS[lowerIndex];
  }

  const t = scaled - lowerIndex;
  const lowerRgb = hexToRgb(COLOR_STOPS[lowerIndex]);
  const upperRgb = hexToRgb(COLOR_STOPS[upperIndex]);
  const mixed = lowerRgb.map((value, idx) =>
    Math.round(value + (upperRgb[idx] - value) * t)
  );
  return rgbToHex(mixed);
}

// --- Main Component ---
export default function Geo() {
  const [countrySales, setCountrySales] = useState([]);
  const [meta, setMeta] = useState({ updatedAt: null, currency: fallbackGeoKpi.currency });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [viewport, setViewport] = useState(INITIAL_VIEWPORT);

  useEffect(() => {
    let ignore = false;

    async function loadGeoKpi() {
      try {
        const payload = await getGeoKpiData();
        if (ignore) return;

        const { entries, meta: metaFromPayload } = extractGeoPayload(payload);

        if (entries.length === 0) {
          setCountrySales(fallbackGeoKpi.entries);
          setMeta({ updatedAt: fallbackGeoKpi.updatedAt, currency: fallbackGeoKpi.currency });
          setError("No geo KPI data returned. Displaying sample data.");
        } else {
          setCountrySales(entries);
          setMeta({
            updatedAt: metaFromPayload.updatedAt ?? fallbackGeoKpi.updatedAt,
            currency: metaFromPayload.currency ?? fallbackGeoKpi.currency,
          });
          setError(null);
        }
      } catch (err) {
        console.error("Failed to load geo KPI data:", err);
        if (!ignore) {
          setCountrySales(fallbackGeoKpi.entries);
          setMeta({ updatedAt: fallbackGeoKpi.updatedAt, currency: fallbackGeoKpi.currency });
          setError("Unable to reach geo KPI endpoint. Displaying sample data.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadGeoKpi();
    return () => { ignore = true; };
  }, []);

  const salesByCountry = useMemo(() => {
    const map = new Map();
    countrySales.forEach(({ countryCode, countryName, sales }) => {
      map.set(countryCode.toUpperCase(), sales);
      const normalized = normalizeName(countryName);
      if (normalized) map.set(normalized, sales);
    });
    return map;
  }, [countrySales]);

  const ordersByCountry = useMemo(() => {
    const map = new Map();
    countrySales.forEach(({ countryCode, countryName, orders }) => {
      map.set(countryCode.toUpperCase(), orders ?? 0);
      const normalized = normalizeName(countryName);
      if (normalized) map.set(normalized, orders ?? 0);
    });
    return map;
  }, [countrySales]);

  const maxSales = useMemo(
    () => countrySales.reduce((max, row) => Math.max(max, row.sales), 0),
    [countrySales]
  );

  const totalSales = useMemo(
    () => countrySales.reduce((sum, row) => sum + row.sales, 0),
    [countrySales]
  );

  const topCountries = useMemo(
    () => [...countrySales].sort((a, b) => b.sales - a.sales).slice(0, 5),
    [countrySales]
  );

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }),
    []
  );

  const formatFullNumber = useMemo(() => {
    const currency = meta.currency && meta.currency.length === 3 ? meta.currency : undefined;
    return new Intl.NumberFormat("en-US", {
      style: currency ? "currency" : "decimal",
      currency,
      maximumFractionDigits: 0,
    }).format;
  }, [meta.currency]);

  const colorForValue = (value) => (!value || maxSales === 0 ? ZERO_SALES_FILL : interpolateColor(value / maxSales));

  if (loading && countrySales.length === 0) {
    return (
      <div className="geo-page">
        <h2 className="geo-title">Sales by Country</h2>
        <p className="geo-subtitle">Loading geo KPI data...</p>
      </div>
    );
  }

  return (
    <div className="geo-page">
      <div className="geo-header">
        <div>
          <h2 className="geo-title">Sales by Country</h2>
          <p className="geo-subtitle">
            Monitor geographic performance and spot high-revenue markets at a glance.
            {meta.updatedAt ? ` Last updated: ${new Date(meta.updatedAt).toLocaleString()}` : ""}
          </p>
        </div>
        <div className="geo-summary">
          <div className="geo-summary-card">
            <span className="geo-summary-label">Countries Tracked</span>
            <span className="geo-summary-value">{countrySales.length}</span>
          </div>
          <div className="geo-summary-card">
            <span className="geo-summary-label">Total Sales</span>
            <span className="geo-summary-value">
              {totalSales ? formatFullNumber(totalSales) : "–"}
            </span>
          </div>
        </div>
      </div>

      {error && <div className="geo-warning">{error}</div>}

      <div className="geo-content">
        <div className="geo-map-card">
          <div className="geo-map-container">
            <ComposableMap projectionConfig={{ scale: 160 }} data-tip="">
              <ZoomableGroup
                center={viewport.center}
                zoom={viewport.zoom}
                minZoom={ZOOM_MIN}
                maxZoom={ZOOM_MAX}
                onMoveEnd={({ coordinates, zoom }) =>
                  setViewport({ center: coordinates, zoom: Number(zoom.toFixed(2)) })
                }
              >
                <Geographies geography={WORLD_GEOJSON_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const { NAME, name, ISO_A3, ISO_A2 } = geo.properties;
                      const countryName = NAME ?? name ?? "";
                      const countryCode = ISO_A3 && ISO_A3 !== "-99" ? ISO_A3 : ISO_A2;
                      const normalizedName = normalizeName(countryName);
                      const value =
                        salesByCountry.get((ISO_A3 || "").toUpperCase()) ??
                        salesByCountry.get((ISO_A2 || "").toUpperCase()) ??
                        salesByCountry.get(normalizedName);
                      const orders =
                        ordersByCountry.get((ISO_A3 || "").toUpperCase()) ??
                        ordersByCountry.get((ISO_A2 || "").toUpperCase()) ??
                        ordersByCountry.get(normalizedName) ??
                        0;
                      const fill = colorForValue(value);
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fill}
                          onMouseEnter={() =>
                            setHovered({
                              code: countryCode || "",
                              name: countryName,
                              value: value || 0,
                              orders,
                            })
                          }
                          onMouseLeave={() => setHovered(null)}
                          stroke="#ffffff"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: { outline: "none", fill: "#1DA15E" },
                            pressed: { outline: "none", fill: "#0E7A3E" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </div>
          <div className="geo-legend">
            <span>Low</span>
            <div className="geo-legend-gradient" />
            <span>High</span>
          </div>
          {hovered && (
            <div className="geo-hover-card">
              <span className="geo-hover-title">{hovered.name}</span>
              <span className="geo-hover-value">
                {hovered.value ? formatFullNumber(hovered.value) : "No data"}
              </span>
              <span className="geo-hover-subtext">Orders: {hovered.orders ?? 0}</span>
              <span className="geo-hover-subtext">
                Avg order:{" "}
                {hovered.orders && hovered.orders > 0
                  ? formatFullNumber(hovered.value / hovered.orders)
                  : "–"}
              </span>
            </div>
          )}
        </div>

        <aside className="geo-side-panel">
          <h3>Top Performing Countries</h3>
          <ol>
            {topCountries.map((country, index) => (
              <li key={`${country.countryCode}-${index}`}>
                <div>
                  <span className="geo-country-name">
                    {country.countryName || country.countryCode}
                  </span>
                  <span className="geo-country-sales">
                    {numberFormatter.format(country.sales)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
          <p className="geo-side-note">
            Rankings use total sales volume. Hover over the map to inspect individual markets.
          </p>
        </aside>
      </div>
    </div>
  );
}
