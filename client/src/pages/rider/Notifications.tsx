import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Smartphone, Mail, Loader2, Check, Bell } from "lucide-react";

const C = {
  indigo: "#6366f1",
  sky: "#0ea5e9",
  dark: "#0f172a",
  slate: "#475569",
  light: "#94a3b8",
  border: "#e2e8f0",
} as const;

const CSS = `
  .ntf-root { min-height: 100vh; background: #f5f7fa; }

  .ntf-header {
    position: sticky; top: 0; z-index: 20;
    background: #fff; border-bottom: 1px solid #e8edf2;
    display: flex; align-items: center; gap: 12px;
    padding: 0 16px; height: 56px;
  }
  .ntf-back-btn {
    width: 34px; height: 34px; border-radius: 10px;
    border: 1px solid #e2e8f0; background: #f8fafc;
    cursor: pointer; color: ${C.slate};
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ntf-header-title { font-size: 15px; font-weight: 700; color: ${C.dark}; }

  .ntf-hero {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #0f2a4a 100%);
    padding: 28px 20px 42px;
  }
  .ntf-hero-inner { }
  .ntf-hero-icons { display: flex; gap: 10px; margin-bottom: 16px; }
  .ntf-hero-icon {
    width: 46px; height: 46px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
  }
  .ntf-hero-title {
    font-size: 22px; font-weight: 800; color: #f1f5f9;
    letter-spacing: -0.03em; margin: 0 0 7px;
  }
  .ntf-hero-sub { font-size: 13px; color: #64748b; margin: 0; line-height: 1.5; }

  .ntf-body { padding: 0 16px; margin-top: -20px; padding-bottom: 48px; }
  .ntf-grid { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }

  .ntf-card {
    background: #fff; border-radius: 22px;
    box-shadow: 0 4px 28px rgba(0,0,0,0.09); border: 1px solid #e8edf2;
    overflow: hidden;
  }
  .ntf-card-head {
    padding: 18px 20px 14px; border-bottom: 1px solid #f8fafc;
    display: flex; align-items: center; gap: 12px;
  }
  .ntf-card-icon {
    width: 42px; height: 42px; border-radius: 13px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ntf-card-title { font-size: 15px; font-weight: 700; color: ${C.dark}; margin-bottom: 2px; }
  .ntf-card-sub { font-size: 12px; color: ${C.light}; }
  .ntf-card-body { padding: 4px 20px 10px; }

  .ntf-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 13px 0; border-bottom: 1px solid #f8fafc;
  }
  .ntf-row:last-child { border-bottom: none; }
  .ntf-row-info { flex: 1; min-width: 0; padding-right: 16px; }
  .ntf-row-title { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
  .ntf-row-desc { font-size: 12.5px; color: ${C.light}; }

  .ntf-toggle {
    width: 44px; height: 24px; border-radius: 99px; border: none;
    cursor: pointer; position: relative; transition: background .2s; flex-shrink: 0;
    padding: 0;
  }
  .ntf-toggle-knob {
    width: 18px; height: 18px; border-radius: 50%; background: #fff;
    position: absolute; top: 3px; transition: left .2s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }

  .ntf-actions { display: flex; justify-content: center; padding-bottom: 8px; }
  .ntf-save-btn {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px 0; border: none; border-radius: 14px;
    font-size: 14px; font-weight: 700; color: #fff;
    box-shadow: 0 4px 14px rgba(99,102,241,0.35); transition: background .2s, opacity .15s;
  }

  @media (min-width: 768px) {
    .ntf-header { height: 64px; padding: 0 32px; }
    .ntf-header-title { font-size: 17px; }
    .ntf-hero { padding: 40px 32px 52px; }
    .ntf-hero-inner { max-width: 840px; margin: 0 auto; }
    .ntf-body { max-width: 840px; margin: -20px auto 0; padding: 0 32px 64px; }
    .ntf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
    .ntf-save-btn { max-width: 340px; }
  }

  @media (min-width: 1200px) {
    .ntf-hero-inner, .ntf-body { max-width: 960px; }
  }
`;

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="ntf-toggle"
      style={{ background: on ? C.indigo : "#e2e8f0" }}
    >
      <div className="ntf-toggle-knob" style={{ left: on ? 23 : 3 }} />
    </button>
  );
}

function NtfRow({
  title,
  desc,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="ntf-row">
      <div className="ntf-row-info">
        <div className="ntf-row-title" style={{ color: disabled ? C.light : C.dark }}>
          {title}
        </div>
        <div className="ntf-row-desc">{desc}</div>
      </div>
      <Toggle on={checked} onChange={onChange} />
    </div>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    busApproaching: true,
    routeUpdates: true,
    systemAnnouncements: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggle = (key: keyof typeof settings) =>
    setSettings((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="ntf-root">
      <style>{CSS}</style>

      <header className="ntf-header">
        <button onClick={() => navigate(-1)} className="ntf-back-btn">
          <ArrowLeft size={16} />
        </button>
        <span className="ntf-header-title">Notifications</span>
      </header>

      <div className="ntf-hero">
        <div className="ntf-hero-inner">
          <div className="ntf-hero-icons">
            <div className="ntf-hero-icon" style={{ background: "rgba(99,102,241,0.22)" }}>
              <Bell size={21} color="#818cf8" />
            </div>
            <div className="ntf-hero-icon" style={{ background: "rgba(99,102,241,0.12)" }}>
              <Smartphone size={21} color="#a5b4fc" />
            </div>
            <div className="ntf-hero-icon" style={{ background: "rgba(14,165,233,0.18)" }}>
              <Mail size={21} color="#38bdf8" />
            </div>
          </div>
          <h1 className="ntf-hero-title">Alert Preferences</h1>
          <p className="ntf-hero-sub">
            Control when and how Safara keeps you in the loop.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="ntf-body">
        <div className="ntf-grid">
          <div className="ntf-card">
            <div className="ntf-card-head">
              <div className="ntf-card-icon" style={{ background: `${C.indigo}18` }}>
                <Smartphone size={19} color={C.indigo} />
              </div>
              <div>
                <div className="ntf-card-title">Push Notifications</div>
                <div className="ntf-card-sub">Real-time alerts on your device</div>
              </div>
            </div>
            <div className="ntf-card-body">
              <NtfRow
                title="Enable Push"
                desc="Receive real-time alerts on this device"
                checked={settings.pushNotifications}
                onChange={() => toggle("pushNotifications")}
              />
              <NtfRow
                title="Bus Approaching"
                desc="Notify when a bus nears your stop"
                checked={settings.busApproaching && settings.pushNotifications}
                onChange={() => toggle("busApproaching")}
                disabled={!settings.pushNotifications}
              />
              <NtfRow
                title="Route Updates"
                desc="Live delays and schedule changes"
                checked={settings.routeUpdates && settings.pushNotifications}
                onChange={() => toggle("routeUpdates")}
                disabled={!settings.pushNotifications}
              />
            </div>
          </div>

          <div className="ntf-card">
            <div className="ntf-card-head">
              <div className="ntf-card-icon" style={{ background: `${C.sky}18` }}>
                <Mail size={19} color={C.sky} />
              </div>
              <div>
                <div className="ntf-card-title">Email Notifications</div>
                <div className="ntf-card-sub">Updates delivered to your inbox</div>
              </div>
            </div>
            <div className="ntf-card-body">
              <NtfRow
                title="Enable Email Alerts"
                desc="Receive summaries and updates by email"
                checked={settings.emailNotifications}
                onChange={() => toggle("emailNotifications")}
              />
              <NtfRow
                title="System Announcements"
                desc="Platform news and service changes"
                checked={settings.systemAnnouncements}
                onChange={() => toggle("systemAnnouncements")}
              />
            </div>
          </div>
        </div>

        <div className="ntf-actions">
          <button
            type="submit"
            disabled={loading}
            className="ntf-save-btn"
            style={{
              background: success ? "#16a34a" : C.indigo,
              opacity: loading ? 0.8 : 1,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving…
              </>
            ) : success ? (
              <>
                <Check size={16} />
                Saved!
              </>
            ) : (
              "Save Preferences"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
