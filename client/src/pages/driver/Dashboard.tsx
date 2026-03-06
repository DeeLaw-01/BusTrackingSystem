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

export default function DriverDashboard() {
  const [assignedBus, setAssignedBus] = useState<BusType | null>(null);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();

    // Listen for trip end events (when trip is ended by driver or admin)
    const unsubTripEnded = socketService.onTripEnded((data) => {
      console.log("Trip ended event received:", data);
      // Refresh trip data immediately
      loadData();
    });

    // Periodic refresh as fallback (every 10 seconds)
    const refreshInterval = setInterval(() => {
      loadData();
    }, 10000);

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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-700" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      {/* Header */}
      <div
        className="card border-0"
        style={{
          background: "#ffffff",
          padding: "16px 20px",
          borderLeft: "4px solid #111827",
        }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#f3f4f6",
              border: "1.5px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#111827"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="16" height="10" x="4" y="10" rx="2" />
              <path d="M4 14v6" />
              <path d="M20 14v6" />
              <path d="m4 10 2-6h12l2 6" />
              <path d="M8 10v4" />
              <path d="M16 10v4" />
              <circle cx="7" cy="20" r="1" />
              <circle cx="17" cy="20" r="1" />
            </svg>
          </div>
          <div>
            <h1
              className="text-lg font-bold leading-tight"
              style={{ color: "#0f172a" }}
            >
              Driver Dashboard
            </h1>
            <p style={{ color: "#64748b", fontSize: 12 }}>
              Welcome back, {user?.name}
            </p>
          </div>
        </div>
      </div>

      {/* No Bus Assigned */}
      {!assignedBus && (
        <div className="card border-gray-200 bg-gray-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-700">No Bus Assigned</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                You don't have a bus assigned to you yet. Please contact your
                administrator.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Bus */}
      {assignedBus && (
        <div className="card">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            <Bus className="w-4 h-4" />
            Your Assigned Bus
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-0.5">Bus Name</div>
              <div className="font-semibold text-slate-900">
                {assignedBus.name}
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-0.5">Plate Number</div>
              <div className="font-semibold text-slate-900">
                {assignedBus.plateNumber}
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-0.5">Capacity</div>
              <div className="font-semibold text-slate-900">
                {assignedBus.capacity} seats
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-0.5">Route</div>
              <div className="font-semibold text-slate-900 flex items-center gap-1">
                <RouteIcon className="w-3.5 h-3.5 text-gray-1000" />
                {typeof assignedBus.routeId === "object"
                  ? (assignedBus.routeId as { name: string }).name
                  : "Not assigned"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Trip / Start Trip */}
      {assignedBus && (
        <div>
          {currentTrip ? (
            <div className="card border-gray-200 bg-gray-100">
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-gray-1000 animate-pulse"></span>
                  <span className="text-sm font-semibold text-gray-800">
                    Trip in Progress
                  </span>
                </div>
                <p className="text-sm text-gray-800">
                  You have an active trip. Continue broadcasting your location.
                </p>
              </div>
              <Link
                to="/driver/trip"
                className="btn btn-primary bg-gray-700 hover:bg-gray-800 w-full flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                View Trip
              </Link>
            </div>
          ) : (
            <div className="card">
              <div className="mb-3">
                <h3 className="font-semibold text-slate-900 mb-0.5">
                  Ready to start?
                </h3>
                <p className="text-sm text-slate-500">
                  Begin your trip to start sharing your location with riders.
                </p>
              </div>
              <Link
                to="/driver/trip"
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                Start Trip
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Recent Trips */}
      <div className="card">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          <Clock className="w-4 h-4" />
          Recent Trips
        </h2>

        {recentTrips.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">No trips yet</p>
        ) : (
          <div className="space-y-2">
            {recentTrips.map((trip) => (
              <div
                key={trip._id}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      trip.status === "ongoing"
                        ? "bg-gray-1000"
                        : "bg-slate-300"
                    }`}
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      {typeof trip.routeId === "object"
                        ? (trip.routeId as { name: string }).name
                        : "Unknown Route"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(trip.startTime).toLocaleDateString()} at{" "}
                      {new Date(trip.startTime).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <span
                  className={`badge ${
                    trip.status === "ongoing" ? "badge-green" : "badge-slate"
                  }`}
                >
                  {trip.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
