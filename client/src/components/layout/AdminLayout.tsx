import { Outlet, Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/users", icon: Users, label: "Users & Access" },
  { to: "/admin/invitations", icon: Mail, label: "Invitations" },
  { to: "/admin/routes", icon: RouteIcon, label: "Routes" },
  { to: "/admin/buses", icon: Bus, label: "Fleet" },
];

export default function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (to: string) =>
    to === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(to);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#f3f4f6" }}
    >
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{
            background: "rgba(15,23,42,0.25)",
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{
          width: 240,
          background: "#ffffff",
          borderRight: "1.5px solid #e2e8f0",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5"
          style={{ height: 60, borderBottom: "1px solid #e2e8f0" }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "#111827",
            }}
          >
            <Bus size={18} color="white" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="font-bold text-[15px] leading-tight"
              style={{ color: "#0f172a" }}
            >
              Safara
            </div>
            <div
              className="text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "#94a3b8" }}
            >
              Admin
            </div>
          </div>
          <button
            className="lg:hidden p-1"
            style={{ color: "#94a3b8" }}
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <div
            className="text-[10.5px] font-bold tracking-widest uppercase px-2 mb-2"
            style={{ color: "#b0bec5" }}
          >
            Navigation
          </div>
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 text-[13.5px] font-medium rounded-lg transition-all"
                style={{
                  padding: "8px 10px",
                  background: active ? "#f3f4f6" : "transparent",
                  color: active ? "#111827" : "#64748b",
                  fontWeight: active ? 600 : 500,
                  borderLeft: active
                    ? "3px solid #111827"
                    : "3px solid transparent",
                }}
              >
                <Icon
                  size={15}
                  style={{
                    color: active ? "#111827" : "#94a3b8",
                    flexShrink: 0,
                  }}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div
          className="px-3 pb-4 pt-3"
          style={{ borderTop: "1px solid #e2e8f0" }}
        >
          <div
            className="flex items-center gap-2.5 p-2.5 rounded-xl mb-2.5"
            style={{ background: "#f3f4f6", border: "1px solid #e5e7eb" }}
          >
            <div
              className="flex items-center justify-center shrink-0 text-[12px] font-bold text-white"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#111827",
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[13px] font-semibold truncate"
                style={{ color: "#1e293b" }}
              >
                {user?.name}
              </div>
              <div
                className="text-[11px] truncate"
                style={{ color: "#94a3b8" }}
              >
                {user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
            style={{ color: "#dc2626" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "#fef2f2")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "transparent")
            }
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header
          className="flex items-center justify-between shrink-0 px-5"
          style={{
            height: 60,
            background: "#ffffff",
            borderBottom: "1.5px solid #e2e8f0",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: "#64748b" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "#f3f4f6")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "transparent")
              }
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span
              className="font-semibold text-[15px]"
              style={{ color: "#0f172a" }}
            >
              {navItems.find((n) => isActive(n.to))?.label ?? "Admin"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: "#64748b" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "#f3f4f6")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "transparent")
              }
            >
              <Bell size={17} />
            </button>
            <div
              className="flex items-center justify-center text-[12px] font-bold text-white"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#111827",
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
