import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../api/axios";

function DiscoverUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [followLoadingId, setFollowLoadingId] = useState(null);

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const limit = 20;

  const fetchUsers = useCallback(
    async (currentOffset = 0, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const response = await API.get("/users", {
          params: {
            limit,
            offset: currentOffset,
          },
        });

        const receivedUsers = response.data?.users || [];

        setUsers((previousUsers) =>
          append ? [...previousUsers, ...receivedUsers] : receivedUsers
        );

        setOffset(currentOffset + receivedUsers.length);
        setHasMore(Boolean(response.data?.has_more));
      } catch (error) {
        console.error("Failed to load users:", error);

        toast.error(
          error.response?.data?.detail || "Failed to load users."
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    let isMounted = true;

    const loadInitialUsers = async () => {
      if (isMounted) {
        await fetchUsers(0, false);
      }
    };

    loadInitialUsers();

    return () => {
      isMounted = false;
    };
  }, [fetchUsers]);

  const handleFollow = async (userId) => {
    if (followLoadingId) return;

    try {
      setFollowLoadingId(userId);

      const response = await API.post(`/users/${userId}/follow`);

      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                is_following: response.data?.is_following ?? true,
                followers_count:
                  response.data?.followers_count ??
                  (user.followers_count || 0) + 1,
              }
            : user
        )
      );

      toast.success(
        response.data?.message || "User followed successfully."
      );
    } catch (error) {
      console.error("Follow error:", error);
      toast.error(
        error.response?.data?.detail || "Failed to follow user."
      );
    } finally {
      setFollowLoadingId(null);
    }
  };

  const handleUnfollow = async (userId) => {
    if (followLoadingId) return;

    try {
      setFollowLoadingId(userId);

      const response = await API.delete(`/users/${userId}/follow`);

      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                is_following: response.data?.is_following ?? false,
                followers_count:
                  response.data?.followers_count ??
                  Math.max(0, (user.followers_count || 0) - 1),
              }
            : user
        )
      );

      toast.success(
        response.data?.message || "User unfollowed successfully."
      );
    } catch (error) {
      console.error("Unfollow error:", error);
      toast.error(
        error.response?.data?.detail || "Failed to unfollow user."
      );
    } finally {
      setFollowLoadingId(null);
    }
  };

  const handleProfileOpen = (userId) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Loading People...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <div
            onClick={() => navigate("/dashboard")}
            className="cursor-pointer text-xl font-black"
          >
            Link <span className="text-indigo-600">Loop</span>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Back to Feed
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Discover People
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Follow people to see their posts in your personalized feed.
          </p>
        </div>

        {users.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-semibold text-slate-400">
              No users found.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => {
              const isCurrentUserLoading = followLoadingId === user.id;

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => handleProfileOpen(user.id)}
                    className="shrink-0"
                  >
                    {user.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt={user.username || "User profile"}
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-sm font-black text-indigo-700">
                        {user.username
                          ?.substring(0, 2)
                          .toUpperCase() || "U"}
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProfileOpen(user.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-black text-slate-900">
                      {user.name || user.username || "Anonymous User"}
                    </p>

                    <p className="truncate text-xs font-semibold text-slate-400">
                      @{user.username || "unknown"}
                    </p>

                    {user.bio && (
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        {user.bio}
                      </p>
                    )}

                    <p className="mt-2 text-xs font-bold text-slate-500">
                      {user.followers_count ?? 0} Followers
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={isCurrentUserLoading}
                    onClick={() =>
                      user.is_following
                        ? handleUnfollow(user.id)
                        : handleFollow(user.id)
                    }
                    className={`min-w-24 rounded-xl px-4 py-2 text-xs font-black transition ${
                      user.is_following
                        ? "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    } ${
                      isCurrentUserLoading
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }`}
                  >
                    {isCurrentUserLoading
                      ? "Please wait..."
                      : user.is_following
                      ? "Unfollow"
                      : "Follow"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {hasMore && (
          <button
            type="button"
            onClick={() => fetchUsers(offset, true)}
            disabled={loadingMore}
            className="mt-6 w-full rounded-xl bg-slate-200 px-4 py-3 text-xs font-black text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load More People"}
          </button>
        )}
      </main>
    </div>
  );
}

export default DiscoverUsers;