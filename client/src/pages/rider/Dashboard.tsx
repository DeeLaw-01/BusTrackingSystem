import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import {
  Bus,
  ArrowLeft,
  Loader2,
  Phone,
  Info,
  Menu,
  X,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Bell as BellIcon,
  Shield,
  ChevronRight,
} from "lucide-react";
import { routesApi, busesApi, remindersApi } from "@/services/api";
import { socketService } from "@/services/socket";
import { useBusStore } from "@/store/busStore";
import { useAuthStore } from "@/store/authStore";
import UserAvatar from "@/components/ui/UserAvatar";
import type { Route, Stop, BusLocation } from "@/types";

// ─── Leaflet Icon Fix ────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ─── Custom Icons ────────────────────────────────────────────────────────────
function createBusIcon(label: string, isActive = false) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:48px;height:56px;">
        <div style="
          width:48px;height:48px;
          background:${isActive ? "#f95f5f" : "#fbbf24"};
          border-radius:12px;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 12px rgba(0,0,0,0.2);
          border:3px solid white;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
          </svg>
        </div>
        <div style="
          position:absolute;top:-8px;right:-8px;
          width:24px;height:24px;
          background:#38bdf8;border:2px solid white;
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:700;color:white;
          box-shadow:0 2px 6px rgba(0,0,0,0.2);
        ">${label}</div>
      </div>
    `,
    iconSize: [48, 56],
    iconAnchor: [24, 48],
  });
}

const stopIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:14px;height:14px;
      background:#f95f5f;
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const userIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:20px;height:20px;">
      <div style="
        width:20px;height:20px;
        background:#3b82f6;
        border-radius:50%;
        border:3px solid white;
        box-shadow:0 2px 8px rgba(59,130,246,0.5);
      "></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// ─── Types ───────────────────────────────────────────────────────────────────
type ViewState = "select" | "preview" | "tracking";

interface BusWithRoute {
  _id: string;
  plateNumber: string;
  name: string;
  capacity: number;
  isActive: boolean;
  routeId: { _id: string; name: string } | string;
  driverId?:
    | { _id: string; name: string; email: string; phone?: string }
    | string;
}

// ─── Map Controller ──────────────────────────────────────────────────────────
function MapController({
  center,
  zoom,
  bounds,
}: {
  center?: [number, number];
  zoom?: number;
  bounds?: L.LatLngBoundsExpression;
}) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom, bounds]);

  return null;
}

// ─── Main Dashboard Component ────────────────────────────────────────────────
export default function RiderDashboard() {
  const { busLocations, updateBusLocation, removeBus } = useBusStore();
  const { user, logout } = useAuthStore();

  // View state
  const [view, setView] = useState<ViewState>("select");
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data state
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<BusWithRoute[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected items
  const [selectedBus, setSelectedBus] = useState<BusWithRoute | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  // User location
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );

  // Default center (Lahore)
  const defaultCenter: [number, number] = [31.5204, 74.3587];

  // ─── Load initial data ──────────────────────────────────────────────
  useEffect(() => {
    loadData();
    getUserLocation();
  }, []);

  const loadData = async () => {
    try {
      const [routesRes, busesRes] = await Promise.all([
        routesApi.getAll(true),
        busesApi.getAll({ active: true }),
      ]);
      setRoutes(routesRes.data.data);
      setBuses(busesRes.data.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.log("Geolocation not available:", err.message),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // ─── Socket connection for real-time bus updates ────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      socketService.connect(token);
    }

    const unsubLocation = socketService.onBusLocation((data) => {
      updateBusLocation(data);
    });

    const unsubTripEnded = socketService.onTripEnded((data) => {
      removeBus(data.busId);
    });

    return () => {
      unsubLocation();
      unsubTripEnded();
    };
  }, [updateBusLocation, removeBus]);

  // ─── Join all route rooms for live bus updates ──────────────────────
  useEffect(() => {
    const joinAllRoutes = () => {
      routes.forEach((r) => socketService.joinRoute(r._id));
    };

    joinAllRoutes();

    // Re-join rooms after socket reconnection (rooms are lost on disconnect)
    const unsubConnected = socketService.onConnected(() => {
      console.log("Socket reconnected — rejoining route rooms");
      joinAllRoutes();
    });

    return () => {
      routes.forEach((r) => socketService.leaveRoute(r._id));
      unsubConnected();
    };
  }, [routes]);

  // ─── Handlers ───────────────────────────────────────────────────────
  const handleSelectBus = (bus: BusWithRoute) => {
    setSelectedBus(bus);
    // Find the route for this bus
    const routeId =
      typeof bus.routeId === "object" ? bus.routeId._id : bus.routeId;
    const route = routes.find((r) => r._id === routeId);
    if (route) {
      setSelectedRoute(route);
    }
    setView("preview");
    setSheetExpanded(true);
  };

  const handleViewStops = () => {
    if (!selectedBus || !selectedRoute) return;
    setView("tracking");
    setSheetExpanded(true);
  };

  const handleBack = () => {
    if (view === "tracking") {
      setView("preview");
    } else if (view === "preview") {
      setView("select");
      setSelectedBus(null);
      setSelectedRoute(null);
    }
  };

  // ─── Get live bus locations ─────────────────────────────────────────
  const getLiveBusLocation = (busId: string): BusLocation | undefined => {
    return busLocations.get(busId);
  };

  // ─── Compute map bounds ─────────────────────────────────────────────
  const getMapBounds = (): L.LatLngBoundsExpression | undefined => {
    if (view === "preview" || view === "tracking") {
      if (selectedRoute && selectedRoute.stops?.length > 0) {
        const points: [number, number][] = selectedRoute.stops.map((s) => [
          s.latitude,
          s.longitude,
        ]);
        if (selectedBus) {
          const live = getLiveBusLocation(selectedBus._id);
          if (live) points.push([live.latitude, live.longitude]);
        }
        if (userLocation) points.push(userLocation);
        return points as L.LatLngBoundsExpression;
      }
    }
    // For select view, show all bus locations + user
    const points: [number, number][] = [];
    busLocations.forEach((loc) => points.push([loc.latitude, loc.longitude]));
    if (userLocation) points.push(userLocation);
    if (points.length >= 2) return points as L.LatLngBoundsExpression;
    return undefined;
  };

  // ─── Get route label for a bus ──────────────────────────────────────
  const getRouteName = (bus: BusWithRoute): string => {
    if (typeof bus.routeId === "object" && bus.routeId) {
      return bus.routeId.name;
    }
    const route = routes.find((r) => r._id === bus.routeId);
    return route?.name || "";
  };

  // ─── Get bus letter label ──────────────────────────────────────────
  const getBusLabel = (index: number): string => {
    return String.fromCharCode(65 + (index % 26));
  };

  // ─── Get driver info ───────────────────────────────────────────────
  const getDriverInfo = (
    bus: BusWithRoute,
  ): { name: string; phone?: string } | null => {
    if (typeof bus.driverId === "object" && bus.driverId) {
      return { name: bus.driverId.name, phone: bus.driverId.phone };
    }
    return null;
  };

  // ─── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-700" />
      </div>
    );
  }

  const mapBounds = getMapBounds();
  const mapCenter = userLocation || defaultCenter;

  return (
    <div
      className={`h-screen flex flex-col bg-white relative overflow-hidden ${
        sidebarOpen ? "sidebar-open" : ""
      }`}
    >
      {/* ─── Sidebar Drawer ───────────────────────────────────────── */}
      <SidebarDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={logout}
      />

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <header
        className="shrink-0 relative z-1001 flex items-center gap-2 px-4"
        style={{
          height: "56px",
          background: "#ffffff",
          borderBottom: "1.5px solid #e2e8f0",
          boxShadow: "none",
        }}
      >
        {view !== "select" ? (
          <button
            title="Back"
            onClick={handleBack}
            className="flex items-center justify-center rounded-xl transition-all"
            style={{
              width: "32px",
              height: "32px",
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
            }}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: "#64748b" }} />
          </button>
        ) : (
          <button
            title="Open Sidebar"
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center rounded-xl transition-all"
            style={{
              width: "32px",
              height: "32px",
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
            }}
          >
            <Menu className="w-4 h-4" style={{ color: "#64748b" }} />
          </button>
        )}
        <div className="flex items-center gap-2 flex-1 justify-center">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              width: "28px",
              height: "28px",
              background: "#111827",
            }}
          >
            <Bus className="w-3.5 h-3.5 text-white" />
          </div>
          <h1
            className="text-sm font-bold tracking-wide"
            style={{ color: "#0f172a" }}
          >
            Safara Transit
          </h1>
        </div>
      </header>

      {/* ─── Map Area ───────────────────────────────────────────────── */}
      <div
        className={`relative shrink-0 transition-all duration-300 ${
          view === "tracking" && sheetExpanded ? "h-[25vh]" : "h-[45vh]"
        }`}
      >
        <MapContainer
          center={mapCenter}
          zoom={13}
          className="absolute inset-0 w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {mapBounds && <MapController bounds={mapBounds} />}
          {!mapBounds && <MapController center={mapCenter} zoom={13} />}

          {/* User location */}
          {userLocation && (
            <>
              <Circle
                center={userLocation}
                radius={100}
                pathOptions={{
                  color: "#3b82f6",
                  fillColor: "#3b82f6",
                  fillOpacity: 0.1,
                  weight: 1,
                }}
              />
              <Marker position={userLocation} icon={userIcon}>
                <Popup>
                  <span className="text-xs font-medium text-slate-700">
                    Your location
                  </span>
                </Popup>
              </Marker>
            </>
          )}

          {/* Route polyline (preview / tracking) — use OSRM path if available */}
          {(view === "preview" || view === "tracking") &&
            selectedRoute &&
            (selectedRoute.path && selectedRoute.path.length > 1 ? (
              <Polyline
                positions={selectedRoute.path}
                color="#38bdf8"
                weight={5}
                opacity={0.9}
              />
            ) : selectedRoute.stops?.length > 1 ? (
              <Polyline
                positions={selectedRoute.stops.map(
                  (s) => [s.latitude, s.longitude] as [number, number],
                )}
                color="#38bdf8"
                weight={5}
                opacity={0.9}
              />
            ) : null)}

          {/* Stop markers (preview / tracking) */}
          {(view === "preview" || view === "tracking") &&
            selectedRoute?.stops?.map((stop) => (
              <Marker
                key={stop._id}
                position={[stop.latitude, stop.longitude]}
                icon={stopIcon}
              >
                <Popup>
                  <div className="text-xs">
                    <div className="font-semibold text-slate-800">
                      {stop.name}
                    </div>
                    <div className="text-slate-500">
                      Stop #{stop.sequence + 1}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Bus markers */}
          {view === "select" &&
            buses.map((bus, idx) => {
              const live = getLiveBusLocation(bus._id);
              if (!live) return null;
              return (
                <Marker
                  key={bus._id}
                  position={[live.latitude, live.longitude]}
                  icon={createBusIcon(getBusLabel(idx))}
                  eventHandlers={{ click: () => handleSelectBus(bus) }}
                >
                  <Popup>
                    <div className="text-xs">
                      <div className="font-semibold text-slate-800">
                        {bus.name}
                      </div>
                      <div className="text-slate-500">{getRouteName(bus)}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* Selected bus marker */}
          {(view === "preview" || view === "tracking") &&
            selectedBus &&
            (() => {
              const live = getLiveBusLocation(selectedBus._id);
              const idx = buses.findIndex((b) => b._id === selectedBus._id);
              if (!live) return null;
              return (
                <Marker
                  position={[live.latitude, live.longitude]}
                  icon={createBusIcon(getBusLabel(idx >= 0 ? idx : 0), true)}
                >
                  <Popup>
                    <div className="text-xs">
                      <div className="font-semibold text-slate-800">
                        {selectedBus.name}
                      </div>
                      {live.speed && (
                        <div className="text-slate-500">
                          {Math.round(live.speed)} km/h
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })()}
        </MapContainer>
      </div>

      {/* ─── Bottom Sheet ───────────────────────────────────────────── */}
      <div
        className={`flex-1 rounded-t-3xl -mt-5 relative z-1001 flex flex-col overflow-hidden`}
        style={{
          background: "#ffffff",
          boxShadow: "0 -8px 32px rgba(99,102,241,0.12)",
          border: "1.5px solid #e2e8f0",
          borderBottom: "none",
        }}
      >
        <div
          className="flex justify-center pt-3 pb-1 cursor-pointer shrink-0"
          onClick={() => setSheetExpanded(!sheetExpanded)}
        >
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Sheet content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-0">
          {view === "select" && (
            <BusSelectView
              buses={buses}
              getRouteName={getRouteName}
              getLiveBusLocation={getLiveBusLocation}
              onSelectBus={handleSelectBus}
            />
          )}

          {view === "preview" && selectedRoute && selectedBus && (
            <RoutePreviewView
              bus={selectedBus}
              route={selectedRoute}
              onViewStops={handleViewStops}
            />
          )}

          {view === "tracking" && selectedRoute && selectedBus && (
            <ActiveTrackingView
              bus={selectedBus}
              route={selectedRoute}
              getLiveBusLocation={getLiveBusLocation}
              getDriverInfo={getDriverInfo}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Bus Select View (Screen 1) ─────────────────────────────────────────────
function BusSelectView({
  buses,
  getRouteName,
  getLiveBusLocation,
  onSelectBus,
}: {
  buses: BusWithRoute[];
  getRouteName: (bus: BusWithRoute) => string;
  getLiveBusLocation: (busId: string) => BusLocation | undefined;
  onSelectBus: (bus: BusWithRoute) => void;
}) {
  // Split buses into live (active trip) and inactive
  const liveBuses = buses.filter((b) => getLiveBusLocation(b._id));
  const inactiveBuses = buses.filter((b) => !getLiveBusLocation(b._id));

  return (
    <div className="pb-2 pt-1">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-slate-900">Select bus</h2>
        <button className="btn btn-icon" title="Information">
          <Info className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {buses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Bus className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-700 mb-1">
            No buses available
          </p>
          <p className="text-xs text-slate-400">
            Check back later for available routes
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Live buses first */}
          {liveBuses.map((bus) => {
            const routeName = getRouteName(bus);
            return (
              <button
                key={bus._id}
                onClick={() => onSelectBus(bus)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-gray-200 hover:bg-gray-100 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                  <Bus className="w-5 h-5 text-gray-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {bus.name}
                  </div>
                  <div className="text-xs text-gray-700 font-medium">
                    Live — On route
                  </div>
                </div>
                {routeName && (
                  <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-lg shrink-0 border border-gray-200">
                    {routeName}
                  </span>
                )}
                <span className="text-slate-300 shrink-0">›</span>
              </button>
            );
          })}

          {/* Inactive buses */}
          {inactiveBuses.map((bus) => {
            const routeName = getRouteName(bus);
            return (
              <button
                key={bus._id}
                onClick={() => onSelectBus(bus)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-gray-300 hover:bg-gray-100 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Bus className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {bus.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    Not currently active
                  </div>
                </div>
                {routeName && (
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg shrink-0">
                    {routeName}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Route Preview View (Screen 2) ──────────────────────────────────────────
function RoutePreviewView({
  bus,
  route,
  onViewStops,
}: {
  bus: BusWithRoute;
  route: Route;
  onViewStops: () => void;
}) {
  const stops = route.stops || [];

  return (
    <div className="pb-4 pt-1 space-y-4">
      {/* Bus / Route header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
          <Bus className="w-5 h-5 text-gray-700" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-slate-900 truncate">
            {bus.name}
          </h2>
          <p className="text-xs text-slate-500 truncate">{route.name}</p>
        </div>
        <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-lg border border-gray-200 shrink-0">
          {stops.length} stops
        </span>
      </div>

      {/* Stops timeline */}
      {stops.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">
          No stops on this route
        </p>
      ) : (
        <div className="relative ml-5">
          <div className="relative border-l-2 border-slate-200 space-y-4 pb-2">
            {stops.map((stop, index) => (
              <div
                key={stop._id}
                className="relative pl-5 flex items-start gap-2"
              >
                {/* Dot */}
                <div
                  className={`absolute -left-2.25 top-1.5 rounded-full border-2 z-10 ${
                    index === 0
                      ? "w-4 h-4 bg-white border-gray-700 ring-4 ring-gray-100"
                      : index === stops.length - 1
                        ? "w-4 h-4 bg-gray-800 border-gray-700"
                        : "w-3 h-3 bg-slate-200 border-slate-300"
                  }`}
                />
                {/* Stop info */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-medium ${
                      index === 0 || index === stops.length - 1
                        ? "text-slate-900"
                        : "text-slate-600"
                    }`}
                  >
                    {stop.name}
                  </div>
                  {stop.estimatedArrivalTime && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      {stop.estimatedArrivalTime}
                    </div>
                  )}
                </div>
                {index === 0 && (
                  <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-100 shrink-0">
                    Start
                  </span>
                )}
                {index === stops.length - 1 && stops.length > 1 && (
                  <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 shrink-0">
                    End
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Track button */}
      <button
        onClick={onViewStops}
        className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-800 active:bg-gray-800 text-white text-sm font-semibold transition-colors shadow-sm"
      >
        Track This Bus
      </button>
    </div>
  );
}

// ─── Active Tracking View (Screen 3) ────────────────────────────────────────
function ActiveTrackingView({
  bus,
  route,
  getLiveBusLocation,
  getDriverInfo,
}: {
  bus: BusWithRoute;
  route: Route;
  getLiveBusLocation: (busId: string) => BusLocation | undefined;
  getDriverInfo: (bus: BusWithRoute) => { name: string; phone?: string } | null;
}) {
  const stops = route.stops || [];
  const live = getLiveBusLocation(bus._id);
  const driver = getDriverInfo(bus);

  // Determine which stop the bus is at using path-aware progress
  const currentStopIndex = getCurrentStopIndex(stops, live, route.path);

  // Calculate ETA (rough estimate based on remaining stops)
  const etaMinutes = estimateETA(stops, currentStopIndex);

  // Reminders state
  const [reminders, setReminders] = useState<
    Map<string, { id: string; minutesBefore: number }>
  >(new Map());
  const [reminderPopup, setReminderPopup] = useState<string | null>(null);
  const [reminderMinutes, setReminderMinutes] = useState(5);
  const [savingReminder, setSavingReminder] = useState(false);

  // Load existing reminders for this route
  useEffect(() => {
    loadReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route._id]);

  const loadReminders = async () => {
    try {
      const res = await remindersApi.getMyReminders();
      const data = res.data.data as Array<{
        _id: string;
        stopId: { _id: string } | string;
        routeId: { _id: string } | string;
        minutesBefore: number;
        isActive: boolean;
      }>;
      const map = new Map<string, { id: string; minutesBefore: number }>();
      data
        .filter((r) => {
          const rRouteId =
            typeof r.routeId === "object" ? r.routeId._id : r.routeId;
          return rRouteId === route._id && r.isActive;
        })
        .forEach((r) => {
          const stopId = typeof r.stopId === "object" ? r.stopId._id : r.stopId;
          map.set(stopId, { id: r._id, minutesBefore: r.minutesBefore });
        });
      setReminders(map);
    } catch {
      // Silently fail
    }
  };

  const handleSetReminder = useCallback(
    async (stopId: string, minutes: number) => {
      setSavingReminder(true);
      try {
        // Check if reminder already exists
        const existing = reminders.get(stopId);
        if (existing) {
          // Update
          await remindersApi.update(existing.id, { minutesBefore: minutes });
          setReminders((prev) => {
            const next = new Map(prev);
            next.set(stopId, { ...existing, minutesBefore: minutes });
            return next;
          });
        } else {
          // Create
          const res = await remindersApi.create({
            stopId,
            routeId: route._id,
            minutesBefore: minutes,
            notificationType: "push",
          });
          const newReminder = res.data.data;
          setReminders((prev) => {
            const next = new Map(prev);
            next.set(stopId, { id: newReminder._id, minutesBefore: minutes });
            return next;
          });
        }
        setReminderPopup(null);
      } catch (err) {
        console.error("Failed to set reminder:", err);
      } finally {
        setSavingReminder(false);
      }
    },
    [reminders, route._id],
  );

  const handleRemoveReminder = useCallback(
    async (stopId: string) => {
      const existing = reminders.get(stopId);
      if (!existing) return;
      try {
        await remindersApi.delete(existing.id);
        setReminders((prev) => {
          const next = new Map(prev);
          next.delete(stopId);
          return next;
        });
        setReminderPopup(null);
      } catch (err) {
        console.error("Failed to remove reminder:", err);
      }
    },
    [reminders],
  );

  return (
    <div className="pb-2 pt-1 space-y-4">
      {/* Driver Info Card */}
      <div className="card flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <svg
            className="w-5 h-5 text-gray-700"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900 truncate">
            {driver?.name || "Driver"}
          </div>
          {driver?.phone && (
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              <Phone className="w-3 h-3" />
              {driver.phone}
            </div>
          )}
          <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-lg mt-1 font-medium border border-gray-200">
            {bus.name}
          </span>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-slate-400">Next stop in</div>
          <div className="text-lg font-mono font-bold text-gray-700">
            {formatETA(etaMinutes)}
          </div>
        </div>
      </div>

      {/* Route Timeline */}
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {bus.name} - Route
      </h3>

      <div className="relative ml-5">
        <div className="relative border-l-2 border-slate-200 space-y-4 pb-4">
          {/* Progress line overlay */}
          {stops.length > 1 && (
            <div
              className="absolute -left-px top-0 w-0.5 bg-gray-1000 transition-all duration-500"
              style={{
                height: `${
                  (currentStopIndex / Math.max(stops.length - 1, 1)) * 100
                }%`,
                zIndex: 1,
              }}
            />
          )}

          {stops.map((stop, index) => {
            const isPassed = index < currentStopIndex;
            const isCurrent = index === currentStopIndex;
            const hasReminder = reminders.has(stop._id);
            const reminderData = reminders.get(stop._id);

            return (
              <div
                key={stop._id}
                className="relative pl-5 flex items-start gap-2"
              >
                {/* Dot */}
                <div
                  className={`absolute -left-2.25 top-1.5 rounded-full border-2 z-10 ${
                    isCurrent
                      ? "w-4 h-4 bg-white border-gray-700 ring-4 ring-gray-100"
                      : isPassed
                        ? "w-4 h-4 bg-gray-800 border-gray-700"
                        : "w-3 h-3 bg-slate-200 border-slate-200"
                  }`}
                />

                {/* Stop info */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-semibold text-sm ${
                      isCurrent
                        ? "text-slate-900"
                        : isPassed
                          ? "text-slate-400"
                          : "text-slate-700"
                    }`}
                  >
                    {stop.name}
                  </div>
                  {hasReminder && (
                    <div className="text-xs text-gray-600 mt-0.5">
                      🔔 Alert {reminderData?.minutesBefore} min before
                    </div>
                  )}
                  {stop.estimatedArrivalTime && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      ETA: {stop.estimatedArrivalTime}
                    </div>
                  )}
                </div>

                {/* Reminder bell button */}
                {!isPassed && (
                  <div className="relative shrink-0">
                    <button
                      className={`p-1.5 rounded-lg transition-colors ${
                        hasReminder
                          ? "bg-gray-100 text-gray-1000 hover:bg-gray-100"
                          : "text-slate-300 hover:bg-slate-100 hover:text-slate-500"
                      }`}
                      title={hasReminder ? "Edit reminder" : "Set reminder"}
                      onClick={() => {
                        if (reminderPopup === stop._id) {
                          setReminderPopup(null);
                        } else {
                          setReminderMinutes(reminderData?.minutesBefore || 5);
                          setReminderPopup(stop._id);
                        }
                      }}
                    >
                      <BellIcon className="w-4 h-4" />
                    </button>

                    {/* Reminder popup */}
                    {reminderPopup === stop._id && (
                      <div className="absolute right-0 top-8 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-1000">
                        <div className="text-sm font-bold text-slate-900 mb-1">
                          Set Alert
                        </div>
                        <p className="text-xs text-slate-500 mb-3">
                          Get notified when the bus is approaching this stop.
                        </p>
                        <label className="text-xs font-medium text-slate-600 mb-2 block">
                          Minutes before arrival
                        </label>
                        <div className="grid grid-cols-4 gap-1 mb-3">
                          {[2, 5, 10, 15].map((m) => (
                            <button
                              key={m}
                              onClick={() => setReminderMinutes(m)}
                              className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                reminderMinutes === m
                                  ? "bg-gray-800 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {m} min
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleSetReminder(stop._id, reminderMinutes)
                            }
                            disabled={savingReminder}
                            className="btn btn-primary btn-sm flex-1 text-xs disabled:opacity-60"
                          >
                            {savingReminder
                              ? "Saving..."
                              : hasReminder
                                ? "Update"
                                : "Set Alert"}
                          </button>
                          {hasReminder && (
                            <button
                              onClick={() => handleRemoveReminder(stop._id)}
                              className="btn btn-danger btn-sm flex-1 text-xs"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar Drawer ──────────────────────────────────────────────────────────
function SidebarDrawer({
  open,
  onClose,
  user,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  user: ReturnType<typeof useAuthStore.getState>["user"];
  onLogout: () => void;
}) {
  const navigate = useNavigate();

  const menuItems = [
    { icon: User, label: "My Account", path: "/account" },
    { icon: BellIcon, label: "Notifications", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: HelpCircle, label: "Help & Support", path: "/help" },
    { icon: Shield, label: "Privacy Policy", path: "/privacy" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-1002 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-70 bg-white z-1003 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Profile area */}
        <div
          className="px-5 pt-12 pb-6 text-white relative"
          style={{
            background: "linear-gradient(160deg, #111827 0%, #111827 100%)",
          }}
        >
          <button
            title="Close Sidebar"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <UserAvatar
            name={user?.name}
            avatar={user?.avatar}
            size="lg"
            className="ring-2 ring-white/30"
          />
          <div className="text-base font-semibold mt-3">
            {user?.name || "User"}
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: "rgba(204,251,241,0.85)" }}
          >
            {user?.email}
          </div>
          <div className="mt-2">
            <span className="inline-block bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium capitalize">
              {user?.role || "Rider"}
            </span>
          </div>
        </div>

        {/* Menu items */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {menuItems.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={() => {
                navigate(path);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <Icon className="w-5 h-5 text-slate-500" />
              <span className="flex-1 text-sm font-medium">{label}</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-100 p-4">
          <button
            title="Logout"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Log out</span>
          </button>
        </div>

        {/* App version */}
        <div className="px-5 py-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">BusTrack v1.0.0</span>
        </div>
      </div>
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Find the index of the closest point in an array of coordinates */
function findClosestPointIndex(
  path: [number, number][],
  pos: [number, number],
): number {
  let minDist = Infinity;
  let closestIdx = 0;
  for (let i = 0; i < path.length; i++) {
    const dist = haversineDistance(pos[0], pos[1], path[i][0], path[i][1]);
    if (dist < minDist) {
      minDist = dist;
      closestIdx = i;
    }
  }
  return closestIdx;
}

/**
 * Determine which stop the bus is currently at / approaching.
 * Uses route path (OSRM) when available for accurate directional progress.
 * Falls back to proximity-based approach otherwise.
 */
function getCurrentStopIndex(
  stops: Stop[],
  busLocation?: BusLocation,
  routePath?: [number, number][],
): number {
  if (!busLocation || stops.length === 0) return 0;

  const busPos: [number, number] = [
    busLocation.latitude,
    busLocation.longitude,
  ];

  // ── Path-based progress (accurate, uses route direction) ───────────
  if (routePath && routePath.length > 1) {
    // Where is the bus along the path?
    const busPathIdx = findClosestPointIndex(routePath, busPos);

    // For each stop, find where it sits on the path
    let currentStopIdx = 0;
    for (let i = 0; i < stops.length; i++) {
      const stopPathIdx = findClosestPointIndex(routePath, [
        stops[i].latitude,
        stops[i].longitude,
      ]);
      const distToStop = haversineDistance(
        busLocation.latitude,
        busLocation.longitude,
        stops[i].latitude,
        stops[i].longitude,
      );

      if (busPathIdx > stopPathIdx && distToStop > 200) {
        // Bus is past this stop on the route AND far enough away
        currentStopIdx = Math.min(i + 1, stops.length - 1);
      } else {
        // Bus hasn't reached this stop yet (or is right at it)
        break;
      }
    }
    return currentStopIdx;
  }

  // ── Fallback: proximity-based (no path data) ──────────────────────
  // Only consider a stop "passed" if the bus is close enough to be on-route
  const NEAR_THRESHOLD = 500; // metres

  let closestIndex = 0;
  let minDist = Infinity;

  stops.forEach((stop, index) => {
    const dist = haversineDistance(
      busLocation.latitude,
      busLocation.longitude,
      stop.latitude,
      stop.longitude,
    );
    if (dist < minDist) {
      minDist = dist;
      closestIndex = index;
    }
  });

  // If the bus is far from ALL stops, assume it hasn't reached stop 0 yet
  if (minDist > NEAR_THRESHOLD) return 0;

  return closestIndex;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateETA(stops: Stop[], currentIndex: number): number {
  // Rough estimate: ~3 minutes per stop remaining
  const remaining = Math.max(0, stops.length - 1 - currentIndex);
  return remaining * 3;
}

function formatETA(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}
