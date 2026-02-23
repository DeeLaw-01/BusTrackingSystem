import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bus, Route as RouteIcon, Navigation, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { tripsApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { socketService } from '@/services/socket'
import type { Bus as BusType, Trip } from '@/types'

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
      console.log('Trip ended event received:', data);
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
      console.error('Failed to load data:', error);
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

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Decorative Bus Silhouette */}
      <img 
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/The_Red_Metro_Bus_in_Blue_Area.jpg/1280px-The_Red_Metro_Bus_in_Blue_Area.jpg" 
        alt="" 
        className="absolute top-1/2 right-[-100px] w-[500px] opacity-[0.02] pointer-events-none select-none z-0 rotate-12" 
      />

      <div className="max-w-4xl mx-auto p-4 relative z-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-content-primary mb-2">
          Driver Dashboard
        </h1>
        <p className="text-content-secondary">
          Welcome back, {user?.name}
        </p>
      </div>

      {/* No Bus Assigned */}
      {!assignedBus && (
        <div className="card bg-amber-50 border-amber-200 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-600 mb-1">No Bus Assigned</h3>
              <p className="text-content-secondary text-sm">
                You don't have a bus assigned to you yet. Please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Bus */}
      {assignedBus && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
            <Bus className="w-5 h-5 text-primary" />
            Your Assigned Bus
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-app-bg rounded-lg border border-ui-border">
              <div className="text-sm text-content-secondary mb-1">Bus Name</div>
              <div className="text-lg font-semibold text-content-primary">{assignedBus.name}</div>
            </div>
            <div className="p-4 bg-app-bg rounded-lg border border-ui-border">
              <div className="text-sm text-content-secondary mb-1">Plate Number</div>
              <div className="text-lg font-semibold text-content-primary">{assignedBus.plateNumber}</div>
            </div>
            <div className="p-4 bg-app-bg rounded-lg border border-ui-border">
              <div className="text-sm text-content-secondary mb-1">Capacity</div>
              <div className="text-lg font-semibold text-content-primary">{assignedBus.capacity} seats</div>
            </div>
            <div className="p-4 bg-app-bg rounded-lg border border-ui-border">
              <div className="text-sm text-content-secondary mb-1">Route</div>
              <div className="text-lg font-semibold text-content-primary flex items-center gap-2">
                <RouteIcon className="w-4 h-4 text-primary" />
                {typeof assignedBus.routeId === 'object' 
                  ? (assignedBus.routeId as { name: string }).name 
                  : 'Not assigned'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Trip / Start Trip */}
      {assignedBus && (
        <div className="card mb-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          {currentTrip ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium text-green-600">Trip in Progress</span>
                </div>
                <p className="text-content-secondary">
                  You have an active trip. Continue broadcasting your location.
                </p>
              </div>
              <Link to="/driver/trip" className="btn btn-coral">
                <Navigation className="w-5 h-5" />
                View Trip
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-content-primary mb-1">Ready to start?</h3>
                <p className="text-content-secondary">
                  Begin your trip to start sharing your location with riders.
                </p>
              </div>
              <Link to="/driver/trip" className="btn btn-coral">
                <Navigation className="w-5 h-5" />
                Start Trip
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Recent Trips */}
      <div className="card">
        <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Recent Trips
        </h2>

        {recentTrips.length === 0 ? (
          <p className="text-content-secondary text-center py-8">No trips yet</p>
        ) : (
          <div className="space-y-3">
            {recentTrips.map((trip) => (
              <div
                key={trip._id}
                className="flex items-center justify-between p-3 bg-app-bg/50 border border-ui-border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    trip.status === 'ongoing' ? 'bg-green-500' : 'bg-slate-500'
                  }`} />
                  <div>
                    <div className="text-sm font-medium text-content-primary">
                      {typeof trip.routeId === 'object' 
                        ? (trip.routeId as { name: string }).name 
                        : 'Unknown Route'}
                    </div>
                    <div className="text-xs text-content-secondary">
                      {new Date(trip.startTime).toLocaleDateString()} at{' '}
                      {new Date(trip.startTime).toLocaleTimeString()}
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
    </div>
  );
}
