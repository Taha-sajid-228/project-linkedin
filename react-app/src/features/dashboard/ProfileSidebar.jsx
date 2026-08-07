import { useNavigate } from "react-router-dom";


function ProfileSidebar({ user }) {
  const navigate = useNavigate();

  return (
    <section className="md:col-span-1 space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover-lift duration-300">
        {/* Banner */}
        <div className="h-20 bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        </div>

        <div className="px-5 pb-5 relative flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative -mt-12 mb-3 group">
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={user.username || "User"}
                className="h-22 w-22 rounded-2xl border-4 border-white shadow-sm object-cover transition-all duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="h-22 w-22 rounded-2xl border-4 border-white shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-2xl transition-all duration-300 group-hover:scale-105">
                {getInitials(user)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 justify-center">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              {user?.username || "User"}
            </h2>

            {user?.is_verified && (
              <span
                className="text-indigo-600"
                title="Verified Account"
              >
                <svg
                  className="h-4.5 w-4.5 fill-current text-indigo-600"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 10.586l3.293-3.293a1 1 0 111.414 1.414z" />
                </svg>
              </span>
            )}
          </div>

          <p className="text-xs font-semibold text-slate-400 mt-0.5 break-all">
            {user?.email}
          </p>

          {user?.role === "admin" && (
            <span className="mt-2 inline-flex rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">
              Administrator
            </span>
          )}

<div className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 divide-y divide-slate-200 overflow-hidden">

  <div className="flex items-center justify-between px-4 py-3">
    <span className="text-sm font-semibold text-slate-700">
      Followers
    </span>

    <span className="min-w-[48px] rounded-lg border border-slate-200 bg-white px-3 py-1 text-center text-sm font-bold text-slate-900 shadow-sm">
      {user?.followers_count ?? 0}
    </span>
  </div>

  <div className="flex items-center justify-between px-4 py-3">
    <span className="text-sm font-semibold text-slate-700">
      Following
    </span>

    <span className="min-w-[48px] rounded-lg border border-slate-200 bg-white px-3 py-1 text-center text-sm font-bold text-slate-900 shadow-sm">
      {user?.following_count ?? 0}
    </span>
  </div>

  <button
    type="button"
    onClick={() => navigate("/friends")}
    className="flex w-full items-center justify-between px-4 py-3 transition hover:bg-indigo-50"
  >
    <span className="text-sm font-semibold text-slate-700">
      Friends
    </span>

    <span className="min-w-[48px] rounded-lg border border-slate-200 bg-white px-3 py-1 text-center text-sm font-bold text-slate-900 shadow-sm">
      {user?.friends_count ?? 0}
    </span>
  </button>

</div>
        </div>

      </div>

      {user?.role === "admin" && (
        <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
          <div className="border-b border-indigo-100 bg-indigo-50 px-4 py-3">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700">
              Admin Panel
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              Manage platform users and content
            </p>
          </div>

          <div className="space-y-2 p-3">
            <AdminLink
              label="Admin Dashboard"
              description="View platform statistics"
              onClick={() =>
                navigate("/admin-dashboard")
              }
            />

            <AdminLink
              label="Manage Users"
              description="Block, unblock or delete users"
              onClick={() =>
                navigate("/admin/users")
              }
            />

            <AdminLink
              label="Manage Posts"
              description="Archive and moderate posts"
              onClick={() =>
                navigate("/admin/posts")
              }
            />
          </div>
        </div>
      )}
    </section>
  );
}


function AdminLink({
  label,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50 active:scale-[0.99]"
    >
      <p className="text-xs font-extrabold text-slate-800">
        {label}
      </p>

      <p className="mt-1 text-[10px] font-semibold leading-relaxed text-slate-500">
        {description}
      </p>
    </button>
  );
}


function getInitials(user) {
  const displayName =
    user?.name ||
    user?.username ||
    "User";

  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}


export default ProfileSidebar;