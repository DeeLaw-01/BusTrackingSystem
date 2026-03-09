import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  HelpCircle,
  ChevronDown,
  Mail,
  MessageSquare,
} from "lucide-react";

const C = {
  indigo: "#6366f1",
  indigoBg: "#eef2ff",
  sky: "#0ea5e9",
  dark: "#0f172a",
  slate: "#475569",
  light: "#94a3b8",
} as const;

const FAQS = [
  {
    q: "How do I track a bus?",
    a: "Select a bus from the main dashboard, then tap Track This Bus to see the route and follow the bus in real-time on the map.",
  },
  {
    q: "How accurate is the bus location?",
    a: "Bus locations update in real-time via GPS with 10-20 metre accuracy, sourced directly from the drivers device.",
  },
  {
    q: "Can I set stop reminders?",
    a: "Yes! In tracking view, tap the bell icon next to any stop to get a push notification when the bus is 2-15 minutes away.",
  },
  {
    q: "What if I miss my bus?",
    a: "Head back to the main screen — other buses on the same route may still be running. Check the fleet list for live alternatives.",
  },
  {
    q: "How do I update my profile?",
    a: "Open the side menu and go to Settings. You can update your name, phone number, and profile picture from there.",
  },
];

export default function HelpSupport() {
  const navigate = useNavigate();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      <style>{`
        @media (min-width: 768px) {
          .hlp-hero-inner { max-width: 680px; margin: 0 auto; }
          .hlp-content { display: flex; justify-content: center; }
          .hlp-content-inner { width: 100%; max-width: 640px; }
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
          Help and Support
        </span>
      </header>

      <div
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f2a4a 100%)",
          padding: "24px 20px 36px",
        }}
      >
        <div className="hlp-hero-inner">
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
            <HelpCircle size={22} color="#818cf8" />
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
            How can we help?
          </div>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            Find answers to common questions below.
          </div>
        </div>
      </div>

      <div
        className="hlp-content"
        style={{ padding: "0 16px", marginTop: -14 }}
      >
        <div className="hlp-content-inner">
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              overflow: "hidden",
              marginBottom: 14,
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              border: "1px solid #e8edf2",
            }}
          >
            <div style={{ padding: "16px 18px 4px" }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.light,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 12,
                }}
              >
                Frequently Asked Questions
              </div>
            </div>
            {FAQS.map((faq, i) => {
              const open = openIdx === i;
              return (
                <div key={i} style={{ borderTop: "1px solid #f8fafc" }}>
                  <button
                    onClick={() => setOpenIdx(open ? null : i)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 18px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: open ? C.indigo : C.dark,
                        flex: 1,
                        paddingRight: 12,
                      }}
                    >
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={16}
                      color={open ? C.indigo : C.light}
                      style={{
                        flexShrink: 0,
                        transform: open ? "rotate(180deg)" : "none",
                        transition: "transform .2s",
                      }}
                    />
                  </button>
                  {open && (
                    <div
                      style={{
                        padding: "0 18px 16px 18px",
                        paddingTop: 12,
                        fontSize: 13.5,
                        color: C.slate,
                        lineHeight: 1.65,
                        borderTop: "1px solid #eef2ff",
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: 18,
              marginBottom: 24,
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              border: "1px solid #e8edf2",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.light,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 14,
              }}
            >
              Still need help?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a
                href="mailto:support@safara.app"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  background: "#eef2ff",
                  border: "1px solid #c7d2fe",
                  borderRadius: 12,
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "#c7d2fe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Mail size={16} color={C.indigo} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>
                    Email Support
                  </div>
                  <div style={{ fontSize: 12, color: C.light }}>
                    support@safara.app
                  </div>
                </div>
              </a>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "#bae6fd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MessageSquare size={16} color={C.sky} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>
                    Live Chat
                  </div>
                  <div style={{ fontSize: 12, color: C.light }}>
                    Available Mon to Fri, 9am to 6pm
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
