import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import { showConfirmation } from "../utils/confirmDialog";
import UserCard from "../features/friends/UserCard";
import { discoverUsers, followUser, unfollowUser } from "../api/users";
import EmptyState from "../components/EmptyState";
import SearchInput from "../components/SearchInput";

import {
  acceptFriendRequest,
  cancelFriendRequest,
  getFriends,
  getReceivedFriendRequests,
  getSentFriendRequests,
  rejectFriendRequest,
  sendFriendRequest,
} from "../api/friends";


function DiscoverUsers() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [users, setUsers] = useState([]);

  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [followLoadingId, setFollowLoadingId] = useState(null);
  const [friendLoadingId, setFriendLoadingId] = useState(null);
  const [hoveredFollowUserId, setHoveredFollowUserId] = useState(null);

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const limit = 20;


  // ==========================
  // Load Friendship Data
  // ==========================

  const fetchFriendshipData = useCallback(async () => {
    try {
      const [
        sentResponse,
        receivedResponse,
        friendsResponse,
      ] = await Promise.all([
        getSentFriendRequests(),
        getReceivedFriendRequests(),
        getFriends(),
      ]);

      setSentRequests(sentResponse?.requests || []);
      setReceivedRequests(receivedResponse?.requests || []);
      setFriends(friendsResponse?.friends || []);
    } catch (error) {
      console.error(
        "Failed to load friendship data:",
        error
      );

      throw error;
    }
  }, []);


  // ==========================
  // Load Discover Users
  // ==========================

  const fetchUsers = useCallback(
    async (
      currentOffset = 0,
      append = false,
      search = ""
    ) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const data = await discoverUsers({
          limit,
          offset: currentOffset,
          search: search || undefined,
        });

        const receivedUsers = data?.users || [];

        setUsers((previousUsers) =>
          append ? [...previousUsers, ...receivedUsers] : receivedUsers
        );

        setOffset(currentOffset + receivedUsers.length);

        setHasMore(Boolean(data?.has_more));
      } catch (error) {
        console.error(
          "Failed to load users:",
          error
        );

        toast.error(
          error.response?.data?.detail ||
            "Failed to load users."
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [limit]
  );


  // ==========================
  // Initial Page Load
  // ==========================

  useEffect(() => {
    const loadPageData = async () => {
      try {
        setLoading(true);

        const searchQueryParam =
          searchParams.get("search")?.trim() || "";

        if (searchQueryParam) {
          setSearchText(searchQueryParam);
          setSearchQuery(searchQueryParam);
        }

        await Promise.all([
          fetchUsers(0, false, searchQueryParam),
          fetchFriendshipData(),
        ]);
      } catch (error) {
        console.error(
          "Failed to load discover page:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [
    fetchUsers,
    fetchFriendshipData,
    searchParams,
  ]);


  // ==========================
  // Follow Button Helper
  // ==========================

  const getFollowButtonText = (user) => {
    if (user.is_following) {
      return "Unfollow";
    }
    if (user.follows_you) {
      return "Follow Back";
    }
    return "Follow";
  };


  // ==========================
  // Follow User
  // ==========================

  const handleFollow = async (userId) => {
    if (followLoadingId !== null) {
      return;
    }

    try {
      setFollowLoadingId(userId);

      const data = await followUser(userId);

      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                is_following:
                  data?.is_following ??
                  true,

                follows_you: user.follows_you,

                followers_count:
                  data?.followers_count ??
                  (user.followers_count || 0) + 1,
              }
            : user
        )
      );

      toast.success(
        data?.message ||
          "User followed successfully."
      );
    } catch (error) {
      console.error("Follow error:", error);

      toast.error(
        error.response?.data?.detail ||
          "Failed to follow user."
      );
    } finally {
      setFollowLoadingId(null);
    }
  };


  // ==========================
  // Unfollow User
  // ==========================

  const handleUnfollow = async (userId) => {
    if (followLoadingId !== null) {
      return;
    }

    const result = await showConfirmation({
      title: "Unfollow this user?",
      text: "You can follow this user again at any time.",
      confirmButtonText: "Unfollow",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setFollowLoadingId(userId);

      const data = await unfollowUser(userId);

      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                is_following:
                  data?.is_following ??
                  false,

                followers_count:
                  data?.followers_count ??
                  Math.max(
                    0,
                    (user.followers_count || 0) - 1
                  ),
              }
            : user
        )
      );

      toast.success(
        data?.message ||
          "User unfollowed successfully."
      );
    } catch (error) {
      console.error(
        "Unfollow error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
          "Failed to unfollow user."
      );
    } finally {
      setFollowLoadingId(null);
    }
  };


  // ==========================
  // Send Friend Request
  // ==========================

  const handleSendFriendRequest = async (
    userId
  ) => {
    if (friendLoadingId !== null) {
      return;
    }

    try {
      setFriendLoadingId(userId);

      const response =
        await sendFriendRequest(userId);

      toast.success(
        response?.message ||
          "Friend request sent successfully."
      );

      await fetchFriendshipData();
    } catch (error) {
      console.error(
        "Send friend request error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
          "Failed to send friend request."
      );
    } finally {
      setFriendLoadingId(null);
    }
  };


  // ==========================
  // Cancel Friend Request
  // ==========================

  const handleCancelFriendRequest = async (
    requestId,
    userId
  ) => {
    if (friendLoadingId !== null) {
      return;
    }

    try {
      setFriendLoadingId(userId);

      const response =
        await cancelFriendRequest(requestId);

      toast.success(
        response?.message ||
          "Friend request cancelled."
      );

      await fetchFriendshipData();
    } catch (error) {
      console.error(
        "Cancel friend request error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
          "Failed to cancel friend request."
      );
    } finally {
      setFriendLoadingId(null);
    }
  };


  // ==========================
  // Accept Friend Request
  // ==========================

  const handleAcceptFriendRequest = async (
    requestId,
    userId
  ) => {
    if (friendLoadingId !== null) {
      return;
    }

    try {
      setFriendLoadingId(userId);

      const response =
        await acceptFriendRequest(requestId);

      toast.success(
        response?.message ||
          "Friend request accepted."
      );

      await fetchFriendshipData();
    } catch (error) {
      console.error(
        "Accept friend request error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
          "Failed to accept friend request."
      );
    } finally {
      setFriendLoadingId(null);
    }
  };


  // ==========================
  // Reject Friend Request
  // ==========================

  const handleRejectFriendRequest = async (
    requestId,
    userId
  ) => {
    if (friendLoadingId !== null) {
      return;
    }

    const result = await showConfirmation({
      title: "Reject friend request?",
      text: "This friend request will be permanently removed.",
      confirmButtonText: "Reject",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setFriendLoadingId(userId);

      const response =
        await rejectFriendRequest(requestId);

      toast.success(
        response?.message ||
          "Friend request rejected."
      );

      await fetchFriendshipData();
    } catch (error) {
      console.error(
        "Reject friend request error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
          "Failed to reject friend request."
      );
    } finally {
      setFriendLoadingId(null);
    }
  };


  // ==========================
  // Friendship Helpers
  // ==========================

  const getSentRequestForUser = (userId) => {
    return sentRequests.find(
      (request) =>
        request.receiver?.id === userId
    );
  };


  const getReceivedRequestFromUser = (
    userId
  ) => {
    return receivedRequests.find(
      (request) =>
        request.sender?.id === userId
    );
  };


  const isFriendWithUser = (userId) => {
    return friends.some(
      (friendship) =>
        friendship.user?.id === userId
    );
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
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Discover People
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Follow people and send friend
            requests to build your network.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              const trimmedSearch = searchText.trim();
              setSearchQuery(trimmedSearch);
              fetchUsers(0, false, trimmedSearch);
            }}
            className="mt-4 flex flex-col gap-3 sm:flex-row"
          >
            <SearchInput
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
              placeholder="Search people by name or username"
              className="rounded-2xl border bg-white text-slate-900"
            />

            <button
              type="submit"
              className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
            >
              Search
            </button>
          </form>
        </div>


        {users.length === 0 ? (
          <EmptyState title="No users found" message="Try a different search." />
        ) : (
          <div className="space-y-3">
            {users.map((user) => {
              const isFollowLoading =
                followLoadingId === user.id;

              const isFriendLoading =
                friendLoadingId === user.id;

              const sentRequest =
                getSentRequestForUser(user.id);

              const receivedRequest =
                getReceivedRequestFromUser(
                  user.id
                );

              const isFriend =
                isFriendWithUser(user.id);

              return (
                <UserCard
                  key={user.id}
                  user={user}
                  onProfileOpen={() =>
                    handleProfileOpen(user.id)
                  }
                >
                  <button
                    type="button"
                    disabled={isFollowLoading}
                    onClick={() =>
                      user.is_following
                        ? handleUnfollow(user.id)
                        : handleFollow(user.id)
                    }
                    onMouseEnter={() =>
                      setHoveredFollowUserId(user.id)
                    }
                    onMouseLeave={() =>
                      setHoveredFollowUserId(null)
                    }
                    className={`min-w-24 rounded-xl px-4 py-2 text-xs font-black transition-all duration-200 ${
                      user.is_following
                        ? hoveredFollowUserId === user.id
                          ? "border border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                          : "border border-slate-200 bg-slate-100 text-slate-700"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    } ${
                      isFollowLoading
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }`}
                  >
                    {isFollowLoading
                      ? "Please wait..."
                      : user.is_following
                      ? hoveredFollowUserId === user.id
                        ? "Unfollow"
                        : "Following"
                      : getFollowButtonText(user)}
                  </button>

                  {isFriend && (
                    <button
                      type="button"
                      onClick={() => navigate("/friends")}
                      className="min-w-28 cursor-pointer rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Friends
                    </button>
                  )}

                  {!isFriend &&
                    sentRequest && (
                      <button
                        type="button"
                        disabled={isFriendLoading}
                        onClick={() =>
                          handleCancelFriendRequest(
                            sentRequest.id,
                            user.id
                          )
                        }
                        className={`min-w-28 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-100 ${
                          isFriendLoading
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        }`}
                      >
                        {isFriendLoading
                          ? "Cancelling..."
                          : "Request Sent"}
                      </button>
                    )}

                  {!isFriend &&
                    receivedRequest && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isFriendLoading}
                          onClick={() =>
                            handleAcceptFriendRequest(
                              receivedRequest.id,
                              user.id
                            )
                          }
                          className={`rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-700 ${
                            isFriendLoading
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer"
                          }`}
                        >
                          {isFriendLoading
                            ? "Please wait..."
                            : "Accept"}
                        </button>

                        <button
                          type="button"
                          disabled={isFriendLoading}
                          onClick={() =>
                            handleRejectFriendRequest(
                              receivedRequest.id,
                              user.id
                            )
                          }
                          className={`rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100 ${
                            isFriendLoading
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer"
                          }`}
                        >
                          Reject
                        </button>
                      </div>
                    )}

                  {!isFriend &&
                    !sentRequest &&
                    !receivedRequest && (
                      <button
                        type="button"
                        disabled={isFriendLoading}
                        onClick={() =>
                          handleSendFriendRequest(user.id)
                        }
                        className={`min-w-28 rounded-xl border border-indigo-600 bg-white px-4 py-2 text-xs font-black text-indigo-600 transition hover:bg-indigo-50 ${
                          isFriendLoading
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        }`}
                      >
                        {isFriendLoading
                          ? "Sending..."
                          : "Add Friend"}
                      </button>
                    )}
                </UserCard>
              );
            })}
          </div>
        )}


        {hasMore && (
          <button
            type="button"
            onClick={() =>
              fetchUsers(offset, true, searchQuery)
            }
            disabled={loadingMore}
            className="mt-6 w-full rounded-xl bg-slate-200 px-4 py-3 text-xs font-black text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingMore
              ? "Loading..."
              : "Load More People"}
          </button>
        )}
      </main>
    </div>
  );
}

export default DiscoverUsers;
