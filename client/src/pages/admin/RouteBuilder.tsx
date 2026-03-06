import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  ArrowLeft,
  GripVertical,
  Trash2,
  Loader2,
  Route as RouteIcon,
  MapPin,
  Navigation,
  Lock,
  Pencil,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Clock,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { routesApi, stopsApi } from "@/services/api";
import type { Route, Stop } from "@/types";

// â”€â”€â”€ Stop marker icon factory â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function createStopIcon(index: number, isFirst: boolean, isLast: boolean) {
  const color = isFirst ? "#22c55e" : isLast ? "#ef4444" : "#0ea5e9";
  return L.divIcon({
    className: "custom-stop-marker",
    html: `
      <div style="
        width: 32px; height: 32px; border-radius: 50%;
        background: ${color}; color: white;
        display: flex; align-items: center; justify-content: center;
        font-weight: 700; font-size: 14px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">${index + 1}</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// â”€â”€â”€ Map click handler component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
  disabled: boolean;
}

function MapClickHandler({ onMapClick, disabled }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      if (!disabled) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// â”€â”€â”€ Draggable map marker for stops â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface DraggableStopMarkerProps {
  stop: Stop;
  index: number;
  totalStops: number;
  draggable: boolean;
  onDragEnd: (stopId: string, lat: number, lng: number) => void;
}

function DraggableStopMarker({
  stop,
  index,
  totalStops,
  draggable,
  onDragEnd,
}: DraggableStopMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const pos = marker.getLatLng();
          onDragEnd(stop._id, pos.lat, pos.lng);
        }
      },
    }),
    [stop._id, onDragEnd],
  );

  return (
    <Marker
      ref={markerRef}
      position={[stop.latitude, stop.longitude]}
      icon={createStopIcon(index, index === 0, index === totalStops - 1)}
      draggable={draggable}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <div className="text-xs">
          <div className="font-semibold text-slate-800">{stop.name}</div>
          <div className="text-slate-500">
            Stop #{index + 1}
            {draggable && " â€¢ Drag to reposition"}
          </div>
          {stop.estimatedArrivalTime && (
            <div className="text-slate-400 mt-0.5">
              ETA: {stop.estimatedArrivalTime}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

// â”€â”€â”€ Sortable stop item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SortableStopProps {
  stop: Stop;
  index: number;
  totalStops: number;
  isLocked: boolean;
  editingStopId: string | null;
  editingStopName: string;
  onStartEdit: (stop: Stop) => void;
  onSaveEdit: (stopId: string) => void;
  onCancelEdit: () => void;
  onEditNameChange: (name: string) => void;
  onDelete: (stopId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onTimeChange: (stopId: string, time: string) => void;
}

function SortableStop({
  stop,
  index,
  totalStops,
  isLocked,
  editingStopId,
  editingStopName,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditNameChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onTimeChange,
}: SortableStopProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop._id, disabled: isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const isFirst = index === 0;
  const isLast = index === totalStops - 1;
  const isEditing = editingStopId === stop._id;
  const markerColor = isFirst
    ? "bg-gray-900"
    : isLast
      ? "bg-gray-500"
      : "bg-gray-400";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 p-3 rounded-xl border transition-colors ${
        isDragging
          ? "bg-white border-gray-400 shadow-lg"
          : "bg-white border-slate-200 hover:border-gray-300 shadow-sm"
      }`}
    >
      {/* Drag handle */}
      {!isLocked && (
        <button
          {...attributes}
          {...listeners}
          className="btn btn-icon btn-sm text-slate-400 cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      {/* Number badge */}
      <div
        className={`mt-0.5 w-7 h-7 rounded-full ${markerColor} flex items-center justify-center text-xs font-bold text-white shrink-0`}
      >
        {index + 1}
      </div>

      {/* Stop info */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1 mb-1">
            <input
              type="text"
              value={editingStopName}
              onChange={(e) => onEditNameChange(e.target.value)}
              className="input text-sm py-1 h-8 flex-1"
              autoFocus
              title="Stop name"
              placeholder="Enter stop name"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEdit(stop._id);
                if (e.key === "Escape") onCancelEdit();
              }}
            />
            <button
              onClick={() => onSaveEdit(stop._id)}
              className="btn btn-icon btn-sm text-gray-700 hover:bg-gray-100"
              title="Save"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onCancelEdit}
              className="btn btn-icon btn-sm text-red-500 hover:bg-red-50"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-slate-900 truncate">
              {stop.name}
            </span>
            {!isLocked && (
              <button
                onClick={() => onStartEdit(stop)}
                className="btn btn-icon btn-sm text-slate-400 hover:text-gray-700 shrink-0"
                title="Rename stop"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
        <div className="text-xs text-slate-400">
          {stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}
        </div>

        {/* Estimated time */}
        <div className="flex items-center gap-2 mt-1.5">
          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
          <label
            className="text-xs text-slate-400 sr-only"
            htmlFor={`time-${stop._id}`}
          >
            Estimated arrival time
          </label>
          <input
            id={`time-${stop._id}`}
            type="time"
            value={stop.estimatedArrivalTime || ""}
            onChange={(e) => onTimeChange(stop._id, e.target.value)}
            disabled={isLocked}
            className="text-xs border border-gray-200 rounded-lg px-2 py-0.5 h-6 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Estimated arrival time"
            placeholder="HH:MM"
          />
        </div>
      </div>

      {/* Actions */}
      {!isLocked && (
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <button
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="btn btn-icon btn-sm disabled:opacity-30"
            title="Move up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={index === totalStops - 1}
            className="btn btn-icon btn-sm disabled:opacity-30"
            title="Move down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(stop._id)}
            className="btn btn-icon btn-sm text-red-500 hover:bg-red-50"
            title="Delete stop"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ Main RouteBuilder Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function RouteBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);

  // State
  const [route, setRoute] = useState<Route | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");
  const [addingStop, setAddingStop] = useState(false);
  const [generatingPath, setGeneratingPath] = useState(false);
  const [savingReorder, setSavingReorder] = useState(false);
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [editingStopName, setEditingStopName] = useState("");
  const [pathInfo, setPathInfo] = useState<{
    distance: number;
    duration: number;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Toast helper
  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  // â”€â”€â”€ Load route data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const loadRoute = useCallback(async () => {
    if (!id) return;
    try {
      const [routeRes, editRes] = await Promise.all([
        routesApi.getById(id),
        routesApi.canEdit(id),
      ]);

      const routeData = routeRes.data.data as Route;
      setRoute(routeData);
      setStops(
        (routeData.stops || [])
          .slice()
          .sort((a: Stop, b: Stop) => a.sequence - b.sequence),
      );
      if (routeData.path) {
        setRoutePath(routeData.path);
      }

      const editData = editRes.data.data as {
        canEdit: boolean;
        activeTrips: number;
        message: string;
      };
      setIsLocked(!editData.canEdit);
      setLockMessage(editData.message);
    } catch (error) {
      console.error("Failed to load route:", error);
      showToast("Failed to load route", "error");
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    loadRoute();
  }, [loadRoute]);

  // â”€â”€â”€ Map click â†’ add stop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      if (!id || isLocked || addingStop) return;
      setAddingStop(true);

      try {
        // Reverse geocode
        let stopName = `Stop ${stops.length + 1}`;
        try {
          const geoRes = await routesApi.reverseGeocode(lat, lng);
          if (geoRes.data?.data?.name) {
            stopName = geoRes.data.data.name;
          }
        } catch {
          // Fallback name is fine
        }

        // Create stop
        const sequence = stops.length;
        const res = await stopsApi.create({
          name: stopName,
          latitude: lat,
          longitude: lng,
          sequence,
          routeId: id,
        });

        const newStop = res.data.data as Stop;
        setStops((prev) => [...prev, newStop]);
        showToast(`Added stop: ${stopName}`);
      } catch (error) {
        console.error("Failed to add stop:", error);
        showToast("Failed to add stop", "error");
      } finally {
        setAddingStop(false);
      }
    },
    [id, isLocked, addingStop, stops.length, showToast],
  );

  // â”€â”€â”€ Delete stop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleDeleteStop = useCallback(
    async (stopId: string) => {
      try {
        await stopsApi.delete(stopId);
        const remaining = stops
          .filter((s) => s._id !== stopId)
          .map((s, i) => ({ ...s, sequence: i }));
        setStops(remaining);

        // Reorder remaining stops on server
        if (remaining.length > 0) {
          await stopsApi.reorder(
            remaining.map((s) => ({ id: s._id, sequence: s.sequence })),
          );
        }

        // Clear path since stops changed
        setRoutePath([]);
        setPathInfo(null);
        showToast("Stop deleted");
      } catch (error) {
        console.error("Failed to delete stop:", error);
        showToast("Failed to delete stop", "error");
      }
    },
    [stops, showToast],
  );

  // â”€â”€â”€ Rename stop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleStartEdit = useCallback((stop: Stop) => {
    setEditingStopId(stop._id);
    setEditingStopName(stop.name);
  }, []);

  const handleSaveEdit = useCallback(
    async (stopId: string) => {
      if (!editingStopName.trim()) return;
      try {
        await stopsApi.update(stopId, { name: editingStopName.trim() });
        setStops((prev) =>
          prev.map((s) =>
            s._id === stopId ? { ...s, name: editingStopName.trim() } : s,
          ),
        );
        setEditingStopId(null);
        showToast("Stop renamed");
      } catch (error) {
        console.error("Failed to rename stop:", error);
        showToast("Failed to rename stop", "error");
      }
    },
    [editingStopName, showToast],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingStopId(null);
    setEditingStopName("");
  }, []);

  // â”€â”€â”€ Update estimated time â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleTimeChange = useCallback(async (stopId: string, time: string) => {
    setStops((prev) =>
      prev.map((s) =>
        s._id === stopId ? { ...s, estimatedArrivalTime: time } : s,
      ),
    );
    try {
      await stopsApi.update(stopId, { estimatedArrivalTime: time });
    } catch {
      // Silently handle â€” time is mostly for display
    }
  }, []);

  // â”€â”€â”€ Drag-and-drop reorder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = stops.findIndex((s) => s._id === active.id);
      const newIndex = stops.findIndex((s) => s._id === over.id);

      const reordered = arrayMove(stops, oldIndex, newIndex).map((s, i) => ({
        ...s,
        sequence: i,
      }));

      setStops(reordered);
      setRoutePath([]); // Clear path since order changed
      setPathInfo(null);

      // Persist reorder to server
      setSavingReorder(true);
      try {
        await stopsApi.reorder(
          reordered.map((s) => ({ id: s._id, sequence: s.sequence })),
        );
      } catch (error) {
        console.error("Failed to reorder stops:", error);
        showToast("Failed to save reorder", "error");
      } finally {
        setSavingReorder(false);
      }
    },
    [stops, showToast],
  );

  // â”€â”€â”€ Move up/down â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleMoveUp = useCallback(
    async (index: number) => {
      if (index === 0) return;
      const reordered = arrayMove(stops, index, index - 1).map((s, i) => ({
        ...s,
        sequence: i,
      }));
      setStops(reordered);
      setRoutePath([]);
      setPathInfo(null);

      try {
        await stopsApi.reorder(
          reordered.map((s) => ({ id: s._id, sequence: s.sequence })),
        );
      } catch (error) {
        console.error("Failed to reorder:", error);
      }
    },
    [stops],
  );

  const handleMoveDown = useCallback(
    async (index: number) => {
      if (index >= stops.length - 1) return;
      const reordered = arrayMove(stops, index, index + 1).map((s, i) => ({
        ...s,
        sequence: i,
      }));
      setStops(reordered);
      setRoutePath([]);
      setPathInfo(null);

      try {
        await stopsApi.reorder(
          reordered.map((s) => ({ id: s._id, sequence: s.sequence })),
        );
      } catch (error) {
        console.error("Failed to reorder:", error);
      }
    },
    [stops],
  );

  // â”€â”€â”€ Drag marker to reposition stop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleMarkerDrag = useCallback(
    async (stopId: string, lat: number, lng: number) => {
      // Optimistic update
      setStops((prev) =>
        prev.map((s) =>
          s._id === stopId ? { ...s, latitude: lat, longitude: lng } : s,
        ),
      );
      // Clear path since stops moved
      setRoutePath([]);
      setPathInfo(null);

      try {
        await stopsApi.update(stopId, { latitude: lat, longitude: lng });
      } catch (error) {
        console.error("Failed to update stop position:", error);
        showToast("Failed to update stop position", "error");
        // Reload to revert
        loadRoute();
      }
    },
    [showToast, loadRoute],
  );

  // â”€â”€â”€ Generate route path (OSRM) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleGeneratePath = useCallback(async () => {
    if (!id || stops.length < 2) return;
    setGeneratingPath(true);
    try {
      const res = await routesApi.generatePath(id);
      const data = res.data.data as {
        path: [number, number][];
        distance: number;
        duration: number;
      };
      setRoutePath(data.path);
      setPathInfo({ distance: data.distance, duration: data.duration });
      showToast(`Path generated: ${data.distance} km, ~${data.duration} min`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      console.error("Failed to generate path:", error);
      showToast(
        err.response?.data?.error || "Failed to generate route path",
        "error",
      );
    } finally {
      setGeneratingPath(false);
    }
  }, [id, stops.length, showToast]);

  // â”€â”€â”€ Fit map to stops â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    if (mapRef.current && stops.length > 0) {
      const bounds = L.latLngBounds(
        stops.map((s) => [s.latitude, s.longitude] as [number, number]),
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [stops.length]); // Only re-fit when stops count changes

  // â”€â”€â”€ Loading state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-700" />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <RouteIcon className="w-7 h-7 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Route Not Found
        </h2>
        <button
          onClick={() => navigate("/admin/routes")}
          className="btn btn-secondary flex items-center gap-2 mt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Routes
        </button>
      </div>
    );
  }

  // â”€â”€â”€ Polyline for straight-line connection (before OSRM path) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const stopPositions: [number, number][] = stops.map((s) => [
    s.latitude,
    s.longitude,
  ]);

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/admin/routes")}
            className="btn btn-icon"
            title="Back to routes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900">Route Builder</h1>
            <p className="text-sm text-slate-500 truncate">{route.name}</p>
          </div>
        </div>

        {/* Path generation button */}
        <div className="flex items-center gap-3 shrink-0">
          {pathInfo && (
            <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg font-medium border border-slate-200">
              {pathInfo.distance} km &bull; ~{pathInfo.duration} min
            </span>
          )}
          <button
            onClick={handleGeneratePath}
            disabled={stops.length < 2 || generatingPath || isLocked}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-60"
            title="Generate route path using OSRM"
          >
            {generatingPath ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            Generate Path
          </button>
        </div>
      </div>

      {/* Lock banner */}
      {isLocked && (
        <div className="shrink-0 mx-6 mt-3 alert alert-warning flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-500 shrink-0" />
          <span className="text-sm text-gray-700">{lockMessage}</span>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-200 px-6 py-3 rounded-xl shadow-2xl text-sm font-bold transition-all border ${
            toast.type === "success"
              ? "bg-gray-900 text-white border-gray-700"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Main content: split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel â€” Stops list */}
        <div className="w-80 flex flex-col bg-white border-r border-slate-200 overflow-hidden shrink-0">
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <MapPin className="w-4 h-4 text-gray-700" />
                Stops ({stops.length})
              </h2>
              {savingReorder && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-600 ml-auto" />
              )}
            </div>
            {!isLocked && (
              <p className="text-xs text-slate-400 mt-1">
                Click on the map to add stops. Drag to reorder.
              </p>
            )}
          </div>

          {/* Stops list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {stops.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <MapPin className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">
                  {isLocked
                    ? "No stops on this route"
                    : "Click on the map to add your first stop"}
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stops.map((s) => s._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {stops.map((stop, index) => (
                    <SortableStop
                      key={stop._id}
                      stop={stop}
                      index={index}
                      totalStops={stops.length}
                      isLocked={isLocked}
                      editingStopId={editingStopId}
                      editingStopName={editingStopName}
                      onStartEdit={handleStartEdit}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onEditNameChange={setEditingStopName}
                      onDelete={handleDeleteStop}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onTimeChange={handleTimeChange}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Panel footer */}
          {stops.length >= 2 && !isLocked && (
            <div className="shrink-0 p-3 border-t border-slate-100">
              <button
                onClick={handleGeneratePath}
                disabled={generatingPath}
                className="btn btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {generatingPath ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                Generate Route Path
              </button>
            </div>
          )}
        </div>

        {/* Right â€” Map */}
        <div className="flex-1 relative overflow-hidden">
          {addingStop && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-500 flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-lg border border-slate-200">
              <Loader2 className="w-4 h-4 animate-spin text-gray-700" />
              <span className="text-sm font-medium text-slate-700">
                Adding stop...
              </span>
            </div>
          )}

          <div className="absolute inset-0">
            <MapContainer
              center={
                stops.length > 0
                  ? [stops[0].latitude, stops[0].longitude]
                  : [31.5204, 74.3587] // Default: Lahore
              }
              zoom={13}
              className="absolute inset-0 w-full h-full"
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapClickHandler
                onMapClick={handleMapClick}
                disabled={isLocked || addingStop}
              />

              {/* Stop markers (draggable when not locked) */}
              {stops.map((stop, index) => (
                <DraggableStopMarker
                  key={stop._id}
                  stop={stop}
                  index={index}
                  totalStops={stops.length}
                  draggable={!isLocked}
                  onDragEnd={handleMarkerDrag}
                />
              ))}

              {/* OSRM route path (road-following) */}
              {routePath.length > 0 && (
                <Polyline
                  positions={routePath}
                  color="#F23B3B"
                  weight={5}
                  opacity={0.8}
                />
              )}

              {/* Fallback: straight line connecting stops (shown when no OSRM path) */}
              {routePath.length === 0 && stopPositions.length >= 2 && (
                <Polyline
                  positions={stopPositions}
                  color="#94a3b8"
                  weight={2}
                  opacity={0.5}
                  dashArray="8 8"
                />
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
