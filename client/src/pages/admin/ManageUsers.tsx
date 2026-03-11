import { useEffect, useState, useRef } from "react";
import "./admin.css";
import type { User, UserRole } from "@/types";
type Role = UserRole;
import UserAvatar from "@/components/ui/UserAvatar";
import { adminApi } from "@/services/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import {
  Users,
  Clock,
  Loader2,
  Search,
  X,
  Trash2,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Zap,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";

const C = {
  indigo: "#6366f1",
  indigoBg: "#eef2ff",
  sky: "#0ea5e9",
  skyBg: "#f0f9ff",
  dark: "#0f172a",
  slate: "#475569",
  light: "#94a3b8",
  border: "#e2e8f0",
} as const;

const ROLES: { value: string; label: string; color: string; bg: string }[] = [
  { value: "admin", label: "Admin", color: C.indigo, bg: C.indigoBg },
  { value: "driver", label: "Driver", color: C.sky, bg: C.skyBg },
  { value: "rider", label: "Rider", color: "#64748b", bg: "#f1f5f9" },
];

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#f1f5f9",
              flexShrink: 0,
            }}
          />
          <div>
            <div
              style={{
                height: 12,
                width: 130,
                borderRadius: 6,
                background: "#f1f5f9",
                marginBottom: 7,
              }}
            />
            <div
              style={{
                height: 10,
                width: 170,
                borderRadius: 6,
                background: "#f1f5f9",
              }}
            />
          </div>
        </div>
      </td>
      <td style={{ padding: "14px 18px" }}>
        <div
          style={{
            height: 24,
            width: 64,
            borderRadius: 99,
            background: "#f1f5f9",
          }}
        />
      </td>
      <td style={{ padding: "14px 18px" }}>
        <div
          style={{
            height: 24,
            width: 72,
            borderRadius: 99,
            background: "#f1f5f9",
          }}
        />
      </td>
      <td style={{ padding: "14px 18px" }}>
        <div
          style={{
            height: 12,
            width: 80,
            borderRadius: 6,
            background: "#f1f5f9",
          }}
        />
      </td>
      <td style={{ padding: "14px 18px" }}>
        <div
          style={{
            height: 28,
            width: 28,
            borderRadius: 8,
            background: "#f1f5f9",
          }}
        />
      </td>
    </tr>
  );
}

export default function AdminManageUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [pending, setPending] = useState<User[]>([]);
  const [tab, setTab] = useState<"all" | "pending">("all");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPendingLoading, setIsPendingLoading] = useState(true);
  const [openRoleDropdown, setOpenRoleDropdown] = useState<string | null>(null);
  const [openAction, setOpenAction] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [confirmApprove, setConfirmApprove] = useState<User | null>(null);
  const [confirmReject, setConfirmReject] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUsers();
  }, [page, search, roleFilter]);
  useEffect(() => {
    loadPending();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!tableRef.current?.contains(e.target as Node)) {
        setOpenRoleDropdown(null);
        setOpenAction(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getUsers({
        page,
        search,
        ...(roleFilter ? { role: roleFilter } : {}),
      });
      setUsers(res.data.data);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalCount(res.data.pagination?.total || 0);
    } catch {
      toast("Failed to load users", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPending = async () => {
    setIsPendingLoading(true);
    try {
      const res = await adminApi.getPendingDrivers();
      setPending(res.data.data);
    } catch {
      toast("Failed to load pending drivers", "error");
    } finally {
      setIsPendingLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, role: Role) => {
    setOpenRoleDropdown(null);
    setActionLoading(userId);
    try {
      await adminApi.changeUserRole(userId, role);
      toast("Role updated successfully", "success");
      loadUsers();
    } catch {
      toast("Failed to update role", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(confirmDelete._id);
    try {
      await adminApi.deleteUser(confirmDelete._id);
      toast(`${confirmDelete.name} removed`, "success");
      setConfirmDelete(null);
      loadUsers();
    } catch {
      toast("Failed to delete user", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async () => {
    if (!confirmApprove) return;
    setActionLoading(confirmApprove._id);
    try {
      await adminApi.approveDriver(confirmApprove._id);
      toast(`${confirmApprove.name} approved`, "success");
      setConfirmApprove(null);
      loadPending();
      loadUsers();
    } catch {
      toast("Failed to approve", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!confirmReject) return;
    setActionLoading(confirmReject._id);
    try {
      await adminApi.rejectDriver(confirmReject._id);
      toast(`${confirmReject.name} rejected`, "error");
      setConfirmReject(null);
      loadPending();
    } catch {
      toast("Failed to reject", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const driverCount = users.filter((u) => u.role === "driver").length;
  const riderCount = users.filter((u) => u.role === "rider").length;
  const PAGE_SIZE = 20;
  const startIdx = totalCount > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endIdx = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <>
      {/* ── Hero header ── */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f2a4a 100%)",
          borderRadius: 18,
          padding: "26px 28px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <Zap size={15} color="#818cf8" />
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#f1f5f9",
                letterSpacing: "-0.03em",
              }}
            >
              Team Members
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#475569", margin: "0 0 22px" }}>
            Manage users, roles, and access permissions across the platform.
          </p>
          <div style={{ display: "flex", gap: 34, flexWrap: "wrap" }}>
            {[
              {
                value: totalCount || users.length,
                label: "Total",
                color: "#e2e8f0",
              },
              { value: driverCount, label: "Drivers", color: C.sky },
              { value: riderCount, label: "Riders", color: "#a5b4fc" },
              { value: pending.length, label: "Pending", color: "#fb923c" },
            ].map(({ value, label, color }) => (
              <div key={label}>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    color,
                    lineHeight: 1,
                    marginBottom: 3,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#475569",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
        {pending.length > 0 && (
          <button
            onClick={() => setTab("pending")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              background: "rgba(251,146,60,0.12)",
              border: "1px solid rgba(251,146,60,0.3)",
              borderRadius: 12,
              color: "#fb923c",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Clock size={14} />
            {pending.length} awaiting approval
          </button>
        )}
      </div>

      {/* ── Main table card ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Tab + search bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #f1f5f9",
            padding: "0 6px",
            flexWrap: "wrap",
          }}
        >
          {/* Tabs */}
          <div style={{ display: "flex" }}>
            {(
              [
                { value: "all", label: "Members" },
                { value: "pending", label: "Awaiting Approval" },
              ] as const
            ).map(({ value, label }) => {
              const active = tab === value;
              const cnt = value === "pending" ? pending.length : 0;
              return (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "13px 16px",
                    fontSize: 13.5,
                    fontWeight: 600,
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: active ? C.indigo : "#94a3b8",
                    borderBottom: active
                      ? `2px solid ${C.indigo}`
                      : "2px solid transparent",
                    marginBottom: -1,
                    transition: "color .15s",
                  }}
                >
                  {label}
                  {cnt > 0 && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 99,
                        background: "#f97316",
                        color: "#fff",
                      }}
                    >
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search + filter – only on members tab */}
          {tab === "all" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 0",
                marginLeft: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #e2e8f0",
                  borderRadius: 9,
                  background: "#f8fafc",
                  overflow: "hidden",
                }}
              >
                <Search
                  size={13}
                  color="#94a3b8"
                  style={{ marginLeft: 10, flexShrink: 0 }}
                />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search members…"
                  style={{
                    border: "none",
                    outline: "none",
                    padding: "8px 10px",
                    fontSize: 13,
                    background: "transparent",
                    color: C.dark,
                    width: 190,
                  }}
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    style={{
                      padding: "0 8px",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 9,
                  padding: "8px 12px",
                  fontSize: 13,
                  background: "#f8fafc",
                  color: roleFilter ? C.dark : "#94a3b8",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">All roles</option>
                <option value="rider">Riders</option>
                <option value="driver">Drivers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          )}
        </div>

        {/* ── Members table ── */}
        {tab === "all" && (
          <div ref={tableRef} style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  {["User", "Role", "Status", "Joined", ""].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 18px",
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: "#94a3b8",
                        textAlign: "left",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 7 }, (_, i) => <SkeletonRow key={i} />)
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: "60px 40px", textAlign: "center" }}
                    >
                      <Users
                        size={26}
                        style={{
                          opacity: 0.15,
                          display: "block",
                          margin: "0 auto 12px",
                        }}
                      />
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#64748b",
                          margin: "0 0 4px",
                        }}
                      >
                        No members found
                      </p>
                      <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                        Try adjusting filters or the search query
                      </p>
                    </td>
                  </tr>
                ) : (
                  users.map((user, i) => {
                    const roleInfo =
                      ROLES.find((r) => r.value === user.role) || ROLES[2];
                    return (
                      <tr
                        key={user._id}
                        className="hover:bg-slate-50 transition-colors"
                        style={{
                          borderBottom:
                            i < users.length - 1 ? "1px solid #f8fafc" : "none",
                        }}
                      >
                        {/* User */}
                        <td style={{ padding: "13px 18px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 11,
                            }}
                          >
                            <UserAvatar
                              name={user.name}
                              avatar={user.avatar}
                              size="sm"
                            />
                            <div>
                              <div
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: 600,
                                  color: C.dark,
                                  lineHeight: 1.3,
                                }}
                              >
                                {user.name}
                              </div>
                              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role – inline dropdown */}
                        <td style={{ padding: "13px 18px" }}>
                          <div
                            style={{
                              position: "relative",
                              display: "inline-block",
                            }}
                          >
                            <button
                              onClick={() =>
                                setOpenRoleDropdown(
                                  openRoleDropdown === user._id
                                    ? null
                                    : user._id,
                                )
                              }
                              disabled={
                                user.role === "admin" ||
                                actionLoading === user._id
                              }
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "4px 10px",
                                borderRadius: 99,
                                fontSize: 12,
                                fontWeight: 600,
                                border:
                                  user.role === "admin"
                                    ? "none"
                                    : "1px solid #e2e8f0",
                                cursor:
                                  user.role === "admin" ? "default" : "pointer",
                                background:
                                  user.role === "admin" ? C.indigoBg : "#fff",
                                color: roleInfo.color,
                                transition: "all .12s",
                              }}
                            >
                              {actionLoading === user._id ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                roleInfo.label
                              )}
                              {user.role !== "admin" && (
                                <ChevronDown size={10} />
                              )}
                            </button>

                            {openRoleDropdown === user._id && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "calc(100% + 6px)",
                                  left: 0,
                                  zIndex: 999,
                                  background: "#fff",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: 12,
                                  boxShadow: "0 10px 35px rgba(0,0,0,0.1)",
                                  minWidth: 140,
                                  overflow: "hidden",
                                  padding: "4px",
                                }}
                              >
                                {ROLES.map((opt) => (
                                  <button
                                    key={opt.value}
                                    onClick={() =>
                                      handleChangeRole(
                                        user._id,
                                        opt.value as Role,
                                      )
                                    }
                                    className="hover:bg-slate-50"
                                    style={{
                                      width: "100%",
                                      textAlign: "left",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "8px 12px",
                                      fontSize: 13,
                                      border: "none",
                                      background: "none",
                                      cursor: "pointer",
                                      borderRadius: 8,
                                      color:
                                        user.role === opt.value
                                          ? opt.color
                                          : C.dark,
                                      fontWeight:
                                        user.role === opt.value ? 700 : 400,
                                    }}
                                  >
                                    <span
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <span
                                        style={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: "50%",
                                          background: opt.color,
                                          flexShrink: 0,
                                        }}
                                      />
                                      {opt.label}
                                    </span>
                                    {user.role === opt.value && (
                                      <CheckCircle2
                                        size={13}
                                        color={opt.color}
                                      />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "13px 18px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              fontSize: 12,
                              fontWeight: 600,
                              padding: "3px 10px",
                              borderRadius: 99,
                              background: user.isApproved
                                ? "#f0fdf4"
                                : "#fffbeb",
                              color: user.isApproved ? "#16a34a" : "#b45309",
                            }}
                          >
                            {user.isApproved ? (
                              <>
                                <CheckCircle2 size={11} />
                                Active
                              </>
                            ) : (
                              <>
                                <Clock size={11} />
                                Pending
                              </>
                            )}
                          </span>
                        </td>

                        {/* Joined */}
                        <td
                          style={{
                            padding: "13px 18px",
                            fontSize: 12.5,
                            color: "#94a3b8",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {new Date(user.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </td>

                        {/* 3-dot actions */}
                        <td style={{ padding: "13px 18px" }}>
                          <div style={{ position: "relative" }}>
                            <button
                              onClick={() =>
                                setOpenAction(
                                  openAction === user._id ? null : user._id,
                                )
                              }
                              className="hover:bg-slate-100"
                              style={{
                                width: 30,
                                height: 30,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 8,
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                color: "#94a3b8",
                                transition: "all .12s",
                              }}
                            >
                              <MoreHorizontal size={15} />
                            </button>
                            {openAction === user._id && (
                              <div
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  top: "calc(100% + 4px)",
                                  zIndex: 999,
                                  background: "#fff",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: 10,
                                  boxShadow: "0 10px 35px rgba(0,0,0,0.1)",
                                  minWidth: 150,
                                  overflow: "hidden",
                                  padding: "4px",
                                }}
                              >
                                <button
                                  onClick={() => {
                                    setOpenAction(null);
                                    setConfirmDelete(user);
                                  }}
                                  className="hover:bg-red-50"
                                  style={{
                                    width: "100%",
                                    textAlign: "left",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "8px 12px",
                                    fontSize: 13,
                                    border: "none",
                                    background: "none",
                                    cursor: "pointer",
                                    color: "#ef4444",
                                    borderRadius: 8,
                                  }}
                                >
                                  <Trash2 size={13} /> Remove user
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination footer */}
            {!isLoading && users.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 18px",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <span style={{ fontSize: 13, color: "#94a3b8" }}>
                  {totalCount > 0
                    ? `Showing ${startIdx}–${endIdx} of ${totalCount} members`
                    : `${users.length} members`}
                </span>
                {totalPages > 1 && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      style={{
                        width: 30,
                        height: 30,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        background: "#fff",
                        cursor: page <= 1 ? "default" : "pointer",
                        color: "#64748b",
                        opacity: page <= 1 ? 0.4 : 1,
                      }}
                    >
                      <ChevronLeft size={13} />
                    </button>
                    {Array.from(
                      { length: Math.min(totalPages, 5) },
                      (_, i) => i + 1,
                    ).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        style={{
                          width: 30,
                          height: 30,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border:
                            page === pg
                              ? `1px solid ${C.indigo}`
                              : "1px solid #e2e8f0",
                          borderRadius: 8,
                          background: page === pg ? C.indigo : "#fff",
                          cursor: "pointer",
                          color: page === pg ? "#fff" : "#64748b",
                          fontSize: 12.5,
                          fontWeight: page === pg ? 700 : 400,
                        }}
                      >
                        {pg}
                      </button>
                    ))}
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      style={{
                        width: 30,
                        height: 30,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        background: "#fff",
                        cursor: page >= totalPages ? "default" : "pointer",
                        color: "#64748b",
                        opacity: page >= totalPages ? 0.4 : 1,
                      }}
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Pending Approval ── */}
        {tab === "pending" &&
          (isPendingLoading ? (
            <div
              style={{ display: "flex", justifyContent: "center", padding: 60 }}
            >
              <Loader2
                size={22}
                className="animate-spin"
                style={{ color: C.indigo }}
              />
            </div>
          ) : pending.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "60px 40px",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#f0fdf4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <CheckCircle2 size={24} color="#22c55e" />
              </div>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: C.dark,
                  margin: "0 0 6px",
                }}
              >
                All clear!
              </p>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                No drivers are awaiting approval
              </p>
            </div>
          ) : (
            <div style={{ padding: 20 }}>
              <p
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  marginBottom: 14,
                  fontWeight: 500,
                }}
              >
                {pending.length} driver application
                {pending.length > 1 ? "s" : ""} pending review
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 14,
                }}
              >
                {pending.map((user) => (
                  <div
                    key={user._id}
                    style={{
                      background: "#fafafa",
                      border: "1px solid #f1f5f9",
                      borderRadius: 14,
                      padding: "18px 20px",
                      borderLeft: `4px solid ${C.sky}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 13,
                        marginBottom: 12,
                      }}
                    >
                      <UserAvatar
                        name={user.name}
                        avatar={user.avatar}
                        size="md"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14.5,
                            fontWeight: 700,
                            color: C.dark,
                          }}
                        >
                          {user.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12.5,
                            color: "#94a3b8",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {user.email}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: 99,
                          background: C.skyBg,
                          color: C.sky,
                          flexShrink: 0,
                        }}
                      >
                        Driver
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        marginBottom: 14,
                      }}
                    >
                      Applied{" "}
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setConfirmApprove(user)}
                        disabled={actionLoading === user._id}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "9px 0",
                          fontSize: 13,
                          fontWeight: 600,
                          border: "none",
                          borderRadius: 9,
                          cursor: "pointer",
                          background: C.indigo,
                          color: "#fff",
                          opacity: actionLoading === user._id ? 0.6 : 1,
                        }}
                      >
                        {actionLoading === user._id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}{" "}
                        Approve
                      </button>
                      <button
                        onClick={() => setConfirmReject(user)}
                        disabled={actionLoading === user._id}
                        className="hover:bg-red-50 hover:border-red-200 hover:text-red-500"
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "9px 0",
                          fontSize: 13,
                          fontWeight: 600,
                          border: "1px solid #e2e8f0",
                          borderRadius: 9,
                          cursor: "pointer",
                          background: "#fff",
                          color: "#64748b",
                          opacity: actionLoading === user._id ? 0.6 : 1,
                          transition: "all .15s",
                        }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title={`Remove ${confirmDelete?.name}?`}
        description="This will permanently remove the user from the platform."
        confirmLabel="Remove"
        variant="danger"
      />
      <ConfirmDialog
        open={!!confirmApprove}
        onClose={() => setConfirmApprove(null)}
        onConfirm={handleApprove}
        title={`Approve ${confirmApprove?.name}?`}
        description="This driver will gain full platform access."
        confirmLabel="Approve"
      />
      <ConfirmDialog
        open={!!confirmReject}
        onClose={() => setConfirmReject(null)}
        onConfirm={handleReject}
        title={`Reject ${confirmReject?.name}?`}
        description="Their driver application will be denied."
        confirmLabel="Reject"
        variant="danger"
      />
    </>
  );
}
