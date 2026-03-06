import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Smartphone,
  Mail,
  Save,
  Loader2,
  Check,
} from "lucide-react";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    // TODO: Save to backend
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 sticky top-0 z-10">
        <button
          title="Back"
          onClick={() => navigate(-1)}
          className="btn btn-icon"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-base font-semibold text-slate-900">
          Notifications
        </h1>
      </header>

      <div className="p-4 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Push Notifications */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Push Notifications
                </h3>
                <p className="text-xs text-slate-500">
                  Receive notifications on your device
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              <label className="flex items-center justify-between py-3 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Enable Push Notifications
                  </p>
                  <p className="text-xs text-slate-500">
                    Receive real-time updates on your device
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={() => toggleSetting("pushNotifications")}
                  className="w-4 h-4 accent-gray-700 rounded"
                />
              </label>

              <label className="flex items-center justify-between py-3 cursor-pointer">
                <div>
                  <p
                    className={`text-sm font-medium ${settings.pushNotifications ? "text-slate-800" : "text-slate-400"}`}
                  >
                    Bus Approaching
                  </p>
                  <p className="text-xs text-slate-500">
                    Get notified when your bus is nearby
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.busApproaching}
                  onChange={() => toggleSetting("busApproaching")}
                  disabled={!settings.pushNotifications}
                  className="w-4 h-4 accent-gray-700 rounded disabled:opacity-50"
                />
              </label>

              <label className="flex items-center justify-between py-3 cursor-pointer">
                <div>
                  <p
                    className={`text-sm font-medium ${settings.pushNotifications ? "text-slate-800" : "text-slate-400"}`}
                  >
                    Route Updates
                  </p>
                  <p className="text-xs text-slate-500">
                    Notifications about route changes or delays
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.routeUpdates}
                  onChange={() => toggleSetting("routeUpdates")}
                  disabled={!settings.pushNotifications}
                  className="w-4 h-4 accent-gray-700 rounded disabled:opacity-50"
                />
              </label>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Email Notifications
                </h3>
                <p className="text-xs text-slate-500">
                  Receive updates via email
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              <label className="flex items-center justify-between py-3 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Enable Email Notifications
                  </p>
                  <p className="text-xs text-slate-500">
                    Receive updates in your inbox
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={() => toggleSetting("emailNotifications")}
                  className="w-4 h-4 accent-gray-700 rounded"
                />
              </label>

              <label className="flex items-center justify-between py-3 cursor-pointer">
                <div>
                  <p
                    className={`text-sm font-medium ${settings.emailNotifications ? "text-slate-800" : "text-slate-400"}`}
                  >
                    System Announcements
                  </p>
                  <p className="text-xs text-slate-500">
                    Important updates and announcements
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.systemAnnouncements}
                  onChange={() => toggleSetting("systemAnnouncements")}
                  disabled={!settings.emailNotifications}
                  className="w-4 h-4 accent-gray-700 rounded disabled:opacity-50"
                />
              </label>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="alert alert-success">
              <Check className="w-4 h-4 shrink-0" />
              <span>Notification preferences saved!</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              title="Cancel"
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
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

