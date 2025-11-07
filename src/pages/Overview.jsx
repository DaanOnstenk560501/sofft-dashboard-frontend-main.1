import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { RANGE_OPTIONS, resolveDateRange, formatDate } from "../utils/dateRanges";

export default function Overview() {
  const [selectedRange, setSelectedRange] = useState("6m");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRange, setCurrentRange] = useState({ start: "", end: "" });
  const EURO_SYMBOL = "\u20AC";

  const formatNumber = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return value ?? "-";
    return numeric.toLocaleString("de-DE");
  };

  // Fetch dashboard KPIs from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const { start, end } = resolveDateRange(selectedRange, "6m");
      const startDateParam = formatDate(start);
      const endDateParam = formatDate(end);

      setCurrentRange({ start: startDateParam, end: endDateParam });

      try {
        const query = new URLSearchParams({
          startDate: startDateParam,
          endDate: endDateParam,
        });
        const response = await fetch(`http://localhost:8080/api/dashboard?${query.toString()}`);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedRange]);

  if (loading) return <p>Loading KPIs...</p>;
  if (!dashboardData) return <p>No KPI data found.</p>;

  const stats = [
    { title: "Total Offers Created", value: formatNumber(dashboardData.totalOffers), icon: Icons.FileText },
    { title: "Total Orders", value: formatNumber(dashboardData.totalOrders), icon: Icons.ShoppingCart },
    { title: "Offer - Order Conversion Rate", value: `${formatNumber(dashboardData.conversionRate)}%`, icon: Icons.Percent },
    { title: `Pipeline Value (${EURO_SYMBOL} excl. VAT)`, value: `${EURO_SYMBOL}${formatNumber(dashboardData.pipelineValue)}`, icon: Icons.Briefcase },
    { title: "Revenue (Booked Orders)", value: `${EURO_SYMBOL}${formatNumber(dashboardData.revenue)}`, icon: Icons.DollarSign },
    { title: "Average Lead Time", value: `${formatNumber(dashboardData.avgLeadTimeDays)} days`, icon: Icons.Clock },
  ];
  const topSalesmen = (dashboardData.topSalesmen || []).map((s) => s.salesmanName);
  const topCountries = (dashboardData.topCountries || []).map((c) => c.countryCode);
  const salesData = (dashboardData.salesData || []).map((point) => ({
    date: point.date,
    revenue: Number(point.revenue ?? 0),
  }));
  const revenueChartMargin = { top: 20, right: 30, bottom: 0, left: 48 };
  const formatChartValue = (value) => formatNumber(value);

  return (
    <div className="overview-container">
      <section className="overview-filter-card">
        <div className="overview-filter-header">
          <div className="overview-filter-icon">
            <Icons.SlidersHorizontal size={18} />
          </div>
          <div>
            <h2>Filtering Options</h2>
            <p>Refine the dashboard timeframe to refresh the KPIs.</p>
          </div>
        </div>

        <div className="overview-filters">
          <span className="overview-filter-label">Time Range</span>
          <div className="time-range-chip-group">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelectedRange(option.key)}
                className={`time-range-chip${selectedRange === option.key ? " active" : ""}`}
                aria-pressed={selectedRange === option.key}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <p className="current-range-caption">
          Viewing data from <strong>{currentRange.start}</strong> to <strong>{currentRange.end}</strong>.
        </p>
      </section>

      <div className="overview-grid overview-grid-top">
        {stats.slice(0, 4).map(({ title, value, icon: Icon }) => (
          <div key={title} className="overview-card">
            <div className="card-icon"><Icon size={28} /></div>
            <div className="card-content">
              <p className="card-value">{value}</p>
              <p className="card-title">{title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="overview-bottom-layout" style={{ marginTop: "20px", gap: "20px" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="overview-grid overview-grid-bottom">
            {stats.slice(4).map(({ title, value, icon: Icon }) => (
              <div key={title} className="overview-card">
                <div className="card-icon"><Icon size={28} /></div>
                <div className="card-content">
                  <p className="card-value">{value}</p>
                  <p className="card-title">{title}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="overview-line-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={revenueChartMargin}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={formatChartValue} />
                <Tooltip
                  wrapperStyle={{ zIndex: 10 }}
                  contentStyle={{ borderRadius: 8, borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}
                  formatter={(value, name) => [formatChartValue(value), name]}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#1DA15E" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="overview-right-column" style={{ width: "250px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="top-sellers">
            <h3>Top 5 Salesmen</h3>
            <ol>
              {topSalesmen.map((name, idx) => (
                <li key={idx}>{name}</li>
              ))}
            </ol>
          </div>

          <div className="top-countries">
            <h3>Top 5 Countries</h3>
            <ol>
              {topCountries.map((country, idx) => (
                <li key={idx}>{country}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
