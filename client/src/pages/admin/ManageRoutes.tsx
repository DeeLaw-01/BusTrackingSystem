import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Route as RouteIcon,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Map,
  MapPin,
} from "lucide-react";
import { routesApi, stopsApi } from "@/services/api";
import type { Route, Stop } from "@/types";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

export default function ManageRoutes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [selectedRouteForStop, setSelectedRouteForStop] = useState<string | null>(null);
  const [confirmDeleteRoute, setConfirmDeleteRoute] = useState<Route | null>(null);
  const [confirmDeleteStop, setConfirmDeleteStop] = useState<Stop | null>(null);

  useEffect(() => { loadRoutes(); }, []);

  const loadRoutes = async () => {
    try {
      const { data } = await routesApi.getAll();
      setRoutes(data.data);
    } catch {
      toast("Failed to load routes", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="page-header">
          <div>
            <h1 className="page-title">Manage Routes</h1>
            <p className="page-subtitle">Create and manage bus routes and stops</p>
          </div>
          <button
            onClick={() => { setEditingRoute(null); setShowRouteModal(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Route
          </button>
        </div>

        {routes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center py-16 text-center">
            <RouteIcon className="w-12 h-12 text-gray-200 mb-4" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">No Routes Yet</h3>
            <p className="text-sm text-gray-400 mb-5">Create your first route to get started</p>
            <button onClick={() => setShowRouteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
              <Plus className="w-4 h-4" />
              Create Route
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {routes.map((route) => (
              <div key={route._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Route header */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedRoute(expandedRoute === route._id ? null : route._id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <RouteIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{route.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {route.stops?.length || 0} stop{route.stops?.length !== 1 ? "s" : ""}{" "}
                        <span className="mx-1">·</span>
                        <span className={route.isActive ? "text-gray-600 font-medium" : "text-gray-400"}>
                          {route.isActive ? "Active" : "Inactive"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/routes/builder/${route._id}`); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Open Route Builder">
                      <Map className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingRoute(route); setShowRouteModal(true); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteRoute(route); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {expandedRoute === route._id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 ml-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
                    )}
                  </div>
                </div>

                {/* Expanded stops */}
                {expandedRoute === route._id && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stops</h4>
                      <button
                        onClick={() => { setSelectedRouteForStop(route._id); setEditingStop(null); setShowStopModal(true); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Stop
                      </button>
                    </div>
                    {!route.stops || route.stops.length === 0 ? (
                      <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
                        <MapPin className="w-4 h-4" />
                        No stops added yet
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {route.stops.map((stop, index) => (
                          <div key={stop._id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-gray-200">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                {index + 1}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-800">{stop.name}</div>
                                <div className="text-xs text-gray-400">{stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setSelectedRouteForStop(route._id); setEditingStop(stop); setShowStopModal(true); }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setConfirmDeleteStop(stop)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Route Dialog */}
      <Dialog
        open={showRouteModal}
        onClose={() => setShowRouteModal(false)}
        title={editingRoute ? "Edit Route" : "Create Route"}
        description={editingRoute ? "Update route name and settings." : "Add a new bus route."}
      >
        <RouteForm
          route={editingRoute}
          onClose={() => setShowRouteModal(false)}
          onSuccess={() => {
            setShowRouteModal(false);
            loadRoutes();
            toast(editingRoute ? "Route updated" : "Route created", "success");
          }}
        />
      </Dialog>

      {/* Stop Dialog */}
      <Dialog
        open={showStopModal}
        onClose={() => setShowStopModal(false)}
        title={editingStop ? "Edit Stop" : "Add Stop"}
        description="Enter the stop name and GPS coordinates."
      >
        {selectedRouteForStop && (
          <StopForm
            routeId={selectedRouteForStop}
            stop={editingStop}
            existingStopsCount={routes.find((r) => r._id === selectedRouteForStop)?.stops?.length || 0}
            onClose={() => setShowStopModal(false)}
            onSuccess={() => {
              setShowStopModal(false);
              loadRoutes();
              toast(editingStop ? "Stop updated" : "Stop added", "success");
            }}
          />
        )}
      </Dialog>

      {/* Confirm delete route */}
      <ConfirmDialog
        open={!!confirmDeleteRoute}
        onClose={() => setConfirmDeleteRoute(null)}
        onConfirm={async () => { await routesApi.delete(confirmDeleteRoute!._id); toast("Route deleted", "success"); loadRoutes(); }}
        title="Delete route?"
        description={`"${confirmDeleteRoute?.name}" and all its stops will be permanently deleted.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Confirm delete stop */}
      <ConfirmDialog
        open={!!confirmDeleteStop}
        onClose={() => setConfirmDeleteStop(null)}
        onConfirm={async () => { await stopsApi.delete(confirmDeleteStop!._id); toast("Stop deleted", "success"); loadRoutes(); }}
        title="Delete stop?"
        description={`"${confirmDeleteStop?.name}" will be permanently removed from this route.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}

const fieldClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition";
const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

function RouteForm({ route, onClose, onSuccess }: { route: Route | null; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(route?.name || "");
  const [description, setDescription] = useState(route?.description || "");
  const [isActive, setIsActive] = useState(route?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (route) {
        await routesApi.update(route._id, { name, description, isActive });
      } else {
        await routesApi.create({ name, description });
      }
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label className={labelClass}>Route Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          className={fieldClass} placeholder="e.g., DHA Phase 5 - Model Town" required />
      </div>
      <div>
        <label className={labelClass}>Description (Optional)</label>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
          className={fieldClass} placeholder="e.g., Morning route via main boulevard" />
      </div>
      {route && (
        <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <input type="checkbox" id="routeActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 accent-gray-900" />
          <label htmlFor="routeActive" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
            Route is active
          </label>
        </div>
      )}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button type="button" onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-colors">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {route ? "Update" : "Create Route"}
        </button>
      </div>
    </form>
  );
}

function StopForm({ routeId, stop, existingStopsCount, onClose, onSuccess }: {
  routeId: string; stop: Stop | null; existingStopsCount: number; onClose: () => void; onSuccess: () => void;
}) {
  const [name, setName] = useState(stop?.name || "");
  const [latitude, setLatitude] = useState(stop?.latitude?.toString() || "");
  const [longitude, setLongitude] = useState(stop?.longitude?.toString() || "");
  const [sequence, setSequence] = useState(stop?.sequence?.toString() || existingStopsCount.toString());
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (stop) {
        await stopsApi.update(stop._id, { name, latitude: parseFloat(latitude), longitude: parseFloat(longitude), sequence: parseInt(sequence) });
      } else {
        await stopsApi.create({ name, latitude: parseFloat(latitude), longitude: parseFloat(longitude), sequence: parseInt(sequence), routeId });
      }
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label className={labelClass}>Stop Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          className={fieldClass} placeholder="e.g., Main Gate" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Latitude</label>
          <input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)}
            className={fieldClass} placeholder="31.5204" required />
        </div>
        <div>
          <label className={labelClass}>Longitude</label>
          <input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)}
            className={fieldClass} placeholder="74.3587" required />
        </div>
      </div>
      <div>
        <label className={labelClass}>Sequence (Order)</label>
        <input type="number" min="0" value={sequence} onChange={(e) => setSequence(e.target.value)}
          className={fieldClass} required />
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button type="button" onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-colors">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {stop ? "Update Stop" : "Add Stop"}
        </button>
      </div>
    </form>
  );
}
