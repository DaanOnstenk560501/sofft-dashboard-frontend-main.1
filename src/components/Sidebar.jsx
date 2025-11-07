import * as Icons from 'lucide-react';

const menuItems = [
  { name: "OVERVIEW", icon: Icons.Home },
  { name: "OFFERS", icon: Icons.Tag },
  { name: "ORDERS", icon: Icons.ShoppingCart },
  { name: "GEO", icon: Icons.Globe },
  { name: "PRODUCT INSIGHTS", icon: Icons.BarChart2 },
  { name: "ALERTS & INSIGHTS", icon: Icons.AlertTriangle },
  { name: "ADMIN", icon: Icons.Shield },
];

export default function Sidebar({ active, setActive }) {
  return (
    <aside className="sidebar">
      <img
        src="https://www.basworld.com/resources/icons/logos/logo-desktop.svg"
        alt="Logo"
        className="sidebar-logo"
      />

      <h1>Dashboard</h1>
      <nav>
        {menuItems.map(({ name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => setActive(name)}
            className={active === name ? "active" : ""}
          >
            <Icon size={20} />
            <span>{name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
