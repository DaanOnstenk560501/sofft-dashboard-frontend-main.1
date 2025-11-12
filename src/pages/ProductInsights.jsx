import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import {
  getTotalUpsellValue,
  getAverageUpsellValue,
  getDiscountedUpsells,
  getTopUpsellCategories,
  getTopUpsellItems,
} from "../apis/productinsights";

const EURO_SYMBOL = "\u20AC";

// --- Utility Formatters ---
const formatNumber = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value ?? "-";
  return numeric.toLocaleString();
};

const formatEuro = (value) => `${EURO_SYMBOL}${formatNumber(value)}`;

const formatPercentage = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "-";
  return numeric.toFixed(2);
};

// --- Label Wrapping Helpers ---
const wrapLabelIntoLines = (value, maxCharsPerLine) => {
  const text = String(value ?? "").trim();
  if (!text) return [""];

  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const tentative = currentLine ? `${currentLine} ${word}` : word;
    if (tentative.length <= maxCharsPerLine) {
      currentLine = tentative;
    } else {
      if (currentLine) lines.push(currentLine);
      if (word.length <= maxCharsPerLine) {
        currentLine = word;
      } else {
        const chunkRegex = new RegExp(`.{1,${maxCharsPerLine}}`, "g");
        const chunks = word.match(chunkRegex) ?? [word];
        if (chunks.length > 1) lines.push(...chunks.slice(0, -1));
        currentLine = chunks[chunks.length - 1] ?? "";
      }
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : [text];
};

const createWrappedTickRenderer = (maxCharsPerLine = 12, maxLines = 3) => ({
  x,
  y,
  payload,
}) => {
  const rawValue = payload?.value ?? "";
  const lines = wrapLabelIntoLines(rawValue, maxCharsPerLine);
  const limitedLines = lines.slice(0, maxLines);

  if (lines.length > maxLines) {
    limitedLines[maxLines - 1] = `${limitedLines[maxLines - 1]}...`;
  }

  return (
    <g transform={`translate(${x},${y + 10})`}>
      <text fill="#374151" fontSize={12} textAnchor="middle">
        {limitedLines.map((line, index) => (
          <tspan key={`${rawValue}-${index}`} x="0" dy={index === 0 ? 0 : 14}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

export default function ProductInsights() {
  const [totalUpsellValue, setTotalUpsellValue] = useState(0);
  const [averageUpsellValue, setAverageUpsellValue] = useState(0);
  const [discountedUpsells, setDiscountedUpsells] = useState({});

  const [categoryMode, setCategoryMode] = useState("count");
  const [topUpsellCategories, setTopUpsellCategories] = useState([]);

  const [itemMode, setItemMode] = useState("count");
  const [topUpsellItems, setTopUpsellItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const categoryTick = useMemo(() => createWrappedTickRenderer(), []);
  const itemTick = useMemo(() => createWrappedTickRenderer(), []);

  // --- Load KPI Data ---
  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        const [total, avg, discounts] = await Promise.all([
          getTotalUpsellValue(),
          getAverageUpsellValue(),
          getDiscountedUpsells(),
        ]);
        setTotalUpsellValue(total ?? 0);
        setAverageUpsellValue(avg ?? 0);
        setDiscountedUpsells(discounts ?? {});
      } catch (err) {
        console.error("Error loading KPI data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchKPIData();
  }, []);

  // --- Load Categories ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getTopUpsellCategories(categoryMode);
        setTopUpsellCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading category data:", err);
        setTopUpsellCategories([]);
      }
    };
    fetchCategories();
  }, [categoryMode]);

  // --- Load Items ---
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await getTopUpsellItems(itemMode);
        setTopUpsellItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading item data:", err);
        setTopUpsellItems([]);
      }
    };
    fetchItems();
  }, [itemMode]);

  if (loading) {
    return (
      <div className="product-insights-loading">
        <div className="loader"></div>
        <p>Loading Product Insights...</p>
      </div>
    );
  }

  return (
    <div className="product-insights-container">
      <h1 className="product-insights-title">Product Insights</h1>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Total Upsell Value ({EURO_SYMBOL})</h3>
          <p className="kpi-value">{formatEuro(totalUpsellValue)}</p>
        </div>
        <div className="kpi-card">
          <h3>Average Upsell Value</h3>
          <p className="kpi-value">{formatEuro(averageUpsellValue)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Categories */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Top Upsell Categories</h3>
            <select
              value={categoryMode}
              onChange={(e) => setCategoryMode(e.target.value)}
              className="category-filter"
            >
              <option value="count">By Count</option>
              <option value="value">By Value ({EURO_SYMBOL})</option>
            </select>
          </div>

          {topUpsellCategories.length > 0 ? (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topUpsellCategories.map((item) => ({
                    name: item.category,
                    value:
                      categoryMode === "count"
                        ? item.count
                        : item.totalValue,
                  }))}
                  margin={{ top: 40, right: 20, left: 0, bottom: 80 }}
                >
                  <XAxis
                    dataKey="name"
                    interval={0}
                    tick={categoryTick}
                    tickMargin={18}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={(value) =>
                      categoryMode === "count"
                        ? [formatNumber(value), "Upsell Count"]
                        : [formatEuro(value), `Total Value (${EURO_SYMBOL})`]
                    }
                  />
                  <Bar
                    dataKey="value"
                    fill="#1DA15E"
                    barSize={20}
                    name={
                      categoryMode === "count"
                        ? "Upsell Count"
                        : `Upsell Value (${EURO_SYMBOL})`
                    }
                  >
                    <LabelList
                      dataKey="value"
                      position="top"
                      fill="#111827"
                      fontSize={12}
                      fontWeight={600}
                      formatter={(value) =>
                        categoryMode === "count"
                          ? formatNumber(value)
                          : formatEuro(value)
                      }
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p>No category data available.</p>
          )}
        </div>

        {/* Items */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Top Upsell Items</h3>
            <select
              value={itemMode}
              onChange={(e) => setItemMode(e.target.value)}
              className="category-filter"
            >
              <option value="count">By Count</option>
              <option value="value">By Value ({EURO_SYMBOL})</option>
            </select>
          </div>

          {topUpsellItems.length > 0 ? (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topUpsellItems.map((item) => ({
                    name: item.item,
                    value:
                      itemMode === "count"
                        ? item.count
                        : item.totalValue,
                  }))}
                  margin={{ top: 40, right: 20, left: 0, bottom: 80 }}
                >
                  <XAxis
                    dataKey="name"
                    interval={0}
                    tick={itemTick}
                    tickMargin={18}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={(value) =>
                      itemMode === "count"
                        ? [formatNumber(value), "Upsell Count"]
                        : [formatEuro(value), `Total Value (${EURO_SYMBOL})`]
                    }
                  />
                  <Bar
                    dataKey="value"
                    fill="#1DA15E"
                    barSize={20}
                    name={
                      itemMode === "count"
                        ? "Upsell Count"
                        : `Upsell Value (${EURO_SYMBOL})`
                    }
                  >
                    <LabelList
                      dataKey="value"
                      position="top"
                      fill="#111827"
                      fontSize={12}
                      fontWeight={600}
                      formatter={(value) =>
                        itemMode === "count"
                          ? formatNumber(value)
                          : formatEuro(value)
                      }
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p>No item data available.</p>
          )}
        </div>
      </div>

      {/* Discounted Upsells */}
      <div className="discounted-upsells-card">
        <h3>Discounted Upsells</h3>
        {discountedUpsells && Object.keys(discountedUpsells).length > 0 ? (
          <div className="discounted-info">
            <p>
              <strong>Discounted Count:</strong>{" "}
              {formatNumber(discountedUpsells.discountedCount ?? 0)}
            </p>
            <p>
              <strong>Average Discount:</strong>{" "}
              {formatPercentage(
                discountedUpsells.averageDiscountPercent
              )}
              %
            </p>
          </div>
        ) : (
          <p>No discounted upsells found.</p>
        )}
      </div>
    </div>
  );
}
