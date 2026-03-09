import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, Camera, Loader2, Check, X } from "lucide-react";
import { userApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { uploadToCloudinary } from "@/services/cloudinary";
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
  .set-root { min-height: 100vh; background: #f5f7fa; }

  .set-header {
    position: sticky; top: 0; z-index: 20;
    background: #fff; border-bottom: 1px solid #e8edf2;
    display: flex; align-items: center; gap: 12px;
    padding: 0 16px; height: 56px;
  }
  .set-back-btn {
    width: 34px; height: 34px; border-radius: 10px;
    border: 1px solid #e2e8f0; background: #f8fafc;
    cursor: pointer; color: ${C.slate};
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .set-header-title { font-size: 15px; font-weight: 700; color: ${C.dark}; }

  .set-hero {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #0f2a4a 100%);
    padding: 24px 20px 42px;
    display: flex; align-items: center; gap: 16px;
  }
  .set-hero-name { font-size: 17px; font-weight: 800; color: #f1f5f9; letter-spacing: -0.02em; margin-bottom: 3px; }
  .set-hero-sub { font-size: 13px; color: #64748b; }

  .set-body { padding: 0 16px; margin-top: -20px; padding-bottom: 48px; }
  .set-layout { display: flex; flex-direction: column; gap: 14px; }

  .set-card {
    background: #fff; border-radius: 22px; padding: 22px;
    box-shadow: 0 4px 28px rgba(0,0,0,0.09); border: 1px solid #e8edf2;
  }
  .set-section-label {
    font-size: 11px; font-weight: 700; color: ${C.light};
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px;
  }

  /* Avatar section */
  .set-avatar-preview { display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .set-avatar-btns { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }

  /* Progress bar */
  .set-progress { margin-top: 12px; }
  .set-progress-row { display: flex; justify-content: space-between; font-size: 12px; color: ${C.light}; margin-bottom: 4px; }
  .set-progress-track { height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
  .set-progress-fill { height: 100%; border-radius: 99px; transition: width .3s; }

  /* URL preview */
  .set-url-info { margin-top: 12px; padding: 10px 12px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
  .set-url-info-label { font-size: 11px; font-weight: 600; color: ${C.light}; margin-bottom: 2px; }
  .set-url-info-text { font-size: 11px; color: ${C.light}; word-break: break-all; }

  /* Form fields */
  .set-field { margin-bottom: 16px; }
  .set-field-label { font-size: 12px; font-weight: 600; color: ${C.slate}; margin-bottom: 7px; }
  .set-input-wrap { position: relative; }
  .set-input-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); pointer-events: none; }
  .set-input {
    width: 100%; padding: 12px 12px 12px 42px; font-size: 14px;
    border: 1.5px solid #e2e8f0; border-radius: 12px; outline: none;
    background: #fff; color: ${C.dark}; box-sizing: border-box; transition: border-color 0.15s;
  }
  .set-input:focus { border-color: ${C.indigo}; box-shadow: 0 0 0 3px ${C.indigo}18; }
  .set-input-hint { font-size: 11.5px; color: ${C.light}; margin-top: 4px; }

  /* Alerts */
  .set-alert { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 12px; margin-bottom: 12px; font-size: 13.5px; font-weight: 600; }
  .set-alert-ok { background: #f0fdf4; border: 1px solid #86efac; color: #16a34a; }
  .set-alert-err { background: #fff5f5; border: 1px solid #fecaca; color: #ef4444; }

  /* Actions */
  .set-actions { display: flex; gap: 10px; margin-top: 4px; }

  @media (min-width: 768px) {
    .set-header { height: 64px; padding: 0 32px; }
    .set-header-title { font-size: 17px; }
    .set-hero { padding: 32px 32px 50px; }
    .set-hero-inner { max-width: 960px; margin: 0 auto; display: flex; align-items: center; gap: 16px; }
    .set-body { max-width: 960px; margin: -20px auto 0; padding: 0 32px 64px; }
    .set-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; }
    .set-avatar-preview { align-items: flex-start; }
    .set-avatar-btns { justify-content: flex-start; }
  }

  @media (min-width: 1200px) {
    .set-body { max-width: 1060px; }
    .set-layout { grid-template-columns: 300px 1fr; }
  }
`;

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user)
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
      });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const { data } = await userApi.updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        avatar: formData.avatar || undefined,
      });
      if (data.data)
        updateUser({
          name: data.data.name,
          phone: data.data.phone,
          avatar: formData.avatar || data.data.avatar,
        });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUrlChange = (url: string) =>
    setFormData((p) => ({ ...p, avatar: url }));

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const url = await uploadToCloudinary(file, {
        onProgress: (p) => setUploadProgress(p),
      });
      handleAvatarUrlChange(url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="set-root">
      <style>{CSS}</style>

      <header className="set-header">
        <button onClick={() => navigate(-1)} className="set-back-btn">
          <ArrowLeft size={16} />
        </button>
        <span className="set-header-title">Settings</span>
      </header>

      <div className="set-hero">
        <div className="set-hero-inner">
          <UserAvatar name={formData.name} avatar={formData.avatar} size="lg" />
          <div>
            <div className="set-hero-name">{formData.name || "Your Profile"}</div>
            <div className="set-hero-sub">Update your account information</div>
          </div>
        </div>
      </div>

      <div className="set-body">
        <div className="set-layout">
          {/* ── Left: Profile Photo ── */}
          <div className="set-card">
            <div className="set-section-label">Profile Picture</div>
            <div className="set-avatar-preview">
              <UserAvatar name={formData.name} avatar={formData.avatar} size="xl" />
              <div className="set-avatar-btns">
                <label
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 10,
                    background: `${C.indigo}12`, border: `1.5px solid ${C.indigo}30`,
                    color: C.indigo, fontSize: 13, fontWeight: 600,
                    cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1,
                  }}
                >
                  {uploading ? (
                    <><Loader2 size={14} className="animate-spin" />Uploading…</>
                  ) : (
                    <><Camera size={14} />Upload Photo</>
                  )}
                  <input
                    type="file" accept="image/*" style={{ display: "none" }}
                    disabled={uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => { const u = prompt("Enter image URL:"); if (u) handleAvatarUrlChange(u); }}
                  disabled={uploading}
                  style={{
                    padding: "8px 16px", borderRadius: 10,
                    background: "#f8fafc", border: "1.5px solid #e2e8f0",
                    color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  From URL
                </button>
                {formData.avatar && (
                  <button
                    type="button"
                    onClick={() => handleAvatarUrlChange("")}
                    disabled={uploading}
                    style={{
                      padding: "8px 16px", borderRadius: 10,
                      background: "#fff5f5", border: "1.5px solid #fecaca",
                      color: "#ef4444", fontSize: 13, fontWeight: 600,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    <X size={13} /> Remove
                  </button>
                )}
              </div>
              {uploading && (
                <div className="set-progress" style={{ width: "100%" }}>
                  <div className="set-progress-row">
                    <span>Uploading…</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="set-progress-track">
                    <div
                      className="set-progress-fill"
                      style={{ width: `${uploadProgress}%`, background: C.indigo }}
                    />
                  </div>
                </div>
              )}
              {formData.avatar && !formData.avatar.startsWith("data:") && (
                <div className="set-url-info">
                  <div className="set-url-info-label">Hosted on Cloudinary</div>
                  <div className="set-url-info-text">
                    {formData.avatar.length > 60
                      ? `${formData.avatar.slice(0, 60)}…`
                      : formData.avatar}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Form ── */}
          <form onSubmit={handleSubmit} className="set-card">
            <div className="set-section-label">Account Information</div>

            <div className="set-field">
              <div className="set-field-label">Full Name</div>
              <div className="set-input-wrap">
                <User size={15} color={C.light} className="set-input-icon" />
                <input
                  type="text" value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Enter your full name" required
                  className="set-input"
                />
              </div>
            </div>

            <div className="set-field">
              <div className="set-field-label">Email Address</div>
              <div className="set-input-wrap">
                <Mail size={15} color={C.light} className="set-input-icon" />
                <input
                  type="email" value={formData.email} disabled
                  aria-label="Email address (read-only)"
                  className="set-input"
                  style={{ background: "#f8fafc", color: C.light, cursor: "not-allowed" }}
                />
              </div>
              <div className="set-input-hint">Email cannot be changed</div>
            </div>

            <div className="set-field">
              <div className="set-field-label">Phone Number</div>
              <div className="set-input-wrap">
                <Phone size={15} color={C.light} className="set-input-icon" />
                <input
                  type="tel" value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                  className="set-input"
                />
              </div>
            </div>

            {success && (
              <div className="set-alert set-alert-ok">
                <Check size={15} /> Profile updated successfully!
              </div>
            )}
            {error && (
              <div className="set-alert set-alert-err">
                <X size={15} /> {error}
              </div>
            )}

            <div className="set-actions">
              <button
                type="button" onClick={() => navigate(-1)}
                style={{
                  flex: 1, padding: "13px 0", borderRadius: 14,
                  border: "1.5px solid #e2e8f0", background: "#f8fafc",
                  color: C.slate, fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit" disabled={loading}
                style={{
                  flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "13px 0", borderRadius: 14, border: "none",
                  background: C.indigo, color: "#fff", fontSize: 14, fontWeight: 700,
                  cursor: loading ? "default" : "pointer",
                  boxShadow: "0 4px 14px rgba(99,102,241,0.35)", opacity: loading ? 0.8 : 1,
                }}
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" />Saving…</>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
