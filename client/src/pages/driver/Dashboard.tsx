import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bus,
  Route as RouteIcon,
  Navigation,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { tripsApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { socketService } from "@/services/socket";
import type { Bus as BusType, Trip } from "@/types";

const CSS = `
  /* â”€â”€ Root â”€â”€ */
  .dd-root { min-height: 100%; padding: 20px 16px 28px; background: #f5f7fa; }

  /* â”€â”€ Header â”€â”€ */
  .dd-header {
    border-radius: 20px; padding: 22px 24px; margin-bottom: 20px;
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f2a4a 100%);
    border: 1px solid rgba(99,102,241,0.15);
    display: flex; align-items: center; gap: 14px;
  }
  .dd-header-icon {
    width: 50px; height: 50px; border-radius: 14px; flex-shrink: 0;
    background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.35);
    display: flex; align-items: center; justify-content: center;
  }
  .dd-header-title { font-size: 18px; font-weight: 800; color: #f1f5f9; letter-spacing: -0.02em; }
  .dd-header-sub { font-size: 13px; color: #64748b; margin-top: 2px; }

  /* â”€â”€ Layout grid â”€â”€ */
  .dd-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }

  /* â”€â”€ Cards â”€â”€ */
  .dd-card {
    background: #fff; border-radius: 18px; border: 1px solid #e8edf2;
    box-shadow: 0 2px 16px rgba(0,0,0,0.04); padding: 18px 20px;
  }
  .dd-section-label {
    font-size: 11px; font-weight: 700; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 14px;
    display: flex; align-items: center; gap: 6px;
  }

  /* â”€â”€ Bus info grid â”€â”€ */
  .dd-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .dd-info-cell {
    background: #f8fafc; border-radius: 12px; padding: 12px 14px;
    border: 1px solid #f1f5f9;
  }
  .dd-info-label { font-size: 10.5px; font-weight: 600; color: #94a3b8; margin-bottom: 3px; }
  .dd-info-val {
    font-size: 14px; font-weight: 700; color: #0f172a;
    display: flex; align-items: center; gap: 5px;
  }

  /* â”€â”€ Alert: no bus â”€â”€ */
  .dd-no-bus {
    display: flex; align-items: flex-start; gap: 12px;
    background: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; padding: 16px;
  }
  .dd-no-bus-title { font-size: 14px; font-weight: 700; color: #92400e; }
  .dd-no-bus-sub { font-size: 12.5px; color: #b45309; margin-top: 3px; }

  /* â”€â”€ Trip banners â”€â”€ */
  .dd-trip-active-banner {
    background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px;
    padding: 14px 16px; margin-bottom: 14px;
    display: flex; align-items: center; gap: 10px;
  }
  .dd-trip-active-dot {
    width: 10px; height: 10px; border-radius: 50%; background: #22c55e;
    flex-shrink: 0; box-shadow: 0 0 6px #22c55e;
  }
  .dd-trip-active-title { font-size: 14px; font-weight: 700; color: #15803d; }
  .dd-trip-active-sub { font-size: 12px; color: #16a34a; margin-top: 2px; }

  .dd-ready-banner {
    background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 14px;
    padding: 14px 16px; margin-bottom: 14px;
  }
  .dd-ready-title { font-size: 14px; font-weight: 700; color: #3730a3; }
  .dd-ready-sub { font-size: 12.5px; color: #6366f1; margin-top: 3px; }

  /* â”€â”€ CTA button â”€â”€ */
  .dd-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 13px 0; border-radius: 14px; border: none;
    background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
    color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
    text-decoration: none;
    box-shadow: 0 4px 16px rgba(99,102,241,0.35);
    transition: opacity 0.15s, transform 0.1s;
  }
  .dd-btn:hover { opacity: 0.92; transform: translateY(-1px); }

  /* â”€â”€ Recent trips list â”€â”€ */
  .dd-trip-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 0; border-bottom: 1px solid #f1f5f9;
  }
  .dd-trip-row:last-child { border-bottom: none; }
  .dd-trip-dot-active { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }
  .dd-trip-dot-ended { width: 8px; height: 8px; border-radius: 50%; background: #cbd5e1; flex-shrink: 0; }
  .dd-trip-name { font-size: 13.5px; font-weight: 600; color: #0f172a; }
  .dd-trip-date { font-size: 11.5px; color: #94a3b8; margin-top: 2px; }
  .dd-badge-active {
    font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 99px;
    background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a;
  }
  .dd-badge-ended {
    font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 99px;
    background: #f8fafc; border: 1px solid #e2e8f0; color: #94a3b8;
  }
  .dd-empty { font-size: 13px; color: #94a3b8; padding: 16px 0; text-align: center; }

  /* â”€â”€ Loading â”€â”€ */
  .dd-loading { display: flex; align-items: center; justify-content: center; min-height: 60vh; }

  @media (min-width: 768px) {
    .dd-root { padding: 28px 32px; max-width: 1100px; margin: 0 auto; }
    .dd-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (min-width: 1200px) {
    .dd-root { padding: 32px 48px; }
  }
`;

export default function DriverDashboard() {
  const [assignedBus, setAssignedBus] = useState<BusType | null>(null);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
    const unsubTripEnded = socketService.onTripEnded(() => loadData());
    const refreshInterval = setInterval(() => loadData(), 10000);
    return () => {
      unsubTripEnded();
      clearInterval(refreshInterval);
    };
  }, []);

  const loadData = async () => {
    try {
      const [busRes, tripRes, recentRes] = await Promise.all([
        tripsApi.getMyBus().catch(() => ({ data: { data: null } })),
        tripsApi.getCurrent(),
        tripsApi.getMyTrips({ limit: 5 }),
      ]);
      setAssignedBus(busRes.data.data);
      setCurrentTrip(tripRes.data.data);
      setRecentTrips(recentRes.data.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <style>{CSS}</style>
        <div className="dd-loading">
          <Loader2 size={28} color="#6366f1" className="animate-spin" />
        </div>
      </>
    );
  }

  const routeName = assignedBus
    ? typeof assignedBus.routeId === "object"
      ? (assignedBus.routeId as { name: string }).name
      : "Not assigned"
    : null;

  return (
    <>
      <style>{CSS}</style>
      <div className="dd-root">

        {/* Header */}
        <div className="dd-header">
          <div className="dd-header-icon">
            <Bus size={24} color="#a5b4fc" />
          </div>
          <div>
            <div className="dd-header-title">Driver Dashboard</div>
            <div className="dd-header-sub">Welcome back, {user?.name}</div>
          </div>
        </div>

        <div className="dd-grid">

          {/* â”€â”€ Left column: Bus info + Trip â”€â”€ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* No bus warning */}
            {!assignedBus && (
              <div className="dd-no-bus">
                <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div className="dd-no-bus-title">No Bus Assigned</div>
                  <div className="dd-no-bus-sub">Contact your administrator to get a bus assigned.</div>
                </div>
              </div>
            )}

            {/* Assigned bus info */}
            {assignedBus && (
              <div className="dd-card">
                <div className="dd-section-label">
                  <Bus size={13} />
                  Assigned Bus
                </div>
                <div className="dd-info-grid">
                  <div className="dd-info-cell">
                    <div className="dd-info-label">Bus Name</div>
                    <div className="dd-info-val">{assignedBus.name}</div>
                  </div>
                  <div className="dd-info-cell">
                    <div className="dd-info-label">Plate Number</div>
                    <div className="dd-info-val">{assignedBus.plateNumber}</div>
                  </div>
                  <div className="dd-info-cell">
                    <div className="dd-info-label">Capacity</div>
                    <div className="dd-info-val">{assignedBus.capacity} seats</div>
                  </div>
                  <div className="dd-info-cell">
                    <div className="dd-info-label">Route</div>
                    <div className="dd-info-val">
                      <RouteIcon size={13} color="#6366f1" />
                      {routeName}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current trip / start trip */}
            {assignedBus && (
              <div className="dd-card">
                <div className="dd-section-label">
                  <Navigation size={13} />
                  Current Trip
                </div>
                {currentTrip ? (
                  <>
                    <div className="dd-trip-active-banner">
                      <span className="dd-trip-active-dot" />
                      <div>
                        <div className="dd-trip-active-title">Trip In Progress</div>
                        <div className="dd-trip-active-sub">Continue broadcasting your location</div>
                      </div>
                    </div>
                    <Link to="/driver/trip" className="dd-btn">
                      <Navigation size={16} />
                      View Active Trip
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="dd-ready-banner">
                      <div className="dd-ready-title">Ready to start?</div>
                      <div className="dd-ready-sub">Begin your trip to share your location with riders.</div>
                    </div>
                    <Link to="/driver/trip" className="dd-btn">
                      <Navigation size={16} />
                      Start Trip
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* â”€â”€ Right column: Recent trips â”€â”€ */}
          <div className="dd-card">
            <div className="dd-section-label">
              <Clock size={13} />
              Recent Trips
            </div>
            {recentTrips.length === 0 ? (
              <div className="dd-empty">No trips yet</div>
            ) : (
              recentTrips.map((trip) => (
                <div key={trip._id} className="dd-trip-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className={trip.status === "ongoing" ? "dd-trip-dot-active" : "dd-trip-dot-ended"} />
                    <div>
                      <div className="dd-trip-name">
                        {typeof trip.routeId === "object"
                          ? (trip.routeId as { name: string }).name
                          : "Unknown Route"}
                      </div>
                      <div className="dd-trip-date">
                        {new Date(trip.startTime).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                  <span className={trip.status === "ongoing" ? "dd-badge-active" : "dd-badge-ended"}>
                    {trip.status === "ongoing" ? "Active" : "Ended"}
                  </span>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </>
  );
}
