import { useEffect, useState, useRef } from "react";
import type { User, UserRole } from "@/types";
type Role = UserRole;
import UserAvatar from "@/components/ui/UserAvatar";
import { adminApi } from "@/services/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { Users, UserCheck, Clock, Loader2, Search, X, Trash2, ChevronDown, CheckCircle2, XCircle, Zap, ChevronLeft, ChevronRight } from "lucide-react";

const C = {
  indigo: "#6366f1", indigoBg: "#eef2ff",
  sky: "#0ea5e9", skyBg: "#f0f9ff",
  dark: "#0f172a", slate: "#64748b", light: "#94a3b8", border: "#e2e8f0",
} as const;

const ROLE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  admin:  { bg: C.indigoBg, color: C.indigo, label: "Admin" },
  driver: { bg: C.skyBg,    color: C.sky,    label: "Driver" },
  rider:  { bg: "#f1f5f9",  color: "#64748b", label: "Rider" },
};

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "rider",  label: "Rider" },
  { value: "driver", label: "Driver" },
  { value: "admin",  label: "Admin" },
];

export default function AdminManageUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [pending, setPending] = useState<User[]>([]);
  const [tab, setTab] = useState<"all" | "pending">("all");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isPendingLoading, setIsPendingLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [confirmApprove, setConfirmApprove] = useState<User | null>(null);
  const [confirmReject, setConfirmReject] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadUsers(); }, [page, search, roleFilter]);
  useEffect(() => { if (tab === "pending") loadPending(); }, [tab]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpenDropdown(null);
    };
    if (openDropdown) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openDropdown]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getUsers({ page, search, ...(roleFilter ? { role: roleFilter } : {}) });
      setUsers(res.data.data);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch { toast({ type: "error", message: "Failed to load users" }); }
    finally { setIsLoading(false); }
  };

  const loadPending = async () => {
    setIsPendingLoading(true);
    try {
      const res = await adminApi.getPendingDrivers();
      setPending(res.data.data);
    } catch { toast({ type: "error", message: "Failed to load pending drivers" }); }
    finally { setIsPendingLoading(false); }
  };

  const handleChangeRole = async (userId: string, role: Role) => {
    setOpenDropdown(null);
    setActionLoading(userId);
    try {
      await adminApi.changeUserRole(userId, role);
      toast({ type: "success", message: "Role updated" });
      loadUsers();
    } catch { toast({ type: "error", message: "Failed to change role" }); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(confirmDelete._id);
    try {
      await adminApi.deleteUser(confirmDelete._id);
      toast({ type: "success", message: `${confirmDelete.name} removed` });
      setConfirmDelete(null); loadUsers();
    } catch { toast({ type: "error", message: "Failed to delete user" }); }
    finally { setActionLoading(null); }
  };

  const handleApprove = async () => {
    if (!confirmApprove) return;
    setActionLoading(confirmApprove._id);
    try {
      await adminApi.approveDriver(confirmApprove._id);
      toast({ type: "success", message: `${confirmApprove.name} approved` });
      setConfirmApprove(null); loadPending();
    } catch { toast({ type: "error", message: "Failed to approve" }); }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!confirmReject) return;
    setActionLoading(confirmReject._id);
    try {
      await adminApi.rejectDriver(confirmReject._id);
      toast({ type: "success", message: `${confirmReject.name} rejected` });
      setConfirmReject(null); loadPending();
    } catch { toast({ type: "error", message: "Failed to reject" }); }
    finally { setActionLoading(null); }
  };

  const adminCount = users.filter(u => u.role === "admin").length;
  const driverCount = users.filter(u => u.role === "driver").length;
  const riderCount  = users.filter(u => u.role === "rider").length;

  return (
    <>
      {/* ── Dark analytics header ── */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f2a4a 100%)", borderRadius: 18, padding: "24px 28px", marginBottom: 18, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Zap size={16} color="#818cf8" />
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em" }}>User Management</span>
            </div>
            <div style={{ display: "flex", gap: 36 }}>
              {[
                { value: users.length, label: "Loaded", color: "#e2e8f0" },
                { value: driverCount, label: "Drivers", color: C.sky },
                { value: riderCount,  label: "Riders",  color: "#a5b4fc" },
                { value: pending.length, label: "Pending", color: "#fb923c" },
              ].map(({ value, label, color }) => (
                <div key={label}>
                  <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", color, lineHeight: 1, marginBottom: 3, fontVariantNumeric: "tabular-nums" }}>{value}</div>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          {pending.length > 0 && (
            <button onClick={() => setTab("pending")} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", background: "rgba(251,146,60,0.15)", border: "1px solid rgba(251,146,60,0.35)", borderRadius: 10, color: "#fb923c", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              <Clock size={13} />{pending.length} pending approval
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs + content ── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
        {/* Tabs */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", padding: "0 8px 0 8px" }}>
          <div style={{ display: "flex" }}>
            {([{ value: "all", label: "All Users" }, { value: "pending", label: "Pending Approval" }] as const).map(({ value, label }) => {
              const cnt = value === "pending" ? pending.length : 0;
              const active = tab === value;
              return (
                <button key={value} onClick={() => setTab(value)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "13px 16px", fontSize: 13.5, fontWeight: 600, border: "none", background: "none", cursor: "pointer", color: active ? C.indigo : "#94a3b8", borderBottom: active ? `2px solid ${C.indigo}` : "2px solid transparent", marginBottom: -1, transition: "color .15s" }}>
                  {label}
                  {cnt > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "#f97316", color: "#fff" }}>{cnt}</span>}
                </button>
              );
            })}
          </div>
          {tab === "all" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 9, background: "#f8fafc", overflow: "hidden" }}>
                <Search size={14} color="#94a3b8" style={{ marginLeft: 10 }} />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search users…" style={{ border: "none", outline: "none", padding: "8px 10px", fontSize: 13.5, background: "transparent", color: C.dark, width: 180 }} />
                {search && <button onClick={() => { setSearch(""); setPage(1); }} style={{ padding: "0 8px", border: "none", background: "none", cursor: "pointer", color: "#94a3b8" }}><X size={13} /></button>}
              </div>
              <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={{ border: "1px solid #e2e8f0", borderRadius: 9, padding: "8px 10px", fontSize: 13, background: "#f8fafc", color: C.dark, outline: "none" }}>
                <option value="">All roles</option>
                <option value="rider">Riders</option>
                <option value="driver">Drivers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          )}
        </div>

        {/* All Users table */}
        {tab === "all" && (
          isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
              <Loader2 size={22} style={{ color: C.indigo }} className="animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 40px", color: "#94a3b8" }}>
              <Users size={26} style={{ opacity: 0.2, marginBottom: 10 }} />
              <p style={{ fontSize: 13.5, color: "#64748b", margin: 0 }}>No users found</p>
            </div>
          ) : (
            <div ref={dropdownRef}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    {["User", "Role", "Status", "Joined", ""].map(h => (
                      <th key={h} style={{ padding: "10px 18px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => {
                    const rs = ROLE_STYLE[user.role] || ROLE_STYLE.rider;
                    return (
                      <tr key={user._id} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: i < users.length - 1 ? "1px solid #f8fafc" : "none" }}>
                        <td style={{ padding: "13px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                            <UserAvatar user={user} size={32} />
                            <div>
                              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.dark }}>{user.name}</div>
                              <div style={{ fontSize: 12, color: "#94a3b8" }}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "13px 18px" }}>
                          <div style={{ position: "relative", display: "inline-block" }}>
                            <button onClick={() => setOpenDropdown(openDropdown === user._id ? null : user._id)} disabled={user.role === "admin" || actionLoading === user._id} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, border: "none", cursor: user.role === "admin" ? "default" : "pointer", background: rs.bg, color: rs.color }}>
                              {actionLoading === user._id ? <Loader2 size={11} className="animate-spin" /> : rs.label}
                              {user.role !== "admin" && <ChevronDown size={11} />}
                            </button>
                            {openDropdown === user._id && (
                              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", minWidth: 130, overflow: "hidden" }}>
                                {ROLE_OPTIONS.map(opt => (
                                  <button key={opt.value} onClick={() => handleChangeRole(user._id, opt.value as Role)} style={{ width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 13, border: "none", background: "none", cursor: "pointer", color: user.role === opt.value ? C.indigo : C.dark, fontWeight: user.role === opt.value ? 700 : 400 }} onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "13px 18px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 99, background: user.isApproved ? "#f0fdf4" : "#fef9c3", color: user.isApproved ? "#16a34a" : "#ca8a04" }}>
                            {user.isApproved ? <><CheckCircle2 size={11} />Active</> : <><Clock size={11} />Pending</>}
                          </span>
                        </td>
                        <td style={{ padding: "13px 18px", fontSize: 12.5, color: "#94a3b8", whiteSpace: "nowrap" }}>
                          {new Date(user.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td style={{ padding: "13px 18px" }}>
                          <button onClick={() => setConfirmDelete(user)} title="Delete" style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8" }} onMouseEnter={e => (e.currentTarget.style.background = "#fee2e2", e.currentTarget.style.color = "#ef4444")} onMouseLeave={e => (e.currentTarget.style.background = "transparent", e.currentTarget.style.color = "#94a3b8")}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid #f1f5f9" }}>
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0", borderRadius: 8, background: page <= 1 ? "#f8fafc" : "#fff", cursor: page <= 1 ? "default" : "pointer", color: "#64748b" }}><ChevronLeft size={14} /></button>
                  <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Page {page} of {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0", borderRadius: 8, background: page >= totalPages ? "#f8fafc" : "#fff", cursor: page >= totalPages ? "default" : "pointer", color: "#64748b" }}><ChevronRight size={14} /></button>
                </div>
              )}
            </div>
          )
        )}

        {/* Pending Approval */}
        {tab === "pending" && (
          isPendingLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
              <Loader2 size={22} style={{ color: C.indigo }} className="animate-spin" />
            </div>
          ) : pending.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 40px" }}>
              <CheckCircle2 size={26} color={C.sky} style={{ opacity: 0.4, marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#64748b", margin: "0 0 4px" }}>All caught up!</p>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>No drivers pending approval</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14, padding: 16 }}>
              {pending.map(user => (
                <div key={user._id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px", borderTop: `3px solid ${C.sky}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <UserAvatar user={user} size={44} />
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: C.dark }}>{user.name}</div>
                      <div style={{ fontSize: 12.5, color: "#94a3b8" }}>{user.email}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>Applied</span>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: "#64748b" }}>
                      {new Date(user.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setConfirmApprove(user)} disabled={actionLoading === user._id} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 8, cursor: "pointer", background: C.indigo, color: "#fff", opacity: actionLoading === user._id ? 0.6 : 1 }}>
                      {actionLoading === user._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}Approve
                    </button>
                    <button onClick={() => setConfirmReject(user)} disabled={actionLoading === user._id} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", fontSize: 13, fontWeight: 600, border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", background: "#fff", color: "#64748b", opacity: actionLoading === user._id ? 0.6 : 1 }} onMouseEnter={e => (e.currentTarget.style.background = "#fee2e2", e.currentTarget.style.borderColor = "#fca5a5", e.currentTarget.style.color = "#ef4444")} onMouseLeave={e => (e.currentTarget.style.background = "#fff", e.currentTarget.style.borderColor = "#e2e8f0", e.currentTarget.style.color = "#64748b")}>
                      <XCircle size={14} />Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title={`Delete ${confirmDelete?.name}?`} description="This action cannot be undone." confirmLabel="Delete" variant="danger" />
      <ConfirmDialog open={!!confirmApprove} onClose={() => setConfirmApprove(null)} onConfirm={handleApprove} title={`Approve ${confirmApprove?.name}?`} description="This driver will be granted access to the platform." confirmLabel="Approve" />
      <ConfirmDialog open={!!confirmReject} onClose={() => setConfirmReject(null)} onConfirm={handleReject} title={`Reject ${confirmReject?.name}?`} description="Their driver application will be denied." confirmLabel="Reject" variant="danger" />
    </>
  );
}
