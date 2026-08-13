import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { getMe } from "../api/auth";
import { getAdminStats } from "../api/admin";
import AdminLayout from "../layouts/AdminLayout";


function AdminDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");


  const fetchAdminDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [
          currentUser,
          statsData,
        ] = await Promise.all([
          getMe(),
          getAdminStats(),
        ]);

        if (currentUser.role !== "admin") {
          navigate("/dashboard", {
            replace: true,
          });

          return;
        }

        setUser(currentUser);
        setStats(statsData);

        setLastUpdated(
          new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      } catch (requestError) {
        console.error(
          "Failed to load admin dashboard:",
          requestError
        );

        const status =
          requestError.response?.status;

        const message =
          requestError.response?.data?.detail ||
          "Failed to load admin dashboard.";

        if (status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("role");

          navigate("/login", {
            replace: true,
          });

          return;
        }

        if (status === 403) {
          navigate("/dashboard", {
            replace: true,
          });

          return;
        }

        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );


  useEffect(() => {
    fetchAdminDashboard();
  }, [fetchAdminDashboard]);


  const handleRefresh = async () => {
    await fetchAdminDashboard(true);
    toast.success("Dashboard statistics refreshed.");
  };


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />

          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl">
            ⚠️
          </div>

          <h2 className="mt-4 text-lg font-black text-slate-900">
            Unable to load dashboard
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => fetchAdminDashboard()}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700 active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }


  const metricCards = [
    {
      label: "Total Users",
      value: stats?.users?.total ?? 0,
      icon: "👥",
      route: "/admin/users",
      description: "Registered accounts",
    },
    {
      label: "Blocked Users",
      value: stats?.users?.blocked ?? 0,
      icon: "🚫",
      route: "/admin/users",
      description: "Restricted accounts",
    },
    {
      label: "Total Posts",
      value: stats?.posts?.total ?? 0,
      icon: "📝",
      route: "/admin/posts",
      description: "All platform posts",
    },
    {
      label: "Active Posts",
      value: stats?.posts?.active ?? 0,
      icon: "✅",
      route: "/admin/posts",
      description: "Visible in feeds",
    },
    {
      label: "Archived Posts",
      value: stats?.posts?.archived ?? 0,
      icon: "📦",
      route: "/admin/posts",
      description: "Hidden posts",
    },
    {
      label: "Total Likes",
      value: stats?.engagement?.likes ?? 0,
      icon: "❤️",
      description: "Platform reactions",
    },
    {
      label: "Total Comments",
      value: stats?.engagement?.comments ?? 0,
      icon: "💬",
      description: "User discussions",
    },
  ];


  return (
    <AdminLayout user={user}>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Welcome Banner */}
        <section className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 p-8 text-white shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1.5 text-xs font-extrabold uppercase tracking-widest text-indigo-300">
                Welcome, {user?.username}
              </p>

              <h1 className="mb-2 text-2xl font-black tracking-tight">
                Platform Administration
              </h1>

              <p className="max-w-xl text-xs font-medium leading-relaxed text-slate-300">
                Monitor platform statistics and manage users,
                posts and engagement.
              </p>

              <p className="mt-3 text-xs font-semibold text-slate-400">
                Logged in as {user?.email}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
                Account Role
              </p>

              <p className="mt-1 text-sm font-black">
                Administrator
              </p>
            </div>
          </div>
        </section>

        {/* Platform Overview */}
        <section className="mb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Platform Overview
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Live statistics loaded from the backend.
              </p>

              {lastUpdated && (
                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                  Last updated: {lastUpdated}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh Statistics"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {metricCards.map((metric) => {
              const isClickable = Boolean(metric.route);

              return (
                <button
                  key={metric.label}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => {
                    if (metric.route) {
                      navigate(metric.route);
                    }
                  }}
                  className={`rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition ${
                    isClickable
                      ? "cursor-pointer hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
                      : "cursor-default"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {metric.label}
                      </p>

                      <h3 className="mt-1.5 text-2xl font-black text-slate-900">
                        {Number(
                          metric.value
                        ).toLocaleString()}
                      </h3>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg">
                      {metric.icon}
                    </div>
                  </div>

                  <p className="mt-3 text-[10px] font-semibold text-slate-400">
                    {metric.description}
                  </p>

                  {isClickable && (
                    <p className="mt-3 text-[10px] font-bold text-indigo-600">
                      Open management page →
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Content Summary */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Content Summary
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Current platform activity and moderation status.
              </p>
            </div>

            <div className="space-y-4">
              <SummaryRow
                label="Active posts"
                value={stats?.posts?.active ?? 0}
              />

              <SummaryRow
                label="Archived posts"
                value={stats?.posts?.archived ?? 0}
              />

              <SummaryRow
                label="Likes"
                value={stats?.engagement?.likes ?? 0}
              />

              <SummaryRow
                label="Comments"
                value={stats?.engagement?.comments ?? 0}
              />
            </div>
          </section>

          {/* Admin Actions */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Admin Actions
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Open moderation and management tools.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() =>
                  navigate("/admin/users")
                }
                className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white transition hover:bg-indigo-700 active:scale-95"
              >
                Manage Users
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/posts")
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95"
              >
                Manage Posts
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/dashboard")
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95"
              >
                Open User Dashboard
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
              >
                {refreshing
                  ? "Refreshing..."
                  : "Refresh Statistics"}
              </button>
            </div>
          </section>

          {/* Platform Health */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
            <div className="mb-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Platform Health
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Services verified during the latest dashboard
                request.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <HealthStatus
                label="Backend API"
                description="Responding normally"
              />

              <HealthStatus
                label="Database"
                description="Statistics loaded successfully"
              />

              <HealthStatus
                label="Admin Session"
                description="Authenticated and authorized"
              />
            </div>
          </section>
        </div>
      </main>
    </AdminLayout>
  );
}


function SummaryRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
      <p className="text-sm font-semibold text-slate-600">
        {label}
      </p>

      <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-slate-900">
        {Number(value).toLocaleString()}
      </span>
    </div>
  );
}


function HealthStatus({
  label,
  description,
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
      <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />

      <div>
        <p className="text-xs font-black text-slate-900">
          {label}
        </p>

        <p className="mt-1 text-[10px] font-semibold text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}


export default AdminDashboard;