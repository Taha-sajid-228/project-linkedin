import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../api/axios";

function FollowListModal({
  userId,
  type,
  onClose,
}) {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const limit = 20;

  const fetchUsers = useCallback(
    async (currentOffset = 0, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const response = await API.get(
          `/users/${userId}/${type}`,
          {
            params: {
              limit,
              offset: currentOffset,
            },
          }
        );

        const receivedUsers =
          response.data.users || [];

        setUsers((previousUsers) =>
          append
            ? [...previousUsers, ...receivedUsers]
            : receivedUsers
        );

        setHasMore(response.data.has_more);
        setOffset(
          currentOffset + receivedUsers.length
        );
      } catch (error) {
        toast.error(
          error.response?.data?.detail ||
            `Failed to load ${type}.`
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [type, userId]
  );

  useEffect(() => {
    fetchUsers(0, false);
  }, [fetchUsers]);

  const handleUserClick = (selectedUserId) => {
    onClose();
    navigate(`/profile/${selectedUserId}`);
  };

  const title =
    type === "followers"
      ? "Followers"
      : "Following";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-black text-slate-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : users.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-semibold text-slate-400">
                No {title.toLowerCase()} found.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((item) => {
                const listedUser = item.user;

                return (
                  <button
                    key={item.relationship_id}
                    type="button"
                    onClick={() =>
                      handleUserClick(listedUser.id)
                    }
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
                  >
                    {listedUser.profile_picture ? (
                      <img
                        src={listedUser.profile_picture}
                        alt={listedUser.username}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-sm font-black text-indigo-700">
                        {listedUser.username
                          ?.substring(0, 2)
                          .toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-900">
                        {listedUser.name ||
                          listedUser.username}
                      </p>

                      <p className="truncate text-xs font-semibold text-slate-400">
                        @{listedUser.username}
                      </p>

                      {listedUser.bio && (
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                          {listedUser.bio}
                        </p>
                      )}
                    </div>

                    <svg
                      className="h-4 w-4 text-slate-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && hasMore && (
            <button
              type="button"
              onClick={() =>
                fetchUsers(offset, true)
              }
              disabled={loadingMore}
              className="mt-4 w-full rounded-xl bg-slate-100 px-4 py-3 text-xs font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingMore
                ? "Loading..."
                : "Load More"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FollowListModal;