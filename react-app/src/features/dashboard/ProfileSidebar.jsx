function ProfileSidebar({ user }) {
  return (
    <section className="md:col-span-1">
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover-lift duration-300">
        {/* Banner with dark modern gradient */}
        <div className="h-20 bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
        </div>

        <div className="px-5 pb-5 relative flex flex-col items-center text-center">
          {/* Avatar with negative margins */}
          <div className="relative -mt-12 mb-3 group">
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={user.username}
                className="h-22 w-22 rounded-2xl border-4 border-white shadow-sm object-cover transition-all duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="h-22 w-22 rounded-2xl border-4 border-white shadow-sm bg-gradient-to-br from-indigo-500 to-purple-650 text-white font-bold flex items-center justify-center text-2xl transition-all duration-300 group-hover:scale-105">
                {user?.username?.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 justify-center">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">{user?.username}</h2>

            {user?.is_verified && (
              <span className="text-indigo-605" title="Verified Account">
                <svg className="h-4.5 w-4.5 fill-current text-indigo-600" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 10.586l3.293-3.293a1 1 0 111.414 1.414z" />
                </svg>
              </span>
            )}
          </div>

          <p className="text-xs font-semibold text-slate-400 mt-0.5 break-all">{user?.email}</p>

          <div className="mt-3.5 flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold bg-slate-50 border border-slate-100 text-slate-600">
            <span>METHOD:</span>

            {user?.provider === "google" && (
              <span className="text-red-500 flex items-center gap-1">Google</span>
            )}

            {user?.provider === "github" && (
              <span className="text-slate-800 flex items-center gap-1">GitHub</span>
            )}

            {user?.provider === "email" && (
              <span className="text-indigo-600 flex items-center gap-1">Email OTP</span>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100/80 p-4 space-y-3 bg-slate-50/50">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-405 font-bold text-slate-505">Profile views</span>
            <span className="text-slate-900 font-extrabold bg-white border border-slate-100 px-2 py-0.5 rounded-md shadow-2xs">142</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-405 font-bold text-slate-505">Post impressions</span>
            <span className="text-slate-900 font-extrabold bg-white border border-slate-100 px-2 py-0.5 rounded-md shadow-2xs">1,824</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfileSidebar;