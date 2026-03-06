import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { userApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { uploadToCloudinary } from "@/services/cloudinary";
import UserAvatar from "@/components/ui/UserAvatar";

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
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
      });
    }
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

      // Update the user in the store
      if (data.data) {
        updateUser({
          name: data.data.name,
          phone: data.data.phone,
          avatar: formData.avatar || data.data.avatar,
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUrlChange = (url: string) => {
    setFormData((prev) => ({ ...prev, avatar: url }));
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const cloudinaryUrl = await uploadToCloudinary(file, {
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      handleAvatarUrlChange(cloudinaryUrl);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-icon"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-base font-semibold text-slate-900">Settings</h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Profile Picture Section */}
        <div className="card">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Profile Picture
          </h2>

          <div className="flex items-start gap-4">
            <UserAvatar
              name={formData.name}
              avatar={formData.avatar}
              size="xl"
              className="shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-500 mb-3">
                Upload a new profile picture or enter an image URL
              </p>
              <div className="flex flex-wrap gap-2">
                <label
                  className={`btn btn-secondary btn-sm cursor-pointer ${
                    uploading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  aria-label="Upload profile picture"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Upload
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    aria-label="Select profile picture file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file);
                      }
                    }}
                  />
                </label>
                <button
                  onClick={() => {
                    const url = prompt("Enter image URL:");
                    if (url) handleAvatarUrlChange(url);
                  }}
                  disabled={uploading}
                  className="btn btn-ghost btn-sm"
                >
                  From URL
                </button>
                {formData.avatar && (
                  <button
                    onClick={() => handleAvatarUrlChange("")}
                    disabled={uploading}
                    className="btn btn-ghost btn-sm text-red-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-1000 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                      role="progressbar"
                      aria-label={`Upload progress: ${Math.round(
                        uploadProgress,
                      )}%`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {formData.avatar && !formData.avatar.startsWith("data:") && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-medium text-slate-500 mb-0.5">
                Image hosted on Cloudinary
              </p>
              <p className="text-xs text-slate-400 break-all">
                {formData.avatar.length > 60
                  ? `${formData.avatar.substring(0, 60)}...`
                  : formData.avatar}
              </p>
            </div>
          )}
        </div>

        {/* Account Information Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="card">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Account Information
            </h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="input pl-10"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    aria-label="Email address (read-only)"
                    className="input pl-10 bg-slate-50 text-slate-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Email cannot be changed
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="label">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="input pl-10"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="alert alert-success">
              <Check className="w-4 h-4 shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <X className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

