import { useNavigate } from "react-router-dom";

function DashboardNavbar({ user, onLogout, onGoProfile }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={onGoProfile}
          >
            <svg
              className="w-8 h-8 text-indigo-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>

            <span className="text-xl font-black tracking-tight text-slate-900">
              Link<span className="text-indigo-600">Loop</span>
            </span>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-600/10 px-3.5 py-2 rounded-xl w-72 transition-all duration-200">
            <svg
              className="h-4.5 w-4.5 text-slate-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            <input
              type="text"
              placeholder="Search developers, discussions..."
              className="bg-transparent border-none outline-none text-xs w-full text-slate-900 placeholder-slate-400 font-medium"
            />
          </div>
        </div>

        <nav className="flex items-center gap-6">
          {/* Home Button */}
          <button
            onClick={() => navigate("/dashboard")}
            className="flex flex-col items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer group"
          >
            <svg
              className="h-5 w-5 text-current"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>

            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline mt-1">
              Home
            </span>
          </button>

          {/* Network Button */}
          <button
            onClick={() => navigate("/discover")}
            className="flex flex-col items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <svg
              className="h-5 w-5 text-current"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>

            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline mt-1">
              Network
            </span>
          </button>

          {/* Friends Button */}
          <button
            onClick={() => navigate("/friends")}
            className="flex flex-col items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <svg
              className="h-5 w-5 text-current"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
              <circle cx="10" cy="7" r="4" />
              <path d="M21 8v6" />
              <path d="M24 11h-6" />
            </svg>

            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline mt-1">
              Friends
            </span>
          </button>

          {/* Jobs Button */}
          <button className="flex flex-col items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer">
            <svg
              className="h-5 w-5 text-current"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>

            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline mt-1">
              Jobs
            </span>
          </button>

          {/* Profile Button */}
          <button
            onClick={onGoProfile}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer shadow-sm shadow-indigo-200"
          >
            Profile
          </button>

          {/* User Section & Logout */}
          <div className="border-l border-slate-200 pl-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.username || "User avatar"}
                  className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  {user?.username?.substring(0, 2).toUpperCase() || "U"}
                </div>
              )}

              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold leading-none text-slate-800">
                  {user?.username}
                </p>

                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-red-150 cursor-pointer active:scale-95"
            >
              Sign Out
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default DashboardNavbar;