import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  Bus,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { socketService } from "@/services/socket";

type Step = "form" | "otp";

export default function Register() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Invitation token from URL query param (?invite=TOKEN)
  const inviteToken = searchParams.get("invite") || "";

  // If coming from login redirect (unverified email)
  const pendingEmail = (location.state as { pendingEmail?: string })
    ?.pendingEmail;

  const [step, setStep] = useState<Step>(pendingEmail ? "otp" : "form");
  const [formData, setFormData] = useState({
    name: "",
    email: pendingEmail ?? "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(pendingEmail ? 60 : 0);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);
  const [inviteValid, setInviteValid] = useState(!!pendingEmail);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { error: storeError, clearError } = useAuthStore();

  // If no invite token and not a pending email redirect, show an error
  const hasInvite = inviteValid || !!pendingEmail;

  // Validate the invitation token and pre-fill email
  useEffect(() => {
    if (!inviteToken) return;
    let cancelled = false;

    (async () => {
      try {
        const { data } = await authApi.validateInvitation(inviteToken);
        if (!cancelled) {
          setFormData((prev) => ({ ...prev, email: data.data.email }));
          setInviteValid(true);
        }
      } catch {
        if (!cancelled) {
          setInviteValid(false);
          setLocalError("This invitation link is invalid or has expired.");
        }
      } finally {
        if (!cancelled) setInviteLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteToken]);

  // Start cooldown if coming from login redirect (OTP was already sent server-side)
  useEffect(() => {
    if (pendingEmail) {
      startResendCooldown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Step 1: form ────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setLocalError("");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError("");

    if (formData.password !== formData.confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.sendRegisterOtp({
        email: formData.email.trim(),
        name: formData.name.trim(),
        password: formData.password,
        phone: formData.phone?.trim() || undefined,
        inviteToken,
      });
      setStep("otp");
      startResendCooldown();
    } catch (err: unknown) {
      setLocalError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to send verification code",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 2: OTP ─────────────────────────────────────────────────────────────

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setLocalError("");
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
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError("");

    const code = otp.join("");
    if (code.length < 6) {
      setLocalError("Please enter the 6-digit code");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: response } = await authApi.verifyRegisterOtp({
        email: formData.email,
        otp: code,
      });
      const { user, token } = response.data;

      localStorage.setItem("token", token);
      socketService.connect(token);
      useAuthStore.setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        pendingVerificationEmail: null,
      });
    } catch (err: unknown) {
      setLocalError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Invalid or expired verification code",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    clearError();
    setLocalError("");
    setOtp(["", "", "", "", "", ""]);
    setIsSubmitting(true);

    try {
      if (pendingEmail) {
        await authApi.resendRegisterOtp(formData.email);
      } else {
        await authApi.sendRegisterOtp({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          phone: formData.phone || undefined,
          inviteToken,
        });
      }
      startResendCooldown();
      otpRefs.current[0]?.focus();
    } catch (err: unknown) {
      setLocalError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to resend code",
      );
    } finally {
      setIsSubmitting(false);
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

  const displayError = storeError || localError;

  // ── Loading invitation ────────────────────────────────────────────────────

  if (inviteLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-700" />
        <p className="mt-3 text-sm text-slate-500">Validating invitation...</p>
      </div>
    );
  }

  // ── No invitation ─────────────────────────────────────────────────────────

  if (!hasInvite) {
    return (
      <div>
        <div className="card text-center py-8">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-gray-1000" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Invitation Required
          </h2>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            You need an invitation from your organization's administrator to
            create an account. Please check your email for an invitation link.
          </p>
        </div>

        <p className="text-sm text-slate-500 mt-5 text-center">
          Already have an account?{" "}
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

  // ── Render: OTP step ────────────────────────────────────────────────────────

  if (step === "otp") {
    return (
      <div>
        {!pendingEmail && (
          <button
            onClick={() => {
              setStep("form");
              clearError();
              setLocalError("");
              setOtp(["", "", "", "", "", ""]);
            }}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}

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
              border: "1.5px solid #e5e7eb"
            }}
          >
            <Mail className="w-6 h-6 text-gray-700" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Check your email
          </h2>
          <p className="text-sm text-slate-500">
            We sent a 6-digit code to
            <br />
            <span className="font-medium text-slate-700">{formData.email}</span>
          </p>
        </div>

        {displayError && (
          <div className="alert alert-error mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {displayError}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full h-10"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Verify & Create Account"
            )}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-4 text-center">
          Didn't receive it?{" "}
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || isSubmitting}
            className="text-gray-700 font-medium hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Resend code"}
          </button>
        </p>

        {pendingEmail && (
          <p className="text-sm text-slate-500 mt-3 text-center">
            <Link
              to="/login"
              className="text-gray-700 font-medium hover:text-gray-800"
            >
              Back to Login
            </Link>
          </p>
        )}
      </div>
    );
  }

  // ── Render: Form step ───────────────────────────────────────────────────────

  return (
    <div>
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
          <Bus size={26} color="white" strokeWidth={2} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">
          Create Account
        </h2>
        <p className="text-sm text-slate-500">
          Complete your registration to get started
        </p>
      </div>

      {displayError && (
        <div className="alert alert-error mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {displayError}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <label className="label">Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`input ${inviteToken ? "bg-slate-50 text-slate-500" : ""}`}
            placeholder="Enter your email"
            required
            readOnly={!!inviteToken}
          />
          {inviteToken && (
            <p className="text-xs text-slate-400 mt-1">
              Email is set by your invitation and cannot be changed.
            </p>
          )}
        </div>

        <div>
          <label className="label">
            Phone Number{" "}
            <span className="font-normal text-slate-400">(Optional)</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="input"
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input pr-10"
              placeholder="Create a password"
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

        <div>
          <label className="label">Confirm Password</label>
          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="input"
            placeholder="Confirm your password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary w-full h-10 mt-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Continue"
          )}
        </button>
      </form>

      <p className="text-sm text-slate-500 mt-5 text-center">
        Already have an account?{" "}
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


