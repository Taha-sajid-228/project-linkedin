import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await API.get("/me");
        setUser(response.data);

        if (response.data.role !== "admin") {
          navigate("/dashboard");
        }
      } catch (error) {
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans antialiased">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sticky glass navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Link<span className="text-indigo-600">Loop</span>
              <span className="text-xs font-extrabold tracking-wider text-slate-400 ml-2 uppercase">Admin</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95"
            >
              Dashboard
            </button>

            <button
              onClick={handleLogout}
              className="bg-slate-50 hover:bg-red-50 hover:text-red-605 hover:text-red-600 border border-slate-200 hover:border-red-150 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome card with dark gradient */}
        <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-955 to-indigo-950 text-white rounded-2xl p-8 shadow-xs mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
          <div className="relative">
            <p className="text-xs font-extrabold text-indigo-300 uppercase tracking-widest mb-1.5">
              Welcome, {user?.username}
            </p>
            <h2 className="text-2xl font-black tracking-tight mb-2">Platform Administration</h2>
            <p className="text-slate-300 text-xs font-medium max-w-xl leading-relaxed">
              Monitor statistics, inspect reported materials, configure layout properties, and administer global database records.
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover-lift duration-350">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1.5">1,248</h3>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover-lift duration-350">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admins</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1.5">1</h3>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover-lift duration-350">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Posts</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1.5">5,812</h3>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover-lift duration-350">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reports</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1.5">17</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Users List */}
          <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 mb-5 uppercase tracking-wider">Recent Users</h3>

            <div className="space-y-4">
              {["Taha Sajid", "Jane Doe", "Alex Smith", "Ahmed Khan"].map(
                (name, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center border-b border-slate-100 pb-3.5 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 font-extrabold flex items-center justify-center text-xs">
                        {name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">user@linkloop.com</p>
                      </div>
                    </div>

                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                )
              )}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 mb-5 uppercase tracking-wider">Admin Actions</h3>

            <div className="space-y-3">
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer active:scale-95 shadow-sm shadow-indigo-100">
                Manage Users
              </button>

              <button className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 py-3 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer active:scale-95">
                Review Reports
              </button>

              <button className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 py-3 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer active:scale-95">
                View Analytics
              </button>

              <button className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 py-3 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer active:scale-95">
                Site Settings
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;