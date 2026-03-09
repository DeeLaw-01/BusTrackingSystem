import { useNavigate } from "react-router-dom";
import { Mail, Phone, Shield, Calendar, Check, Pencil, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import UserAvatar from "@/components/ui/UserAvatar";

const C = {
  indigo: "#6366f1",
  sky: "#0ea5e9",
  dark: "#0f172a",
  slate: "#475569",
  light: "#94a3b8",
  border: "#e2e8f0",
} as const;

const CSS = `
  .mya-root { min-height: 100vh; background: #f5f7fa; }

  .mya-header {
    position: sticky; top: 0; z-index: 20;
    background: #fff; border-bottom: 1px solid #e8edf2;
    display: flex; align-items: center; gap: 12px;
    padding: 0 16px; height: 56px;
  }
  .mya-back-btn {
    width: 34px; height: 34px; border-radius: 10px;
    border: 1px solid #e2e8f0; background: #f8fafc;
    cursor: pointer; color: ${C.slate};
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .mya-header-title { font-size: 15px; font-weight: 700; color: ${C.dark}; }

  .mya-body { padding: 16px 16px 48px; }

  .mya-profile-card {
    background: #fff; border-radius: 22px; overflow: hidden;
    box-shadow: 0 4px 28px rgba(0,0,0,0.09); border: 1px solid #e8edf2;
    margin-bottom: 16px;
  }
  .mya-hero {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #0f2a4a 100%);
    padding: 36px 24px 28px;
    display: flex; flex-direction: column; align-items: center; text-align: center;
  }
  .mya-avatar-wrap { position: relative; margin-bottom: 16px; }
  .mya-online-dot {
    position: absolute; bottom: 2px; right: 2px;
    width: 16px; height: 16px; border-radius: 50%;
    background: #22c55e; border: 2.5px solid #1e1b4b;
    box-shadow: 0 0 8px rgba(34,197,94,0.7);
  }
  .mya-hero-name {
    font-size: 21px; font-weight: 800; color: #f1f5f9;
    letter-spacing: -0.02em; margin: 0 0 6px;
  }
  .mya-hero-email { font-size: 13px; color: #64748b; margin: 0 0 12px; }
  .mya-hero-badge {
    display: inline-block; font-size: 11px; font-weight: 700;
    padding: 4px 14px; border-radius: 99px;
    background: rgba(99,102,241,0.22); color: #a5b4fc;
    text-transform: capitalize; letter-spacing: 0.05em;
  }
  .mya-edit-btn {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 15px 0; background: ${C.indigo}; border: none; cursor: pointer;
    color: #fff; font-size: 14px; font-weight: 700; letter-spacing: 0.01em;
    transition: opacity 0.15s;
  }
  .mya-edit-btn:hover { opacity: 0.88; }

  .mya-details-card {
    background: #fff; border-radius: 22px; padding: 22px 22px 10px;
    box-shadow: 0 4px 28px rgba(0,0,0,0.09); border: 1px solid #e8edf2;
  }
  .mya-section-label {
    font-size: 11px; font-weight: 700; color: ${C.light};
    text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 8px;
  }
  .mya-info-row {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 0; border-bottom: 1px solid #f8fafc;
  }
  .mya-info-row:last-child { border-bottom: none; }
  .mya-info-icon {
    width: 40px; height: 40px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .mya-info-label {
    font-size: 11px; color: ${C.light}; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px;
  }
  .mya-info-value {
    font-size: 14px; font-weight: 500; color: ${C.dark};
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .mya-verified { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 600; color: #16a34a; }
  .mya-unverified { font-size: 13px; font-weight: 600; color: #f59e0b; }

  @media (min-width: 768px) {
    .mya-header { height: 64px; padding: 0 32px; }
    .mya-header-title { font-size: 17px; }
    .mya-body {
      max-width: 1080px; margin: 0 auto;
      padding: 40px 32px 72px;
      display: grid; grid-template-columns: 300px 1fr; gap: 24px; align-items: start;
    }
    .mya-profile-card { margin-bottom: 0; }
    .mya-hero { padding: 44px 28px 34px; }
    .mya-hero-name { font-size: 23px; }
    .mya-details-card { padding: 26px 26px 14px; }
    .mya-info-grid { display: grid; grid-template-columns: 1fr 1fr; }
    .mya-info-row { border-bottom: 1px solid #f8fafc; padding: 16px 0; }
    .mya-info-row:nth-child(odd) { padding-right: 22px; border-right: 1px solid #f8fafc; }
    .mya-info-row:nth-child(even) { padding-left: 22px; }
    .mya-info-row:nth-last-child(-n+2) { border-bottom: none; }
  }

  @media (min-width: 1200px) {
    .mya-body { max-width: 1200px; grid-template-columns: 340px 1fr; }
  }
`;

function InfoRow({
  icon: Icon,
  label,
  value,
  accent,
  children,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  accent: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mya-info-row">
      <div className="mya-info-icon" style={{ background: `${accent}18` }}>
        <Icon size={16} color={accent} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mya-info-label">{label}</div>
        {children ?? <div className="mya-info-value">{value || "—"}</div>}
      </div>
    </div>
  );
}

export default function MyAccount() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="mya-root">
      <style>{CSS}</style>

      <header className="mya-header">
        <button onClick={() => navigate(-1)} className="mya-back-btn">
          <ArrowLeft size={16} />
        </button>
        <span className="mya-header-title">My Account</span>
      </header>

      <div className="mya-body">
        {/* ── Left: Profile card ── */}
        <div className="mya-profile-card">
          <div className="mya-hero">
            <div className="mya-avatar-wrap">
              <UserAvatar name={user?.name} avatar={user?.avatar} size="xl" />
              <span className="mya-online-dot" />
            </div>
            <h2 className="mya-hero-name">{user?.name || "User"}</h2>
            <p className="mya-hero-email">{user?.email}</p>
            <span className="mya-hero-badge">{user?.role || "Rider"}</span>
          </div>
          <button onClick={() => navigate("/settings")} className="mya-edit-btn">
            <Pencil size={15} />
            Edit Profile
          </button>
        </div>

        {/* ── Right: Account details ── */}
        <div className="mya-details-card">
          <p className="mya-section-label">Account Information</p>
          <div className="mya-info-grid">
            <InfoRow icon={Mail} label="Email Address" value={user?.email} accent={C.indigo} />
            <InfoRow icon={Phone} label="Phone Number" value={user?.phone || "Not added"} accent={C.sky} />
            <InfoRow icon={Calendar} label="Member Since" value={memberSince || "—"} accent="#f59e0b" />
            <InfoRow icon={Shield} label="Email Verification" accent={user?.isEmailVerified ? "#22c55e" : "#f59e0b"}>
              {user?.isEmailVerified ? (
                <span className="mya-verified">
                  <Check size={13} />
                  Verified
                </span>
              ) : (
                <span className="mya-unverified">Not Verified</span>
              )}
            </InfoRow>
          </div>
        </div>
      </div>
    </div>
  );
}

