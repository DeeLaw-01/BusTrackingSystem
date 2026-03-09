import { useEffect, useState } from "react";
import { adminApi } from "@/services/api";
import {
  Mail,
  RefreshCw,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  Zap,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

const C = {
  indigo: "#6366f1",
  indigoBg: "#eef2ff",
  sky: "#0ea5e9",
  skyBg: "#f0f9ff",
  dark: "#0f172a",
  slate: "#64748b",
  light: "#94a3b8",
  border: "#e2e8f0",
} as const;

interface Invitation {
  _id: string;
  email: string;
  status: "pending" | "accepted" | "revoked";
  invitedBy?: { name: string };
  createdAt: string;
  expiresAt: string;
}

const FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "revoked", label: "Revoked" },
];

function AcceptanceRing({
  accepted,
  total,
}: {
  accepted: number;
  total: number;
}) {
  const pct = total > 0 ? accepted / total : 0;
  const size = 80,
    stroke = 8;
  const cx = size / 2,
    cy = size / 2,
    r = cx - stroke / 2 - 1;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(Math.max(pct, 0), 1) * circ;
  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={stroke}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={C.sky}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1,
          }}
        >
          {Math.round(pct * 100)}%
        </div>
      </div>
    </div>
  );
}

export default function AdminManageInvitations() {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [filter, setFilter] = useState("");
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const res = await adminApi.listInvitations();
      setInvitations(res.data.data);
    } catch {
      toast({ type: "error", message: "Failed to load invitations" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSending(true);
    try {
      await adminApi.createInvitation(email.trim());
      toast({ type: "success", message: `Invitation sent to ${email.trim()}` });
      setEmail("");
      fetchInvitations();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast({ type: "error", message: msg || "Failed to send invitation" });
    } finally {
      setIsSending(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirmRevokeId) return;
    setRevokingId(confirmRevokeId);
    try {
      await adminApi.revokeInvitation(confirmRevokeId);
      toast({ type: "success", message: "Invitation revoked" });
      fetchInvitations();
    } catch {
      toast({ type: "error", message: "Failed to revoke" });
    } finally {
      setRevokingId(null);
      setConfirmRevokeId(null);
    }
  };

  const handleResend = async (id: string, recipientEmail: string) => {
    setResendingId(id);
    try {
      await adminApi.resendInvitation(id);
      toast({ type: "success", message: `Resent to ${recipientEmail}` });
      fetchInvitations();
    } catch {
      toast({ type: "error", message: "Failed to resend" });
    } finally {
      setResendingId(null);
    }
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const filtered = filter
    ? invitations.filter((i) => i.status === filter)
    : invitations;
  const counts = {
    pending: invitations.filter((i) => i.status === "pending").length,
    accepted: invitations.filter((i) => i.status === "accepted").length,
    revoked: invitations.filter((i) => i.status === "revoked").length,
  };
  const statusBadge = (status: Invitation["status"], expiresAt: string) => {
    if (status === "accepted")
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 99,
            background: C.indigoBg,
            color: C.indigo,
          }}
        >
          <CheckCircle2 size={11} />
          Accepted
        </span>
      );
    if (status === "revoked")
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 99,
            background: "#f1f5f9",
            color: "#94a3b8",
            textDecoration: "line-through",
          }}
        >
          <XCircle size={11} />
          Revoked
        </span>
      );
    if (isExpired(expiresAt))
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 99,
            background: "#fff7ed",
            color: "#f97316",
          }}
        >
          <Clock size={11} />
          Expired
        </span>
      );
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 12,
          fontWeight: 600,
          padding: "3px 10px",
          borderRadius: 99,
          background: C.skyBg,
          color: C.sky,
        }}
      >
        <Clock size={11} />
        Pending
      </span>
    );
  };

  return (
    <>
      {/* ── Dark analytics header ── */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f2a4a 100%)",
          borderRadius: 18,
          padding: "24px 28px",
          marginBottom: 18,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Zap size={16} color="#818cf8" />
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Invitations
            </span>
          </div>
          <div style={{ display: "flex", gap: 36 }}>
            {[
              {
                value: invitations.length,
                label: "Total Sent",
                color: "#e2e8f0",
              },
              { value: counts.pending, label: "Pending", color: C.sky },
              { value: counts.accepted, label: "Accepted", color: "#a5b4fc" },
              { value: counts.revoked, label: "Revoked", color: "#64748b" },
            ].map(({ value, label, color }) => (
              <div key={label}>
                <div
                  style={{
                    fontSize: 28,
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
                    color: "#64748b",
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <AcceptanceRing
            accepted={counts.accepted}
            total={invitations.length}
          />
          <span
            style={{
              fontSize: 10,
              color: "#64748b",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Acceptance
          </span>
        </div>
      </div>

      {/* ── Send invitation card ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: "22px 24px",
          marginBottom: 18,
          borderTop: `3px solid ${C.indigo}`,
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: C.dark,
              marginBottom: 3,
            }}
          >
            Send an invitation
          </div>
          <div style={{ fontSize: 13, color: C.light }}>
            Recipient will receive a registration link via email.
          </div>
        </div>
        <form
          onSubmit={handleSendInvitation}
          style={{ display: "flex", gap: 10 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flex: 1,
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              overflow: "hidden",
              background: "#f8fafc",
            }}
          >
            <div
              style={{
                padding: "0 13px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Mail size={15} color="#94a3b8" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              style={{
                flex: 1,
                padding: "11px 12px 11px 0",
                fontSize: 14,
                border: "none",
                outline: "none",
                color: C.dark,
                background: "transparent",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isSending || !email.trim()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "11px 20px",
              fontSize: 13.5,
              fontWeight: 600,
              color: "#fff",
              background: C.indigo,
              border: "none",
              borderRadius: 10,
              cursor: isSending || !email.trim() ? "not-allowed" : "pointer",
              opacity: isSending || !email.trim() ? 0.6 : 1,
              flexShrink: 0,
            }}
          >
            {isSending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            {isSending ? "Sending…" : "Send Invite"}
          </button>
        </form>
      </div>

      {/* ── Filter + table ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #f1f5f9",
            padding: "0 8px",
          }}
        >
          {FILTERS.map(({ value, label }) => {
            const cnt =
              value === ""
                ? invitations.length
                : ((counts as Record<string, number>)[value] ?? 0);
            const active = filter === value;
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "12px 14px",
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
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: "1px 7px",
                      borderRadius: 99,
                      background: active ? C.indigo : "#f1f5f9",
                      color: active ? "#fff" : "#64748b",
                    }}
                  >
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 60,
              gap: 10,
            }}
          >
            <Loader2
              size={22}
              style={{ color: C.indigo }}
              className="animate-spin"
            />
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 40px",
              color: "#94a3b8",
            }}
          >
            <Mail size={26} style={{ opacity: 0.2, marginBottom: 12 }} />
            <p
              style={{
                fontSize: 13.5,
                fontWeight: 500,
                color: "#64748b",
                margin: "0 0 4px",
              }}
            >
              {filter ? `No ${filter} invitations` : "No invitations yet"}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  {[
                    "Recipient",
                    "Status",
                    "Invited By",
                    "Sent",
                    "Expires",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 18px",
                        fontSize: 11,
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
                {filtered.map((inv, i) => (
                  <tr
                    key={inv._id}
                    className="hover:bg-slate-50 transition-colors"
                    style={{
                      borderBottom:
                        i < filtered.length - 1 ? "1px solid #f8fafc" : "none",
                    }}
                  >
                    <td style={{ padding: "13px 18px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: C.indigoBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Mail size={13} color={C.indigo} />
                        </div>
                        <span
                          style={{
                            fontSize: 13.5,
                            fontWeight: 500,
                            color: C.dark,
                          }}
                        >
                          {inv.email}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 18px" }}>
                      {statusBadge(inv.status, inv.expiresAt)}
                    </td>
                    <td
                      style={{
                        padding: "13px 18px",
                        fontSize: 13,
                        color: C.slate,
                      }}
                    >
                      {inv.invitedBy?.name || "—"}
                    </td>
                    <td
                      style={{
                        padding: "13px 18px",
                        fontSize: 12.5,
                        color: "#94a3b8",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(inv.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td
                      style={{
                        padding: "13px 18px",
                        fontSize: 12.5,
                        color: "#94a3b8",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(inv.expiresAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td style={{ padding: "13px 18px" }}>
                      {inv.status === "pending" && (
                        <div
                          style={{
                            display: "flex",
                            gap: 3,
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            onClick={() => handleResend(inv._id, inv.email)}
                            disabled={
                              resendingId === inv._id || revokingId === inv._id
                            }
                            title="Resend"
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
                            }}
                            onMouseEnter={(e) => (
                              (e.currentTarget.style.background = C.indigoBg),
                              (e.currentTarget.style.color = C.indigo)
                            )}
                            onMouseLeave={(e) => (
                              (e.currentTarget.style.background =
                                "transparent"),
                              (e.currentTarget.style.color = "#94a3b8")
                            )}
                          >
                            {resendingId === inv._id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <RefreshCw size={13} />
                            )}
                          </button>
                          <button
                            onClick={() => setConfirmRevokeId(inv._id)}
                            disabled={
                              resendingId === inv._id || revokingId === inv._id
                            }
                            title="Revoke"
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
                            }}
                            onMouseEnter={(e) => (
                              (e.currentTarget.style.background = "#fee2e2"),
                              (e.currentTarget.style.color = "#ef4444")
                            )}
                            onMouseLeave={(e) => (
                              (e.currentTarget.style.background =
                                "transparent"),
                              (e.currentTarget.style.color = "#94a3b8")
                            )}
                          >
                            {revokingId === inv._id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmRevokeId}
        onClose={() => setConfirmRevokeId(null)}
        onConfirm={handleRevoke}
        title="Revoke invitation?"
        description="This invitation link will be permanently revoked."
        confirmLabel="Revoke"
        variant="danger"
      />
    </>
  );
}
