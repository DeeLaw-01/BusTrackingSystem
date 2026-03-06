import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, AlertCircle, Mail, Lock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError, pendingVerificationEmail, clearPendingVerification } = useAuthStore();

  useEffect(() => {
    if (pendingVerificationEmail) {
      clearPendingVerification();
      navigate("/register", { state: { pendingEmail: pendingVerificationEmail } });
    }
  }, [pendingVerificationEmail, navigate, clearPendingVerification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try { await login(email, password); } catch { /* handled in store */ }
  };

  return (
    <div>
      {/* Heading */}
      <div className="mb-7">
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 5, letterSpacing: "-0.01em" }}>
          Sign in to Safara
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
          Welcome back — enter your credentials to continue
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-start gap-2.5 mb-5 px-3.5 py-3 rounded-xl text-sm"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c" }}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Email */}
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 }}>
            Email address
          </label>
          <div className="relative">
            <Mail
              size={15}
              style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                display: "block", width: "100%", height: 42, paddingLeft: 38, paddingRight: 14,
                border: "1.5px solid #e5e7eb", borderRadius: 10, background: "#ffffff",
                color: "#111827", fontSize: 14, fontFamily: "inherit", outline: "none",
                transition: "border-color .15s, box-shadow .15s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#374151"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(17,24,39,.07)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Password</label>
            <Link
              to="/forgot-password"
              style={{ fontSize: 12.5, fontWeight: 500, color: "#6b7280", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#111827")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock
              size={15}
              style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}
            />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                display: "block", width: "100%", height: 42, paddingLeft: 38, paddingRight: 42,
                border: "1.5px solid #e5e7eb", borderRadius: 10, background: "#ffffff",
                color: "#111827", fontSize: 14, fontFamily: "inherit", outline: "none",
                transition: "border-color .15s, box-shadow .15s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#374151"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(17,24,39,.07)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 2, display: "flex" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#374151")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            height: 44, borderRadius: 10, border: "none", cursor: isLoading ? "not-allowed" : "pointer",
            background: isLoading ? "#374151" : "#111827", color: "#ffffff",
            fontSize: 14.5, fontWeight: 600, fontFamily: "inherit",
            transition: "background .15s", marginTop: 2, opacity: isLoading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = "#1f2937"; }}
          onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.background = "#111827"; }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing in…
            </>
          ) : "Sign in"}
        </button>
      </form>

      {/* Divider */}
      <div style={{ height: 1, background: "#f3f4f6", margin: "24px 0" }} />

      {/* Register link */}
      <p style={{ textAlign: "center", fontSize: 13.5, color: "#6b7280", margin: 0 }}>
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          style={{ fontWeight: 600, color: "#111827", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

