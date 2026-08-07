import { useState } from "react";
import { useNavigate } from "react-router-dom";

function NewsSidebar({ suggestedUsers = [], onAddFriend }) {
  const navigate = useNavigate();
  const [localStatuses, setLocalStatuses] = useState({});
  const [sendingIds, setSendingIds] = useState({});

  const handleAddFriend = async (userId) => {
    setSendingIds((prev) => ({ ...prev, [userId]: true }));
    try {
      await onAddFriend?.(userId);
      setLocalStatuses((prev) => ({ ...prev, [userId]: "pending_sent" }));
    } finally {
      setSendingIds((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <section className="hidden lg:col-span-1 lg:block">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover-lift duration-300">
        <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center justify-between uppercase tracking-wider">
          <span>Suggested Users</span>
          <span className="text-slate-400 cursor-help" title="Suggested users">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9a3 3 0 11-6 0 3 3 0 016 0zM9 21v-1a4 4 0 014-4h1m5-9a2.5 2.5 0 010 5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-1a4 4 0 014-4 4 4 0 014 4v1" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 9a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
        </h3>

        {suggestedUsers.length === 0 ? (
          <p className="text-xs font-semibold text-slate-400 text-center py-4">
            No suggestions right now
          </p>
        ) : (
          <ul className="space-y-3.5">
            {suggestedUsers.map((suggestedUser, index) => {
              const status =
                localStatuses[suggestedUser.id] ||
                suggestedUser.friendship_status ||
                "none";
              const isSending = !!sendingIds[suggestedUser.id];

              return (
                <li
                  key={suggestedUser.id}
                  className={`flex items-center gap-3 ${
                    index > 0 ? "border-t border-slate-100/80 pt-3.5" : ""
                  }`}
                >
                  {/* Avatar + name/username - clickable, navigates to profile */}
                  <div
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    onClick={() => navigate(`/profile/${suggestedUser.id}`)}
                  >
                    {suggestedUser.profile_picture ? (
                      <img
                        src={suggestedUser.profile_picture}
                        alt={suggestedUser.username || "User"}
                        className="h-9 w-9 rounded-xl border border-slate-200 shadow-sm object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-xl border border-slate-200 shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {getInitials(suggestedUser)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate hover:text-indigo-650 transition-colors duration-150">
                        {suggestedUser.name || suggestedUser.username}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 truncate">
                        @{suggestedUser.username}
                      </p>
                    </div>
                  </div>

                  <FriendActionButton
                    status={status}
                    isSending={isSending}
                    onClick={() => handleAddFriend(suggestedUser.id)}
                    onViewRequest={() => navigate("/friends")}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function FriendActionButton({ status, isSending, onClick, onViewRequest }) {
  const baseClasses =
    "flex-shrink-0 min-w-[80px] text-center rounded-lg border px-2.5 py-1.5 text-[10px] font-extrabold transition active:scale-[0.97]";

  if (status === "accepted" || status === "friends") {
    return (
      <span className={`${baseClasses} border-slate-200 bg-slate-50 text-slate-500`}>
        Friends
      </span>
    );
  }

  if (status === "pending_sent" || status === "pending") {
    return (
      <span className={`${baseClasses} border-slate-200 bg-slate-50 text-slate-500`}>
        Pending
      </span>
    );
  }

  if (status === "pending_received") {
    return (
      <button
        type="button"
        onClick={onViewRequest}
        className={`${baseClasses} border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100`}
      >
        View Request
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSending}
      className={`${baseClasses} border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {isSending ? "Sending..." : "Add Friend"}
    </button>
  );
}

function getInitials(user) {
  const displayName = user?.name || user?.username || "User";

  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default NewsSidebar;