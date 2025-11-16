import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  FaHome, FaUsers, FaTools, FaCalendarAlt,
  FaExclamationTriangle, FaSignOutAlt, FaCheck,
  FaFacebookMessenger, FaAngleLeft, FaAngleRight
} from "react-icons/fa";
import "./Sidebar.css";
import logoImg from '../fixitnow.png';


export default function Sidebar({
  activeTab,   onActivate,  menu,  showLogoOnCollapsed = true,
  collapsed: collapsedProp,  onToggle,  handleLogout,  persistKey = "sidebarCollapsed",
}) {
  // default admin menu 
  const defaultMenu = [
    { key: "home", label: "Home", icon: <FaHome /> },
    { key: "users", label: "Customers", icon: <FaUsers /> },
    { key: "services", label: "Providers", icon: <FaTools /> },
    { key: "verification", label: "Verification", icon: <FaCheck /> },
    { key: "bookings", label: "Bookings", icon: <FaCalendarAlt /> },
    { key: "complaints", label: "Complaints", icon: <FaExclamationTriangle /> },
    { key: "chat", label: "Messages", icon: <FaFacebookMessenger /> },
  ];

  const items = Array.isArray(menu) && menu.length ? menu : defaultMenu;

  const isControlled = typeof collapsedProp === "boolean";
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    if (isControlled) return !!collapsedProp;
    try {
      return localStorage.getItem(persistKey) === "true";
    } catch {
      return false;
    }
  });
    

  useEffect(() => {
    if (isControlled) return setInternalCollapsed(!!collapsedProp);
  }, [collapsedProp, isControlled]);

  useEffect(() => {
    if (isControlled) return;
    try {
      localStorage.setItem(persistKey, String(internalCollapsed));
    } catch {}
    if (internalCollapsed) document.body.classList.add("sidebar-collapsed");
    else document.body.classList.remove("sidebar-collapsed");
  }, [internalCollapsed, isControlled, persistKey]);

  const toggle = () => {
    const next = !internalCollapsed;
    if (isControlled) {
      if (typeof onToggle === "function") onToggle(next);
    } else {
      setInternalCollapsed(next);
      if (typeof onToggle === "function") onToggle(next);
    }
  };

  const collapsed = isControlled ? !!collapsedProp : internalCollapsed;

  const activate = (item) => {
    if (item && typeof item.onClick === "function") {
      item.onClick(item);
      return;
    }
    if (item && item.href) {
      window.location.href = item.href;
      return;
    }
    if (typeof onActivate === "function" && item && item.key) {
      onActivate(item.key);
      return;
    }
    };
    
    useEffect(() => {
        // Keep a CSS class on <body> so global layout (main) can respond
        try {
            if (collapsed) {
            document.body.classList.add('sidebar-collapsed');
            } else {
            document.body.classList.remove('sidebar-collapsed');
            }
        } catch (err) {
            // ignore (server-side rendering or restricted environment)
        }

        // cleanup on unmount: ensure class removed to avoid leaking state
        return () => {
            try {
            document.body.classList.remove('sidebar-collapsed');
            } catch (_) {}
        };
        }, [collapsed]);

  return (
    <div className={`sidebar-container ${collapsed ? "collapsed" : ""}`}>
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`} aria-expanded={!collapsed}>
        <div className="sidebar-top-inner">
          {!collapsed && (
            <div className="sidebar-brand-expanded" title="FixItNow">
              <span className="sidebar-brand-text">FixItNow</span>
            </div>
          )}

          {collapsed && showLogoOnCollapsed &&  (
            <div className="sidebar-brand-collapsed" title="FixItNow">
              <img src={logoImg} alt="FixItNow" className="sidebar-logo" />
            </div>
          )}
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <ul>
            {items
              .filter(it => it.visible !== false) 
              .map(item => (
                <li
                  key={item.key || item.label}
                  role="button"
                  tabIndex={0}
                  className={activeTab === item.key ? "active" : ""}
                  onClick={() => activate(item)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") activate(item); }}
                  title={item.label}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {!collapsed && <span className="sidebar-label">{item.label}</span>}
                </li>
              ))}
          </ul>
        </nav>

        <div className="sidebar-bottom">
          <button className="sidebar-logout" onClick={() => { if (handleLogout) handleLogout(); }} title="Logout">
            <span className="sidebar-icon"><FaSignOutAlt /></span>
            {!collapsed && <span className="sidebar-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* outside toggle button */}
      <button
        className={`sidebar-toggle-outside ${collapsed ? "collapsed" : ""}`}
        onClick={toggle}
        title={collapsed ? "Expand" : "Collapse"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <FaAngleRight /> : <FaAngleLeft />}
      </button>
    </div>
  );
}

Sidebar.propTypes = {
  activeTab: PropTypes.string,
  onActivate: PropTypes.func,
  menu: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    label: PropTypes.string,
    icon: PropTypes.node,
    onClick: PropTypes.func,
    href: PropTypes.string,
    visible: PropTypes.bool,
  })),
  showLogoOnCollapsed: PropTypes.bool,
  collapsed: PropTypes.bool,
  onToggle: PropTypes.func,
  handleLogout: PropTypes.func,
  persistKey: PropTypes.string,
};