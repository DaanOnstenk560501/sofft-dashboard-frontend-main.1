import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Overview from "./pages/Overview";
import Orders from "./pages/Orders";
import Offers from "./pages/Offers";
import Geo from "./pages/Geo";
import ProductInsights from "./pages/ProductInsights";
import AlertsAnomalies from "./pages/Alerts&Anomalies";
import Admin from "./pages/Admin";
import "./App.css";

export default function App() {
  const [active, setActive] = useState("OVERVIEW");

  return (
    <div className="app-container">
      <Sidebar active={active} setActive={setActive} />
      <main className="main-content">
        {active === "OVERVIEW" && <Overview />}
        {active === "OFFERS" && <Offers />}
        {active === "ORDERS" && <Orders />}
        {active === "GEO" && <Geo />}
        {active === "PRODUCT INSIGHTS" && <ProductInsights />}
        {active === "ALERTS & INSIGHTS" && <AlertsAnomalies />}
        {active === "ADMIN" && <Admin />}
      </main>
    </div>
  );
}
