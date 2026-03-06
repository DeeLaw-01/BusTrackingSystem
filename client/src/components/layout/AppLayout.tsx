import { Outlet, Link, useLocation } from "react-router-dom";
import { Bus, LogOut, Navigation, LayoutDashboard } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function AppLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navItems = [
    { to: "/driver", icon: LayoutDashboard, label: "Dashboard", exact: true },
    { to: "/driver/trip", icon: Navigation, label: "Active Trip", exact: false },
  ];

  return (
    <div className="flex flex-col h-screen" style={{ background: "#f1f5f9" }}>
      {/* Header */}
      <header
        className="shrink-0 z-30"
        style={{ background: "#ffffff", borderBottom: "1.5px solid #e2e8f0" }}
      >
        <div className="flex items-center justify-between px-4 max-w-2xl mx-auto" style={{ height: 56 }}>
          <Link to="/driver" className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center"
              style={{ width: 34, height: 34, borderRadius: 9, background: "#111827" }}
            >
              <Bus size={17} color="white" strokeWidth={2.2} />
            </div>
            <div>
              <div className="font-bold text-[15px] leading-tight" style={{ color: "#0f172a" }}>Safara</div>
              <div className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#111827" }}>Driver</div>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:block text-right">
              <div className="text-[13px] font-semibold" style={{ color: "#1e293b" }}>{user?.name}</div>
              <div className="text-[11px]" style={{ color: "#94a3b8" }}>Driver</div>
            </div>
            <div
              className="flex items-center justify-center text-[12px] font-bold text-white"
              style={{ width: 32, height: 32, borderRadius: 8, background: "#111827" }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors"
              style={{ color: "#dc2626", background: "#fef2f2", border: "1px solid #fca5a5" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#fee2e2")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#fef2f2")}
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30"
        style={{ background: "#ffffff", borderTop: "1.5px solid #e2e8f0" }}
      >
        <div className="flex items-stretch max-w-md mx-auto" style={{ height: 60 }}>
          {navItems.map(({ to, icon: Icon, label, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center justify-center gap-1 flex-1 text-[11px] font-semibold transition-colors relative"
                style={{ color: active ? "#111827" : "#94a3b8" }}
              >
                {active && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
                    style={{ width: 28, height: 3, background: "#111827" }}
                  />
                )}
                <div
                  className="flex items-center justify-center rounded-lg transition-colors"
                  style={{
                    width: 34,
                    height: 30,
                    background: active ? "#f3f4f6" : "transparent",
                  }}
                >
                  <Icon size={17} />
                </div>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
