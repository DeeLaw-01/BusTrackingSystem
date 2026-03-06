import { useEffect, useState } from "react";
import { busesApi, routesApi, adminApi } from "@/services/api";
import type { Bus, Route } from "@/types";
import { Bus as BusIcon, Plus, Edit2, Trash2, User, MapPin, Loader2, Zap } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

const C = {
  indigo: "#6366f1", indigoDark: "#4f46e5", indigoBg: "#eef2ff",
  sky: "#0ea5e9", skyBg: "#f0f9ff",
  dark: "#0f172a", slate: "#64748b", light: "#94a3b8", border: "#e2e8f0",
} as const;

interface Driver { _id: string; name: string; email: string; }

interface BusFormData {
  name: string; plateNumber: string; capacity: number;
  routeId: string; driverId: string; isActive: boolean;
}

export default function AdminManageBuses() {
  const { toast } = useToast();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [editBus, setEditBus] = useState<Bus | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [busRes, routeRes, driverRes] = await Promise.all([
        busesApi.getAll(),
        routesApi.getAll(),
        adminApi.getUsers({ role: "driver", approved: true }),
      ]);
      setBuses(busRes.data.data);
      setRoutes(routeRes.data.data);
      setDrivers(driverRes.data.data);
    } catch { toast({ type: "error", message: "Failed to load fleet data" }); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (data: BusFormData) => {
    setIsSubmitting(true);
    try {
      if (editBus) {
        await busesApi.update(editBus._id, { name: data.name, plateNumber: data.plateNumber, capacity: data.capacity, isActive: data.isActive });
        await busesApi.assignRoute(editBus._id, data.routeId || null);
        await busesApi.assignDriver(editBus._id, data.driverId || null);
        toast({ type: "success", message: "Bus updated" });
      } else {
        await busesApi.create({ name: data.name, plateNumber: data.plateNumber, capacity: data.capacity, routeId: data.routeId || undefined, driverId: data.driverId || undefined });
        toast({ type: "success", message: "Bus added to fleet" });
      }
      setIsDialogOpen(false); setEditBus(null); loadData();
    } catch { toast({ type: "error", message: "Failed to save bus" }); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await busesApi.delete(confirmDeleteId);
      toast({ type: "success", message: "Bus removed" });
      setConfirmDeleteId(null); loadData();
    } catch { toast({ type: "error", message: "Failed to delete" }); }
  };

  const handleToggleActive = async (bus: Bus) => {
    try {
      await busesApi.update(bus._id, { isActive: !bus.isActive });
      loadData();
    } catch { toast({ type: "error", message: "Failed to update status" }); }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256, gap: 10 }}>
      <Loader2 size={22} style={{ color: C.indigo }} className="animate-spin" />
      <span style={{ fontSize: 13, color: C.slate }}>Loading fleet…</span>
    </div>
  );

  const activeBuses = buses.filter(b => b.isActive);
  const assignedBuses = buses.filter(b => b.driverId);
  const fleetPct = buses.length > 0 ? activeBuses.length / buses.length : 0;

  return (
    <>
      {/* ── Dark analytics header ── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f2a4a 100%)",
        borderRadius: 18, padding: "24px 28px", marginBottom: 18, color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Zap size={16} color="#818cf8" />
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em" }}>Fleet Management</span>
            </div>
            <div style={{ display: "flex", gap: 40 }}>
              {[
                { value: buses.length, label: "Total", color: "#e2e8f0" },
                { value: activeBuses.length, label: "Active", color: C.sky },
                { value: assignedBuses.length, label: "Assigned", color: "#a5b4fc" },
                { value: buses.length - assignedBuses.length, label: "Unassigned", color: "#64748b" },
              ].map(({ value, label, color }) => (
                <div key={label}>
                  <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", color, lineHeight: 1, marginBottom: 3, fontVariantNumeric: "tabular-nums" }}>{value}</div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => { setEditBus(null); setIsDialogOpen(true); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", background: C.indigo, color: "#fff", border: "none", borderRadius: 11, fontSize: 13.5, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
          >
            <Plus size={16} /> Add Bus
          </button>
        </div>
        {/* Fleet utilization bar */}
        {buses.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>FLEET UTILIZATION</span>
              <span style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 700 }}>{Math.round(fleetPct * 100)}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)" }}>
              <div style={{ height: "100%", borderRadius: 3, width: `${fleetPct * 100}%`, background: `linear-gradient(90deg, ${C.indigo}, ${C.sky})`, transition: "width 0.5s ease" }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Empty state ── */}
      {buses.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 40px", textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: C.indigoBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <BusIcon size={26} color={C.indigo} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: "0 0 8px" }}>No buses in fleet</h3>
          <p style={{ fontSize: 13.5, color: C.light, margin: "0 0 22px", maxWidth: 280 }}>Add your first bus to start managing your transit fleet.</p>
          <button onClick={() => { setEditBus(null); setIsDialogOpen(true); }} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px", background: C.indigo, color: "#fff", border: "none", borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={15} /> Add First Bus
          </button>
        </div>
      ) : (
        /* ── Bus table ── */
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["Bus", "Route", "Driver", "Capacity", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "11px 18px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {buses.map((bus, i) => {
                const routeObj = bus.routeId && typeof bus.routeId === "object" ? bus.routeId as { name: string } : null;
                const routeName = routeObj?.name ?? routes.find(r => r._id === bus.routeId)?.name;
                const driverObj = bus.driverId && typeof bus.driverId === "object" ? bus.driverId as { name: string } : null;
                const driverName = driverObj?.name ?? drivers.find(d => d._id === bus.driverId)?.name;
                return (
                  <tr key={bus._id} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: i < buses.length - 1 ? "1px solid #f8fafc" : "none" }}>
                    {/* Bus name */}
                    <td style={{ padding: "13px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: bus.isActive ? C.indigoBg : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <BusIcon size={15} color={bus.isActive ? C.indigo : "#94a3b8"} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: C.dark }}>{bus.name}</div>
                          <div style={{ fontSize: 11.5, color: "#94a3b8", fontFamily: "monospace", letterSpacing: "0.05em" }}>{bus.plateNumber}</div>
                        </div>
                      </div>
                    </td>
                    {/* Route */}
                    <td style={{ padding: "13px 18px" }}>
                      {routeName ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: C.skyBg, color: C.sky }}>
                          <MapPin size={10} />{routeName}
                        </span>
                      ) : <span style={{ fontSize: 12.5, color: "#94a3b8" }}>—</span>}
                    </td>
                    {/* Driver */}
                    <td style={{ padding: "13px 18px" }}>
                      {driverName ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.indigoBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <User size={11} color={C.indigo} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: C.dark }}>{driverName}</span>
                        </div>
                      ) : <span style={{ fontSize: 12.5, color: "#94a3b8" }}>Unassigned</span>}
                    </td>
                    {/* Capacity bar */}
                    <td style={{ padding: "13px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, height: 5, borderRadius: 3, background: "#f1f5f9", overflow: "hidden", flexShrink: 0 }}>
                          <div style={{ height: "100%", width: `${Math.min((bus.capacity / 60) * 100, 100)}%`, background: `linear-gradient(90deg, ${C.indigo}, ${C.sky})`, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.slate, whiteSpace: "nowrap" }}>{bus.capacity} seats</span>
                      </div>
                    </td>
                    {/* Status */}
                    <td style={{ padding: "13px 18px" }}>
                      <button
                        onClick={() => handleToggleActive(bus)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "4px 12px", fontSize: 12, fontWeight: 600, border: "none", borderRadius: 99, cursor: "pointer",
                          background: bus.isActive ? C.indigoBg : "#f1f5f9",
                          color: bus.isActive ? C.indigo : "#94a3b8",
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: bus.isActive ? C.indigo : "#cbd5e1", boxShadow: bus.isActive ? `0 0 4px ${C.indigo}` : "none" }} />
                        {bus.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    {/* Actions */}
                    <td style={{ padding: "13px 18px" }}>
                      <div style={{ display: "flex", gap: 3, justifyContent: "flex-end" }}>
                        <button onClick={() => { setEditBus(bus); setIsDialogOpen(true); }} className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors" style={{ color: "#94a3b8", background: "transparent", border: "none", cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.background = C.indigoBg, e.currentTarget.style.color = C.indigo)} onMouseLeave={e => (e.currentTarget.style.background = "transparent", e.currentTarget.style.color = "#94a3b8")}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setConfirmDeleteId(bus._id)} className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors" style={{ color: "#94a3b8", background: "transparent", border: "none", cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.background = "#fee2e2", e.currentTarget.style.color = "#ef4444")} onMouseLeave={e => (e.currentTarget.style.background = "transparent", e.currentTarget.style.color = "#94a3b8")}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Dialog ── */}
      <Dialog open={isDialogOpen} onClose={() => { setIsDialogOpen(false); setEditBus(null); }} title={editBus ? "Edit Bus" : "Add New Bus"}>
        <BusForm key={editBus?._id || "new"} bus={editBus} routes={routes} drivers={drivers} onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={() => { setIsDialogOpen(false); setEditBus(null); }} />
      </Dialog>

      <ConfirmDialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} onConfirm={handleDelete} title="Remove bus?" description="This bus will be permanently removed." confirmLabel="Remove" variant="danger" />
    </>
  );
}

/* ─── BusForm ─── */
interface BusFormProps {
  bus: Bus | null; routes: Route[];
  drivers: { _id: string; name: string; email: string }[];
  onSubmit: (data: BusFormData) => void;
  isSubmitting: boolean; onCancel: () => void;
}

function BusForm({ bus, routes, drivers, onSubmit, isSubmitting, onCancel }: BusFormProps) {
  const [form, setForm] = useState<BusFormData>({
    name: bus?.name || "",
    plateNumber: bus?.plateNumber || "",
    capacity: bus?.capacity || 40,
    routeId: (bus?.routeId && typeof bus.routeId === "object" ? (bus.routeId as { _id: string })._id : bus?.routeId as string) || "",
    driverId: (bus?.driverId && typeof bus.driverId === "object" ? (bus.driverId as { _id: string })._id : bus?.driverId as string) || "",
    isActive: bus?.isActive ?? true,
  });

  const fld: React.CSSProperties = { width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid #e2e8f0", borderRadius: 9, outline: "none", color: C.dark, background: "#fff", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: C.slate, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" };

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lbl}>Bus Name</label>
          <input style={fld} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bus 01" required />
        </div>
        <div>
          <label style={lbl}>Plate Number</label>
          <input style={fld} value={form.plateNumber} onChange={e => setForm({ ...form, plateNumber: e.target.value })} placeholder="e.g. LEA-1234" required />
        </div>
      </div>
      <div>
        <label style={lbl}>Capacity (seats)</label>
        <input type="number" style={fld} value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })} min={1} required />
      </div>
      <div>
        <label style={lbl}>Assign Route</label>
        <select style={fld} value={form.routeId} onChange={e => setForm({ ...form, routeId: e.target.value })}>
          <option value="">No route</option>
          {routes.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
        </select>
      </div>
      <div>
        <label style={lbl}>Assign Driver</label>
        <select style={fld} value={form.driverId} onChange={e => setForm({ ...form, driverId: e.target.value })}>
          <option value="">No driver</option>
          {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13.5, color: C.slate, fontWeight: 500 }}>
        <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} style={{ width: 16, height: 16, accentColor: C.indigo }} />
        Bus is active and operational
      </label>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
        <button type="button" onClick={onCancel} style={{ padding: "9px 18px", fontSize: 13.5, fontWeight: 600, color: C.slate, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 9, cursor: "pointer" }}>Cancel</button>
        <button type="submit" disabled={isSubmitting} style={{ padding: "9px 18px", fontSize: 13.5, fontWeight: 600, color: "#fff", background: C.indigo, border: "none", borderRadius: 9, cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1 }}>
          {isSubmitting ? "Saving…" : bus ? "Save Changes" : "Add Bus"}
        </button>
      </div>
    </form>
  );
}
