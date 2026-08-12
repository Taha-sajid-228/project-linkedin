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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
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