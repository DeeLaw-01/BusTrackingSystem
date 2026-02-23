import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { 
  Users, 
  Bus, 
  Route as RouteIcon, 
  Navigation,
  Clock,
  UserCheck,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { adminApi } from '@/services/api'
import { socketService } from '@/services/socket'
import type { DashboardStats, Trip, BusLocation } from '@/types'
import 'leaflet/dist/leaflet.css';

// Custom bus icon
const busIcon = L.divIcon({
  className: 'bus-marker',
  html: `<div style="
    width: 32px; 
    height: 32px; 
    background-color: #22c55e; 
    border-radius: 9999px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); 
    border: 2px solid white;
  ">
    <svg style="width: 16px; height: 16px; color: white;" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10z"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  // Real-time bus locations — merges REST poll + live socket updates
  const [liveBusMap, setLiveBusMap] = useState<Map<string, BusLocation>>(new Map());

  const updateBusLocation = useCallback((loc: BusLocation) => {
    setLiveBusMap(prev => {
      const next = new Map(prev);
      next.set(loc.busId, loc);
      return next;
    });
  }, []);

  const removeBus = useCallback((busId: string) => {
    setLiveBusMap(prev => {
      const next = new Map(prev);
      next.delete(busId);
      return next;
    });
  }, []);

  useEffect(() => {
    // Connect socket as admin to receive live bus events
    const token = localStorage.getItem('token');
    if (token) socketService.connect(token);

    const unsubLocation = socketService.onBusLocation(updateBusLocation);
    const unsubTripEnded = socketService.onTripEnded((data) => removeBus(data.busId));

    return () => {
      unsubLocation();
      unsubTripEnded();
    };
  }, [updateBusLocation, removeBus]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10s for live bus accuracy
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, tripsRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getRecentTrips(5),
      ]);
      const data: DashboardStats = statsRes.data.data;
      setStats(data);
      setRecentTrips(tripsRes.data.data);
      // Seed map from REST snapshot (fills in buses not yet received via socket)
      if (data.liveLocations?.length) {
        setLiveBusMap(prev => {
          const next = new Map(prev);
          data.liveLocations.forEach(loc => {
            if (!next.has(loc.busId)) next.set(loc.busId, loc);
          });
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-content-secondary">Failed to load dashboard</p>
      </div>
    );
  }

  const liveLocations = Array.from(liveBusMap.values());
  const mapCenter: [number, number] = liveLocations.length > 0
    ? [liveLocations[0].latitude, liveLocations[0].longitude]
    : [31.5204, 74.3587]; // Default to Lahore

  return (
    <div className="space-y-6 relative">
      <h1 className="admin-header text-2xl relative z-10">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.users.total}
          subValue={`${stats.users.riders} riders, ${stats.users.drivers} drivers`}
          color="primary"
        />
        <StatCard
          icon={UserCheck}
          label="Pending Drivers"
          value={stats.users.pendingDrivers}
          subValue="Awaiting approval"
          color="amber"
          link="/admin/users"
        />
        <StatCard
          icon={Bus}
          label="Live Trips"
          value={stats.trips.ongoing}
          subValue={`${stats.buses.active} buses enabled`}
          color="green"
        />
        <StatCard
          icon={RouteIcon}
          label="Active Routes"
          value={stats.routes.active}
          subValue={`of ${stats.routes.total} total`}
          color="accent"
        />
      </div>

      {/* Live Map & Recent Trips */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Live Map */}
        <div className="card shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-content-primary flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              Live Buses
            </h2>
            <span className="text-sm text-content-secondary">
              {liveLocations.length} active
            </span>
          </div>

          <div className="h-64 rounded-lg overflow-hidden">
            <MapContainer
              center={mapCenter}
              zoom={12}
              className="h-full w-full"
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {liveLocations.map((bus: BusLocation) => (
                <Marker
                  key={bus.busId}
                  position={[bus.latitude, bus.longitude]}
                  icon={busIcon}
                >
                  <Popup>
                    <div className="p-1 min-w-[100px]">
                      <div className="text-xs font-medium text-content-secondary uppercase tracking-wider mb-1">Live Bus</div>
                      <div className="text-sm font-bold text-content-primary mb-2 flex items-center gap-1.5">
                        <Bus className="w-3.5 h-3.5 text-primary" />
                        ID: {bus.busId.slice(-6)}
                      </div>
                      {bus.speed !== undefined && (
                        <div className="flex items-center gap-2 text-xs font-semibold bg-primary/5 text-primary px-2 py-1 rounded-md">
                          <Navigation className="w-3 h-3" />
                          {Math.round(bus.speed)} km/h
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Recent Trips */}
        <div className="card shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-content-primary flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Trips
            </h2>
            <span className="text-sm text-content-secondary">
              {stats.trips.today} today
            </span>
          </div>

          {recentTrips.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No recent trips</p>
          ) : (
            <div className="space-y-3">
              {recentTrips.map((trip) => (
                <div
                  key={trip._id}
                  className="flex items-center justify-between p-3 bg-app-bg/50 border border-ui-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      trip.status === 'ongoing' ? 'bg-green-500' : 'bg-content-secondary'
                    }`} />
                    <div>
                      <div className="text-sm font-medium text-content-primary">
                        {typeof trip.routeId === 'object'
                          ? (trip.routeId as { name: string }).name
                          : 'Unknown Route'}
                      </div>
                      <div className="text-xs text-content-secondary">
                        {typeof trip.driverId === 'object'
                          ? (trip.driverId as { name: string }).name
                          : 'Unknown Driver'}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    trip.status === 'ongoing'
                      ? 'bg-green-50 text-green-600 font-medium'
                      : 'bg-app-bg text-content-secondary border border-ui-border'
                  }`}>
                    {trip.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/admin/users" className="card shadow-sm hover:border-primary/30 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <span className="font-semibold text-content-primary">Manage Users</span>
            </div>
            <ChevronRight className="w-5 h-5 text-content-secondary/40 group-hover:text-primary transition-colors" />
          </div>
        </Link>
        <Link to="/admin/routes" className="card shadow-sm hover:border-primary/30 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <RouteIcon className="w-5 h-5 text-primary" />
              </div>
              <span className="font-semibold text-content-primary">Manage Routes</span>
            </div>
            <ChevronRight className="w-5 h-5 text-content-secondary/40 group-hover:text-primary transition-colors" />
          </div>
        </Link>
        <Link to="/admin/buses" className="card shadow-sm hover:border-primary/30 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Bus className="w-5 h-5 text-primary" />
              </div>
              <span className="font-semibold text-content-primary">Manage Buses</span>
            </div>
            <ChevronRight className="w-5 h-5 text-content-secondary/40 group-hover:text-primary transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  subValue?: string;
  color: 'primary' | 'green' | 'amber' | 'accent';
  link?: string;
}

function StatCard({ icon: Icon, label, value, subValue, color, link }: StatCardProps) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    accent: 'bg-primary/10 text-primary',
  };

  const content = (
    <div className={`card shadow-sm ${link ? 'hover:border-primary/30 transition-all' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {link && <ChevronRight className="w-5 h-5 text-content-secondary/40" />}
      </div>
      <div className="text-3xl font-bold text-content-primary mb-1">{value}</div>
      <div className="text-sm font-semibold text-content-secondary">{label}</div>
      {subValue && <div className="text-xs text-content-secondary/70 mt-1">{subValue}</div>}
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }
  return content;
}
