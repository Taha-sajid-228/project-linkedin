import React from "react";

function UserCard({ user, onProfileOpen = () => {}, children }) {
  const firstLetter =
    user?.name?.charAt(0) || user?.username?.charAt(0) || "U";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={onProfileOpen}
        className="shrink-0 cursor-pointer"
      >
        {user?.profile_picture ? (
          <img
            src={user.profile_picture}
            alt={user.username || "User profile"}
            className="h-14 w-14 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-sm font-black text-indigo-700">
            {user?.username?.substring(0, 2).toUpperCase() || firstLetter.toUpperCase()}
          </div>
        )}
      </button>

      <button
        type="button"
        onClick={onProfileOpen}
        className="min-w-0 flex-1 cursor-pointer text-left"
      >
        <p className="truncate text-sm font-black text-slate-900">
          {user?.name || user?.username || "Anonymous User"}
        </p>

        <p className="truncate text-xs font-semibold text-slate-400">
          @{user?.username || "unknown"}
        </p>

        {user?.bio && (
          <p className="mt-1 line-clamp-1 text-xs text-slate-500">{user.bio}</p>
        )}

        <p className="mt-2 text-xs font-bold text-slate-500">
          {user.followers_count ?? 0} Followers
        </p>
      </button>

      <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export default UserCard;
