import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { FavoritesContext } from "../context/FavoritesContext";

export function Navbar() {
  const { favorites } = useContext(FavoritesContext);
  const links = [
    { label: "Home", path: "/", icon: "🏠" },
    { label: "Favorites", path: "/favorites", icon: "❤️", badge: favorites.length },
    { label: "About", path: "/about", icon: "ℹ️" },
  ];

  return (
    <nav className="navbar">
      <NavLink className="nav-brand" to="/" style={{ textDecoration: 'none' }}>
        <span className="brand-cine">CINE</span>
        <span className="brand-vault">VAULT</span>
      </NavLink>
      <div className="nav-links">
        {links.map(l => (
          <NavLink
            key={l.path}
            to={l.path}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            style={{ textDecoration: 'none' }}
          >
            <span className="nav-fav-badge">
              {l.label}
              {l.badge > 0 && <span className="badge">{l.badge}</span>}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
