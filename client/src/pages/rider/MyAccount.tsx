import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Shield, Calendar } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import UserAvatar from "@/components/ui/UserAvatar";

export default function MyAccount() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

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
        <h1 className="text-base font-semibold text-slate-900">My Account</h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <div className="card">
          <div className="flex items-center gap-4 mb-4">
            <UserAvatar
              name={user?.name}
              avatar={user?.avatar}
              size="xl"
              className="shrink-0"
            />
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <span className="badge-teal capitalize mt-1 inline-block">
                {user?.role}
              </span>
            </div>
          </div>
          <button
            title="Edit Profile"
            onClick={() => navigate("/settings")}
            className="btn btn-secondary btn-sm w-full"
          >
            Edit Profile
          </button>
        </div>

        {/* Account Details */}
        <div className="card">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Account Details
          </h3>
          <div className="divide-y divide-slate-100">
            <div className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Email</p>
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            {user?.phone && (
              <div className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="text-sm font-medium text-slate-900">
                    {user.phone}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Account Status</p>
                <p className="text-sm font-medium">
                  {user?.isEmailVerified ? (
                    <span className="text-gray-700 font-semibold">
                      Verified
                    </span>
                  ) : (
                    <span className="text-gray-600 font-semibold">
                      Unverified
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Member Since</p>
                <p className="text-sm font-medium text-slate-900">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              title="Settings"
              onClick={() => navigate("/settings")}
              className="text-left p-3 rounded-xl border border-slate-200 hover:border-gray-300 hover:bg-gray-100 transition-all"
            >
              <p className="text-sm font-semibold text-slate-900">Settings</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your account settings
              </p>
            </button>

            <button
              title="Notifications"
              onClick={() => navigate("/notifications")}
              className="text-left p-3 rounded-xl border border-slate-200 hover:border-gray-300 hover:bg-gray-100 transition-all"
            >
              <p className="text-sm font-semibold text-slate-900">
                Notifications
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure notification preferences
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

