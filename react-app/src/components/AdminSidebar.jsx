import { useNavigate } from "react-router-dom";


function AdminSidebar({
  user,
}) {
  const navigate = useNavigate();


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    navigate("/login", {
      replace: true,
    });
  };


  const getInitials = () => {
    const displayName =
      user?.name ||
      user?.username ||
      "Admin";

    return displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("");
  };


  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 p-5">
          <button
            type="button"
            onClick={() =>
              navigate("/admin-dashboard")
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white">
              LL
            </div>

            <div className="text-left">
              <p className="text-sm font-black text-slate-900">
                LinkLoop
              </p>

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Admin Panel
              </p>
            </div>
          </button>
        </div>

        <div className="border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={user.username}
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-sm font-black uppercase text-indigo-700">
                {getInitials()}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900">
                {user?.name ||
                  user?.username ||
                  "Admin"}
              </p>

              <p className="truncate text-xs font-semibold text-slate-500">
                @{user?.username || "admin"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <SidebarButton
            label="Admin Dashboard"
            onClick={() =>
              navigate("/admin-dashboard")
            }
          />

          <SidebarButton
            label="Manage Users"
            onClick={() =>
              navigate("/admin/users")
            }
          />

          <SidebarButton
            label="Manage Posts"
            onClick={() =>
              navigate("/admin/posts")
            }
          />

          <SidebarButton
            label="User Dashboard"
            onClick={() =>
              navigate("/dashboard")
            }
          />
        </nav>

        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-600 transition hover:bg-red-100"
          >
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}


function SidebarButton({
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
    >
      {label}
    </button>
  );
}


export default AdminSidebar;