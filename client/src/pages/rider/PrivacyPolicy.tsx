import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, FileText, MapPin } from "lucide-react";

const C = {
  indigo: "#6366f1",
  sky: "#0ea5e9",
  dark: "#0f172a",
  slate: "#475569",
  light: "#94a3b8",
} as const;

const SECTIONS = [
  {
    icon: Shield,
    color: C.indigo,
    title: "Data We Collect",
    text: "We collect your name, email, phone number, and when you actively use the tracking feature, your device location. No sensitive data is stored beyond what is needed.",
  },
  {
    icon: Lock,
    color: C.sky,
    title: "How We Protect It",
    text: "All personal data is encrypted in transit using TLS and at rest. We follow industry-standard security practices and perform regular audits to prevent unauthorised access.",
  },
  {
    icon: MapPin,
    color: "#f59e0b",
    title: "Location Data",
    text: "Your location is only accessed when you are actively using the tracking screen. It is never sold or shared with advertisers or third-party services.",
  },
  {
    icon: Eye,
    color: "#a855f7",
    title: "What We Share",
    text: "We do not sell your personal information. Aggregated, anonymised data may be used to improve the service. No individual user data is disclosed without legal obligation.",
  },
  {
    icon: FileText,
    color: "#10b981",
    title: "Your Rights",
    text: "You can view, update, or delete your account data any time from Settings. You may also opt out of location tracking by not granting location permission on your device.",
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      <style>{`
        @media (min-width: 768px) {
          .prv-hero-inner { max-width: 680px; margin: 0 auto; }
          .prv-content { display: flex; justify-content: center; }
          .prv-content-inner { width: 100%; max-width: 640px; }
        }
      `}</style>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          height: 56,
          background: "#fff",
          borderBottom: "1px solid #e8edf2",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 16px",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            cursor: "pointer",
            color: C.slate,
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>
          Privacy Policy
        </span>
      </header>

      <div
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f2a4a 100%)",
          padding: "24px 20px 36px",
        }}
      >
        <div className="prv-hero-inner">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: "rgba(99,102,241,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Shield size={22} color="#818cf8" />
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#f1f5f9",
              letterSpacing: "-0.03em",
              marginBottom: 6,
            }}
          >
            Your Privacy
          </div>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            Last updated March 2026. We take your privacy seriously.
          </div>
        </div>
      </div>

      <div
        className="prv-content"
        style={{ padding: "0 16px", marginTop: -14 }}
      >
        <div className="prv-content-inner">
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: "10px 18px 4px",
              marginBottom: 24,
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              border: "1px solid #e8edf2",
            }}
          >
            {SECTIONS.map(({ icon: Icon, color, title, text }, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "16px 0",
                  borderBottom:
                    i < SECTIONS.length - 1 ? "1px solid #f8fafc" : "none",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: `${color}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <Icon size={17} color={color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: C.dark,
                      marginBottom: 5,
                    }}
                  >
                    {title}
                  </div>
                  <div
                    style={{ fontSize: 13.5, color: C.slate, lineHeight: 1.65 }}
                  >
                    {text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
