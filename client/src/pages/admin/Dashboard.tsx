import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import {
  Users, Bus, Activity, Navigation, Clock, UserCheck,
  Loader2, Zap, TrendingUp, ArrowRight,
} from "lucide-react";
import { adminApi } from "@/services/api";
import type { DashboardStats, Trip, BusLocation } from "@/types";

const C = {
  indigo: "#6366f1", indigoDark: "#4f46e5", indigoBg: "#eef2ff",
  sky: "#0ea5e9", skyBg: "#f0f9ff",
  dark: "#0f172a", slate: "#64748b", light: "#94a3b8",
  border: "#e2e8f0",
} as const;

const busIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;background:#6366f1;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;box-shadow:0 0 0 3px rgba(99,102,241,0.3),0 2px 8px rgba(0,0,0,0.2)"><svg width="13" height="13" fill="white" viewBox="0 0 24 24"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10z"/></svg></div>`,
  iconSize: [28, 28], iconAnchor: [14, 14],
});

function DonutChart({ data, size = 90 }: { data: { value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2, cy = size / 2, r = size / 2 - 13;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={13} />
      {total > 0 && data.filter(d => d.value > 0).map((d, i) => {
        const dash = (d.value / total) * circ;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color}
            strokeWidth={13} strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset} transform={`rotate(-90 ${cx} ${cy})`} />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

function Ring({ pct, color, size = 88, stroke = 9 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const cx = size / 2, cy = size / 2, r = cx - stroke / 2 - 1;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(Math.max(pct, 0), 1) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
    </svg>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [sRes, tRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getRecentTrips(6),
      ]);
      setStats(sRes.data.data);
      setRecentTrips(tRes.data.data);
      setLastUpdated(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280, gap: 12 }}>
      <Loader2 size={22} style={{ color: C.indigo }} className="animate-spin" />
      <span style={{ fontSize: 13, color: C.slate }}>Loading command center…</span>
    </div>
  );

  if (!stats) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280 }}>
      <p style={{ fontSize: 13, color: C.light }}>Failed to load dashboard</p>
    </div>
  );

  const lv = stats.liveLocations || [];
  const mapCenter: [number, number] = lv.length > 0 ? [lv[0].latitude, lv[0].longitude] : [31.5204, 74.3587];
  const adminCount = Math.max(0, stats.users.total - stats.users.riders - stats.users.drivers);
  const fleetPct = stats.buses.total > 0 ? stats.buses.active / stats.buses.total : 0;
  const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16 } as React.CSSProperties;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* ── Dark banner header ── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f2a4a 100%)",
        borderRadius: 18, padding: "26px 28px", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Zap size={18} color="#818cf8" />
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em" }}>Command Center</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.sky, boxShadow: `0 0 7px ${C.sky}`, display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Live · updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/admin/users" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)", color: "#a5b4fc", borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            <Users size={14} /> Users
          </Link>
          <Link to="/admin/buses" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: C.indigo, color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            <Bus size={14} /> Fleet
          </Link>
        </div>
      </div>

      {/* ── 4 stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Total Users", value: stats.users.total, sub: `${stats.users.riders} riders · ${stats.users.drivers} drivers`, icon: Users, accent: C.indigo, bg: C.indigoBg, link: "/admin/users" },
          { label: "Pending Approval", value: stats.users.pendingDrivers, sub: "Driver applications", icon: UserCheck, accent: C.sky, bg: C.skyBg, link: "/admin/users" },
          { label: "Live Buses", value: stats.buses.live, sub: `of ${stats.buses.total} fleet`, icon: Bus, accent: C.sky, bg: C.skyBg, live: true, link: "/admin/buses" },
          { label: "Active Routes", value: stats.routes.active, sub: `of ${stats.routes.total} total`, icon: Activity, accent: C.indigo, bg: C.indigoBg, link: "/admin/routes" },
        ].map(({ label, value, sub, icon: Icon, accent, bg, live, link }) => (
          <Link key={label} to={link} style={{ textDecoration: "none" }}>
            <div style={{ ...card, borderTop: `3px solid ${accent}`, padding: "18px 20px 16px" }} className="hover:shadow-md transition-shadow">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={17} color={accent} />
                </div>
                {live && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: C.sky, background: C.skyBg, padding: "2px 8px", borderRadius: 99 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.sky, boxShadow: `0 0 5px ${C.sky}` }} />
                    LIVE
                  </span>
                )}
              </div>
              <div style={{ fontSize: 38, fontWeight: 800, color: C.dark, lineHeight: 1, letterSpacing: "-0.04em", marginBottom: 6, fontVariantNumeric: "tabular-nums" }}>
                {value}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 12, color: C.light }}>{sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Analytics row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

        {/* User breakdown donut */}
        <div style={{ ...card, padding: "20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>User Breakdown</div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <DonutChart data={[{ value: stats.users.riders, color: C.sky }, { value: stats.users.drivers, color: C.indigo }, { value: adminCount, color: "#cbd5e1" }]} size={90} />
            <div style={{ flex: 1 }}>
              {[
                { label: "Riders", value: stats.users.riders, color: C.sky },
                { label: "Drivers", value: stats.users.drivers, color: C.indigo },
                { label: "Admins", value: adminCount, color: "#94a3b8" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: C.slate }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fleet health ring */}
        <div style={{ ...card, padding: "20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Fleet Health</div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Ring pct={fleetPct} color={C.indigo} size={90} stroke={9} />
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.dark, lineHeight: 1 }}>{Math.round(fleetPct * 100)}%</div>
                <div style={{ fontSize: 9, color: C.light, lineHeight: 1.2, marginTop: 1 }}>util.</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {[
                { label: "Active", value: stats.buses.active, color: C.indigo },
                { label: "Live Now", value: stats.buses.live, color: C.sky },
                { label: "Inactive", value: stats.buses.total - stats.buses.active, color: "#cbd5e1" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: C.slate }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trip activity ring */}
        <div style={{ ...card, padding: "20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Trip Activity</div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Ring pct={stats.trips.today > 0 ? stats.trips.ongoing / stats.trips.today : 0} color={C.sky} size={90} stroke={9} />
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.dark, lineHeight: 1 }}>{stats.trips.ongoing}</div>
                <div style={{ fontSize: 9, color: C.light, lineHeight: 1.2, marginTop: 1 }}>live</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {[
                { label: "Today", value: stats.trips.today, color: C.sky },
                { label: "Ongoing", value: stats.trips.ongoing, color: C.indigo },
                { label: "Routes", value: stats.routes.active, color: "#cbd5e1" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: C.slate }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Map + Trips ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 14 }}>
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Navigation size={14} color={C.indigo} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: C.dark }}>Live Bus Map</span>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: lv.length > 0 ? C.indigoBg : "#f1f5f9", color: lv.length > 0 ? C.indigo : C.light }}>
              {lv.length > 0 && <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.indigo, boxShadow: `0 0 4px ${C.indigo}` }} />}
              {lv.length > 0 ? `${lv.length} tracking` : "no buses online"}
            </span>
          </div>
          <div style={{ height: 310 }}>
            <MapContainer center={mapCenter} zoom={12} className="w-full h-full" zoomControl={false}>
              <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {lv.map((bus: BusLocation) => (
                <Marker key={bus.busId} position={[bus.latitude, bus.longitude]} icon={busIcon}>
                  <Popup><div style={{ fontSize: 12 }}><b>Bus …{bus.busId.slice(-6)}</b>{bus.speed ? <div style={{ color: C.slate }}>{Math.round(bus.speed)} km/h</div> : null}</div></Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div style={{ ...card, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={14} color={C.sky} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: C.dark }}>Recent Trips</span>
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 600, background: C.skyBg, color: C.sky, padding: "2px 9px", borderRadius: 99 }}>{stats.trips.today} today</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {recentTrips.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "50px 20px", color: C.light }}>
                <Clock size={22} style={{ opacity: 0.25, marginBottom: 10 }} />
                <p style={{ fontSize: 13, margin: 0 }}>No recent trips</p>
              </div>
            ) : recentTrips.map((trip, i) => (
              <div key={trip._id} className="hover:bg-slate-50 transition-colors" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", borderBottom: i < recentTrips.length - 1 ? "1px solid #f8fafc" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: trip.status === "ongoing" ? C.sky : "#e2e8f0", boxShadow: trip.status === "ongoing" ? `0 0 5px ${C.sky}` : "none" }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {trip.routeId && typeof trip.routeId === "object" ? (trip.routeId as { name: string }).name : "Unknown Route"}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.light }}>
                      {trip.driverId && typeof trip.driverId === "object" ? (trip.driverId as { name: string }).name : ""}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, flexShrink: 0, background: trip.status === "ongoing" ? C.skyBg : "#f1f5f9", color: trip.status === "ongoing" ? C.sky : C.slate }}>
                  {trip.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick links ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { to: "/admin/users", icon: Users, label: "Users & Access", desc: "Roles, approvals, accounts", accent: C.indigo, bg: C.indigoBg },
          { to: "/admin/routes", icon: TrendingUp, label: "Route Management", desc: "Build and configure routes", accent: C.sky, bg: C.skyBg },
          { to: "/admin/buses", icon: Bus, label: "Fleet Management", desc: "Buses, drivers, live status", accent: C.indigo, bg: C.indigoBg },
        ].map(({ to, icon: Icon, label, desc, accent, bg }) => (
          <Link key={to} to={to} style={{ textDecoration: "none" }}>
            <div className="hover:shadow-md transition-all" style={{ ...card, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, borderLeft: `3px solid ${accent}` }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={17} color={accent} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.dark }}>{label}</div>
                <div style={{ fontSize: 12, color: C.light, marginTop: 2 }}>{desc}</div>
              </div>
              <ArrowRight size={14} color="#cbd5e1" style={{ flexShrink: 0 }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
