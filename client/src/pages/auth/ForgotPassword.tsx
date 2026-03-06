import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  CheckCircle,
  KeyRound,
  AlertCircle,
} from "lucide-react";
import { authApi } from "@/services/api";

type Step = "email" | "otp" | "done";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Step 1: Request OTP ─────────────────────────────────────────────────────

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setStep("otp");
      startResendCooldown();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to send reset code",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Verify OTP + new password ───────────────────────────────────────

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError("");
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const next = [...otp];
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setOtp(next);
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp.join("").length < 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({ email, otp: otp.join(""), newPassword });
      setStep("done");
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to reset password",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setOtp(["", "", "", "", "", ""]);
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      startResendCooldown();
      otpRefs.current[0]?.focus();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to resend code",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  // Step 3: Done
  if (step === "done") {
    return (
      <div>
        <div className="text-center mb-6">
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              border: "1.5px solid #e5e7eb",
            }}
          >
            <CheckCircle className="w-7 h-7 text-gray-700" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Password Reset!
          </h2>
          <p className="text-sm text-slate-500">
            Your password has been updated successfully.
            <br />
            You can now sign in with your new password.
          </p>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="btn btn-primary w-full h-10"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // Step 2: OTP + new password
  if (step === "otp") {
    return (
      <div>
        <button
          onClick={() => {
            setStep("email");
            setError("");
            setOtp(["", "", "", "", "", ""]);
          }}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-center mb-6">
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              border: "1.5px solid #e5e7eb",
            }}
          >
            <Mail className="w-6 h-6 text-gray-700" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Check your email
          </h2>
          <p className="text-sm text-slate-500">
            We sent a reset code to
            <br />
            <span className="font-medium text-slate-700">{email}</span>
          </p>
        </div>

        {error && (
          <div className="alert alert-error mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleResetSubmit} className="space-y-4">
          {/* OTP boxes */}
          <div>
            <label className="label">Enter 6-digit code</label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  aria-label={`Digit ${i + 1}`}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  className="w-11 h-12 text-center text-lg font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-1000 focus:border-gray-1000 bg-white text-slate-900"
                />
              ))}
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
                className="input pr-10"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="label">Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              className="input"
              placeholder="Confirm new password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full h-10"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Reset Password"
            )}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-4 text-center">
          Didn't receive it?{" "}
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || isLoading}
            className="text-gray-700 font-medium hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Resend code"}
          </button>
        </p>
      </div>
    );
  }

  // Step 1: Email input
  return (
    <div>
      <button
        onClick={() => navigate("/login")}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Login
      </button>

      <div className="text-center mb-6">
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "#111827",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px",
          }}
        >
          <KeyRound size={24} color="white" strokeWidth={2} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">
          Forgot Password?
        </h2>
        <p className="text-sm text-slate-500">
          Enter your email and we'll send you a reset code.
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div>
          <label className="label">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            className="input"
            placeholder="Enter your registered email"
            required
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full h-10"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Send Reset Code"
          )}
        </button>
      </form>

      <p className="text-sm text-slate-500 mt-5 text-center">
        Remember your password?{" "}
        <Link
          to="/login"
          className="text-gray-700 font-medium hover:text-gray-800"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
