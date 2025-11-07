import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { RANGE_OPTIONS, resolveDateRange, formatDate } from "../utils/dateRanges";

export default function Offers() {
  const [offersBySalesman, setOffersBySalesman] = useState([]);
  const [offersByCountry, setOffersByCountry] = useState([]);
  const [offerStatusDistribution, setOfferStatusDistribution] = useState([]);
  const [avgOfferValue, setAvgOfferValue] = useState(0);
  const [totalDiscounts, setTotalDiscounts] = useState(0);
  const [totalOffers, setTotalOffers] = useState(0);
  const [selectedSalesman, setSelectedSalesman] = useState(null);
  const [selectedRange, setSelectedRange] = useState("6m");
  const [currentRange, setCurrentRange] = useState({ start: "", end: "" });
  const [salesmanCountries, setSalesmanCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const COLORS = ["#1DA15E", "#4ADE80", "#FACC15", "#F87171"];
  const EURO_SYMBOL = "\u20AC";

  // Fetch salesman list once for the dropdown
  useEffect(() => {
    async function fetchSalesmenList() {
      try {
        const response = await fetch("http://localhost:8080/api/offers/per-salesman");
        if (!response.ok) {
          throw new Error(`Salesman request failed with status ${response.status}`);
        }
        const data = await response.json();
        const mapped = data.map((s) => ({
          id: s.salesmanId,
          name: s.salesmanName || "Unknown",
          offers: s.offersCount || 0,
          totalValue: s.totalValue || 0,
        }));
        setOffersBySalesman(mapped);
      } catch (err) {
        console.error("Error fetching salesmen:", err);
      }
    }

    fetchSalesmenList();
  }, []);

  // Fetch KPIs and charts when filters change
  useEffect(() => {
    fetchFilteredData();
  }, [selectedSalesman, selectedRange]);

  async function fetchFilteredData() {
    try {
      setLoading(true);
      setError(null);

      const { start, end } = resolveDateRange(selectedRange, "6m");
      const startDateParam = formatDate(start);
      const endDateParam = formatDate(end);
      setCurrentRange({ start: startDateParam, end: endDateParam });

      const queryParams = new URLSearchParams({
        startDate: startDateParam,
        endDate: endDateParam,
      });
      if (selectedSalesman) {
        queryParams.append("dealerId", selectedSalesman.id);
      }
      const queryString = `?${queryParams.toString()}`;

      const urls = [
        `http://localhost:8080/api/offers/per-country${queryString}`,
        `http://localhost:8080/api/offers/status-distribution${queryString}`,
        `http://localhost:8080/api/offers/average-value${queryString}`,
        `http://localhost:8080/api/offers/discounts-given${queryString}`,
      ];

      const responses = await Promise.all(urls.map((url) => fetch(url)));
      responses.forEach((res, idx) => {
        if (!res.ok) {
          throw new Error(`Request ${urls[idx]} failed with status ${res.status}`);
        }
      });

      const [countryData, statusData, avgData, discountData] = await Promise.all(
        responses.map((res) => res.json())
      );

      setOffersByCountry(
        (countryData || []).map((c) => ({
          country: c.countryCode || "N/A",
          offers: c.offersCount || 0,
          totalValue: c.totalValue || 0,
        }))
      );

      setOfferStatusDistribution(
        (statusData || []).map((s) => ({
          status: s.status || "Unknown",
          count: s.count || 0,
        }))
      );

      setAvgOfferValue(
        avgData.averageValue ||
          avgData.averageAmount ||
          avgData.amount ||
          0
      );

      setTotalDiscounts(
        discountData.totalDiscount ||
          discountData.total ||
          discountData.amount ||
          0
      );

      const totalOffersForRange =
        (statusData || []).reduce((sum, s) => sum + (s.count || 0), 0) || 0;
      setTotalOffers(totalOffersForRange);

      if (selectedSalesman) {
        setSalesmanCountries(
          (countryData || []).map((c) => ({
            country: c.countryCode || "N/A",
            offers: c.offersCount || 0,
          }))
        );
      } else {
        setSalesmanCountries([]);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching filtered data:", err);
      setError(err.message || "Failed to load offers data.");
      setLoading(false);
    }
  }

  if (loading) return <p>Loading offers data...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  const stats = [
    {
      title: "Average Offer Value (\u20AC excl. VAT)",
      value: `${EURO_SYMBOL}${avgOfferValue.toLocaleString()}`,
      icon: Icons.DollarSign,
    },
    {
      title: "Discounts Given (\u20AC)",
      value: `${EURO_SYMBOL}${totalDiscounts.toLocaleString()}`,
      icon: Icons.Percent,
    },
    {
      title: "Total Offers",
      value: totalOffers,
      icon: Icons.FileText,
    },
  ];

  return (
    <div className="offers-container">
      <h2 className="offers-title">Offers Dashboard</h2>

      {/* Salesman & Time Filters */}
      <section className="overview-filter-card offers-filter-card">
        <div className="overview-filter-header">
          <div className="overview-filter-icon">
            <Icons.SlidersHorizontal size={18} />
          </div>
          <div>
            <h3>Filter Options</h3>
            <p>Choose salesman and timeframe to refresh the offers data.</p>
          </div>
        </div>

        <div className="overview-filters">
          <label className="overview-filter-label" htmlFor="salesmanSelect">
            Salesman
          </label>
          <select
            id="salesmanSelect"
            className="salesman-dropdown small"
            value={selectedSalesman?.id || ""}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) {
                setSelectedSalesman(null);
                return;
              }
              const selected = offersBySalesman.find(
                (s) => s.id === parseInt(value, 10)
              );
              setSelectedSalesman(selected || null);
            }}
          >
            <option value="">All Salesmen</option>
            {offersBySalesman.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
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
          Viewing data from <strong>{currentRange.start || "N/A"}</strong> to <strong>{currentRange.end || "N/A"}</strong>.
        </p>
      </section>

      {/* KPI Cards */}
      <div className="overview-grid-top kpi-three">
        {stats.map(({ title, value, icon: Icon }) => (
          <div key={title} className="overview-card">
            <div className="card-icon">
              <Icon size={26} />
            </div>
            <div className="card-content">
              <p className="card-value">{value}</p>
              <p className="card-title">{title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Offers per Country or Salesman */}
      {!selectedSalesman ? (
        <div className="offers-chart-card">
          <h3>Offers per Country</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={offersByCountry}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="offers" fill="#4ADE80" barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="salesman-details">
          <h3>
            {selectedSalesman.name} - {totalOffers} Offers
          </h3>
          <div className="salesman-chart-card">
            <h4>Offers by Country</h4>
            {salesmanCountries.length > 0 ? (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesmanCountries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="offers" fill="#1DA15E" barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={{ color: "#6b7280" }}>No country data available.</p>
            )}
          </div>
        </div>
      )}

      {/* Offer Status Distribution */}
      <div className="offers-status-card">
        <h3>
          Offer Status Distribution
          {selectedSalesman ? ` - ${selectedSalesman.name}` : ""}
        </h3>
        <div className="offers-pie-container chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={offerStatusDistribution}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {offerStatusDistribution.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="status-legend">
          {offerStatusDistribution.map((status, index) => (
            <div key={index} className="status-legend-item">
              <span
                className="status-color"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></span>
              <span className="status-label">{status.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
