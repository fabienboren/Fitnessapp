import { NavLink, Outlet } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/Button";
import { AccountMenu } from "./AccountMenu";
import { Logo } from "./Logo";
import { navItems } from "./navItems";
import "./layout.css";

/**
 * Authenticated layout.
 * ≥1024px: fixed sidebar + top bar. <1024px: top bar + bottom tab bar.
 */
export function AppShell() {
  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <aside className="sidebar" aria-label="Primary">
        <div className="sidebar__brand">
          <Logo to="/app" />
        </div>
        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="sidebar__link">
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__footer">
          <NavLink to="/app/settings" className="sidebar__link">
            <Icon name="settings" />
            Settings
          </NavLink>
        </div>
      </aside>

      <div className="shell__main">
        <header className="topbar">
          <div className="topbar__brand">
            <Logo to="/app" />
          </div>
          <div className="topbar__actions">
            <IconButton icon="bell" label="Notifications" />
            <AccountMenu />
          </div>
        </header>

        <main id="main" className="content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      <nav className="tabbar" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="tabbar__link">
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
