import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore";

// Layouts
import AuthLayout from "@/components/layout/AuthLayout";
import AdminLayout from "@/components/layout/AdminLayout";

// Auth Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";

// Rider Pages
import RiderDashboard from "@/pages/rider/Dashboard";
import Settings from "@/pages/rider/Settings";
import MyAccount from "@/pages/rider/MyAccount";
import Notifications from "@/pages/rider/Notifications";
import HelpSupport from "@/pages/rider/HelpSupport";
import PrivacyPolicy from "@/pages/rider/PrivacyPolicy";

// Driver Pages
import DriverDashboard from "@/pages/driver/Dashboard";
import ActiveTrip from "@/pages/driver/ActiveTrip";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import ManageUsers from "@/pages/admin/ManageUsers";
import ManageInvitations from "@/pages/admin/ManageInvitations";
import ManageRoutes from "@/pages/admin/ManageRoutes";
import RouteBuilder from "@/pages/admin/RouteBuilder";
import ManageBuses from "@/pages/admin/ManageBuses";

// Driver layout wrapper (reuses the old AppLayout for drivers)
import AppLayout from "@/components/layout/AppLayout";

// Protected Route Component
function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: "#f3f4f6" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex items-center justify-center"
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "#111827",
            }}
          >
            <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
              <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10z" />
            </svg>
          </div>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "driver") return <Navigate to="/driver" replace />;
    return <Navigate to="/" replace />;
  }

  // Check if driver is approved
  if (user?.role === "driver" && !user.isApproved) {
    return (
      <div
        className="flex items-center justify-center h-screen px-4"
        style={{ background: "#f3f4f6" }}
      >
        <div
          className="bg-white rounded-2xl p-8 w-full text-center"
          style={{
            maxWidth: "360px",
            boxShadow:
              "0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Icon */}
          <div
            className="flex items-center justify-center mx-auto mb-5"
            style={{
              width: "60px",
              height: "60px",
              borderRadius: 14,
              background: "#f9fafb",
              border: "1.5px solid #e5e7eb",
            }}
          >
            <svg
              className="w-7 h-7"
              style={{ color: "#374151" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4 text-xs font-bold uppercase tracking-widest"
            style={{
              background: "#f9fafb",
              color: "#374151",
              border: "1px solid #e5e7eb",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Pending Review
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Account Pending Approval
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Your driver account is currently under review. Our admins will
            verify your details and approve your account shortly.
          </p>
          <button
            onClick={() => useAuthStore.getState().logout()}
            className="btn btn-primary w-full"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Home Dispatcher / Rider Dashboard */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeDispatcher />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute roles={["rider"]}>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute roles={["rider"]}>
            <MyAccount />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute roles={["rider"]}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/help"
        element={
          <ProtectedRoute roles={["rider"]}>
            <HelpSupport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/privacy"
        element={
          <ProtectedRoute roles={["rider"]}>
            <PrivacyPolicy />
          </ProtectedRoute>
        }
      />

      {/* Driver Routes */}
      <Route
        element={
          <ProtectedRoute roles={["driver"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/driver/trip" element={<ActiveTrip />} />
      </Route>

      {/* Admin Routes */}
      <Route
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/invitations" element={<ManageInvitations />} />
        <Route path="/admin/routes" element={<ManageRoutes />} />
        <Route path="/admin/routes/builder/:id" element={<RouteBuilder />} />
        <Route path="/admin/buses" element={<ManageBuses />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
function HomeDispatcher() {
  const { user } = useAuthStore();

  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  if (user?.role === "driver") return <Navigate to="/driver" replace />;

  return <RiderDashboard />;
}
