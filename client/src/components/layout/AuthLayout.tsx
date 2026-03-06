import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Bus, MapPin, Shield, Zap } from "lucide-react";

const features = [
  { icon: MapPin, text: "Real-time bus tracking on live maps" },
  { icon: Zap, text: "Instant arrival alerts & notifications" },
  { icon: Shield, text: "Secure, role-based access control" },
];

export default function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "#f3f4f6" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "#111827",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bus size={24} color="white" strokeWidth={2} />
          </div>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "driver") return <Navigate to="/driver" replace />;
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#f3f4f6" }}>
      {/* -- Left panel (desktop only) -- */}
      <div
        className="hidden lg:flex flex-col justify-between py-14"
        style={{
          width: "50%",
          flexShrink: 0,
          background: "#111827",
          position: "relative",
          overflow: "hidden",
          padding: "56px 64px",
        }}
      >
        {/* subtle grid texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage:
              "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Logo */}
        <div className="flex items-center gap-4 relative">
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bus size={26} color="white" strokeWidth={2.2} />
          </div>
          <div>
            <div className="font-bold text-white text-[22px] leading-tight">
              Safara
            </div>
            <div
              className="text-[11px] font-semibold tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Transit System
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative">
          <div
            className="font-bold text-white leading-tight mb-5"
            style={{ fontSize: 42, letterSpacing: "-0.03em", lineHeight: 1.1 }}
          >
            Manage your fleet with confidence.
          </div>
          <p
            className="mb-12"
            style={{
              fontSize: 17,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.75,
            }}
          >
            A unified platform for administrators, drivers, and riders — all in
            one place.
          </p>
          <div className="space-y-5">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-4">
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 11,
                    background: "rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color="rgba(255,255,255,0.8)" />
                </div>
                <span style={{ fontSize: 15, color: "rgba(255,255,255,0.65)" }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="relative text-[13px]"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          &copy; {new Date().getFullYear()} Safara Transit. All rights reserved.
        </div>
      </div>

      {/* -- Right panel -- */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2.5 mb-8">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#111827",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bus size={19} color="white" strokeWidth={2.2} />
          </div>
          <div className="font-bold text-[17px]" style={{ color: "#111827" }}>
            Safara
          </div>
        </div>

        {/* Card */}
        <div
          className="w-full"
          style={{
            maxWidth: 400,
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            boxShadow:
              "0 2px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
            padding: "36px 36px 32px",
          }}
        >
          <Outlet />
        </div>

        <p className="mt-6 text-[12px] lg:hidden" style={{ color: "#9ca3af" }}>
          &copy; {new Date().getFullYear()} Safara Transit. All rights reserved.
        </p>
      </div>
    </div>
  );
}
