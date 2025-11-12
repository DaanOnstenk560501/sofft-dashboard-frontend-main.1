import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { RANGE_OPTIONS, resolveDateRange, formatDate } from "../utils/dateRanges";
import { getDashboardData, getAllDashboardData } from "../apis/dashboard";

export default function Overview() {
  const [selectedRange, setSelectedRange] = useState("6m");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentRange, setCurrentRange] = useState({ start: "", end: "" });
  const EURO_SYMBOL = "\u20AC";

  const formatNumber = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return value ?? "-";
    return numeric.toLocaleString("de-DE");
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);

      // --- Resolve the selected date range ---
      const { start, end } = resolveDateRange(selectedRange, "6m");
      const startDateParam = formatDate(start);
      const endDateParam = formatDate(end);
      setCurrentRange({ start: startDateParam, end: endDateParam });

      try {
        // --- Try fetching filtered data first ---
        let data = await getDashboardData({
          startDate: startDateParam,
          endDate: endDateParam,
        });

        // --- Fallback if no filtered data returned ---
        if (!data || Object.keys(data).length === 0) {
          console.warn("Filtered data empty — fetching all dashboard data instead.");
          data = await getAllDashboardData();
        }

        setDashboardData(data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.message || "Unknown error occurred.");
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [selectedRange]);

  // --- Conditional rendering for different UI states ---
  if (loading) return <p>Loading KPIs...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!dashboardData) return <p>No KPI data found.</p>;

  // --- Extract and format key stats ---
  const stats = [
    { title: "Total Offers Created", value: formatNumber(dashboardData.totalOffers), icon: Icons.FileText },
    { title: "Total Orders", value: formatNumber(dashboardData.totalOrders), icon: Icons.ShoppingCart },
    { title: "Offer - Order Conversion Rate", value: `${formatNumber(dashboardData.conversionRate)}%`, icon: Icons.Percent },
    { title: `Pipeline Value (${EURO_SYMBOL} excl. VAT)`, value: `${EURO_SYMBOL}${formatNumber(dashboardData.pipelineValue)}`, icon: Icons.Briefcase },
    { title: "Revenue (Booked Orders)", value: `${EURO_SYMBOL}${formatNumber(dashboardData.revenue)}`, icon: Icons.DollarSign },
    { title: "Average Lead Time", value: `${formatNumber(dashboardData.avgLeadTimeDays)} days`, icon: Icons.Clock },
  ];

  // --- Top lists and chart data ---
  const topSalesmen = (dashboardData.topSalesmen ?? []).map((s) => s.salesmanName);
  const topCountries = (dashboardData.topCountries ?? []).map((c) => c.countryCode);
  const salesData = (dashboardData.salesData ?? []).map((point) => ({
    date: point.date,
    revenue: Number(point.revenue ?? 0),
  }));

  return (
    <div className="overview-container">
      {/* --- FILTER CARD --- */}
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

      {/* --- KPI CARDS --- */}
      <div className="overview-grid overview-grid-top">
        {stats.map(({ title, value, icon: Icon }) => (
          <div key={title} className="overview-card">
            <div className="card-icon"><Icon size={28} /></div>
            <div className="card-content">
              <p className="card-value">{value}</p>
              <p className="card-title">{title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --- REVENUE CHART --- */}
      <div className="overview-line-chart">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#1DA15E" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* --- TOP LISTS --- */}
      <div className="overview-bottom">
        <div className="overview-list-card">
          <h3 className="overview-list-title">Top 5 Salesmen</h3>
          <ol className="overview-list">
            {topSalesmen.map((name, i) => (
              <li key={i} className="overview-list-item">
                <span className="rank-number">{i + 1}</span>
                <span className="rank-name">{name}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="overview-list-card">
          <h3 className="overview-list-title">Top 5 Countries</h3>
          <ol className="overview-list">
            {topCountries.map((c, i) => (
              <li key={i} className="overview-list-item">
                <span className="rank-number">{i + 1}</span>
                <span className="rank-name">{c}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
