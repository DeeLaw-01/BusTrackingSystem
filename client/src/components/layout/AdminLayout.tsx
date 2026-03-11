import { Outlet, Link, useLocation } from "react-router-dom";
import "../../pages/admin/admin.css";
import {
  Bus,
  LayoutDashboard,
  Users,
  Route as RouteIcon,
  LogOut,
  Menu,
  X,
  Mail,
  Bell,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import type { LucideIcon } from "lucide-react";

const NAV_WORKSPACE = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/invitations", icon: Mail, label: "Invitations" },
];

const NAV_OPS = [
  { to: "/admin/routes", icon: RouteIcon, label: "Routes" },
  { to: "/admin/buses", icon: Bus, label: "Fleet" },
];

const ALL_NAV = [...NAV_WORKSPACE, ...NAV_OPS];

function SideNavLink({
  to,
  icon: Icon,
  label,
  active,
  hoveredLink,
  setHoveredLink,
  onClick,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  hoveredLink: string | null;
  setHoveredLink: (v: string | null) => void;
  onClick: () => void;
}) {
  const hovered = hoveredLink === to && !active;
  return (
    <Link
      to={to}
      onClick={onClick}
      onMouseEnter={() => setHoveredLink(to)}
      onMouseLeave={() => setHoveredLink(null)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        borderRadius: 9,
        textDecoration: "none",
        transition: "background .12s, color .12s",
        background: active ? "#eef2ff" : hovered ? "#f8fafc" : "transparent",
        color: active ? "#4f46e5" : hovered ? "#334155" : "#64748b",
        fontWeight: active ? 600 : 400,
        fontSize: 13.5,
        borderLeft: active ? "2.5px solid #6366f1" : "2.5px solid transparent",
      }}
    >
      <Icon
        size={16}
        style={{
          flexShrink: 0,
          color: active ? "#6366f1" : "inherit",
          transition: "color .12s",
        }}
      />
      {label}
    </Link>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [logoutHover, setLogoutHover] = useState(false);

  const isActive = (to: string) =>
    to === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(to);

  const pageLabel = ALL_NAV.find((n) => isActive(n.to))?.label ?? "Admin";
  const initial = user?.name?.charAt(0).toUpperCase() ?? "A";

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#f0f2f7",
      }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{
          width: 248,
          background: "#ffffff",
          borderRight: "1px solid #e8edf2",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 16px",
            height: 64,
            borderBottom: "1px solid #f0f2f7",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              flexShrink: 0,
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(99,102,241,0.5)",
            }}
          >
            <Bus size={19} color="#fff" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              Safara
            </div>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                color: "#94a3b8",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Admin Console
            </div>
          </div>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#475569",
              padding: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "22px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {/* Workspace */}
          <div>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "#94a3b8",
                textTransform: "uppercase",
                padding: "0 12px",
                marginBottom: 6,
              }}
            >
              Workspace
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {NAV_WORKSPACE.map(({ to, icon: Icon, label }) => (
                <SideNavLink
                  key={to}
                  to={to}
                  icon={Icon}
                  label={label}
                  active={isActive(to)}
                  hoveredLink={hoveredLink}
                  setHoveredLink={setHoveredLink}
                  onClick={() => setSidebarOpen(false)}
                />
              ))}
            </div>
          </div>

          {/* Operations */}
          <div>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "#94a3b8",
                textTransform: "uppercase",
                padding: "0 12px",
                marginBottom: 6,
              }}
            >
              Operations
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {NAV_OPS.map(({ to, icon: Icon, label }) => (
                <SideNavLink
                  key={to}
                  to={to}
                  icon={Icon}
                  label={label}
                  active={isActive(to)}
                  hoveredLink={hoveredLink}
                  setHoveredLink={setHoveredLink}
                  onClick={() => setSidebarOpen(false)}
                />
              ))}
            </div>
          </div>
        </nav>

        {/* User section */}
        <div
          style={{
            padding: "12px 10px",
            flexShrink: 0,
            borderTop: "1px solid #f0f2f7",
            background: "#fafbfc",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 11,
              marginBottom: 4,
              background: "#fff",
              border: "1px solid #e8edf2",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                flexShrink: 0,
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#0f172a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            onMouseEnter={() => setLogoutHover(true)}
            onMouseLeave={() => setLogoutHover(false)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 9,
              border: "none",
              cursor: "pointer",
              background: logoutHover ? "rgba(239,68,68,0.1)" : "none",
              color: logoutHover ? "#ef4444" : "#64748b",
              fontSize: 13,
              fontWeight: 500,
              transition: "all .15s",
            }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main area ─── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* Topbar */}
        <header
          style={{
            height: 60,
            background: "#fff",
            borderBottom: "1px solid #e8edf2",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 9,
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#64748b",
              }}
            >
              <Menu size={20} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                Admin
              </span>
              <ChevronRight size={11} color="#cbd5e1" />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                {pageLabel}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 9,
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#64748b",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f3f4f6")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <Bell size={17} />
            </button>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                cursor: "pointer",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.02em",
                boxShadow: "0 0 12px rgba(99,102,241,0.35)",
              }}
            >
              {initial}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-main" style={{ flex: 1, overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
