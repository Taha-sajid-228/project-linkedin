import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  acceptFriendRequest,
  cancelFriendRequest,
  getFriends,
  getReceivedFriendRequests,
  getSentFriendRequests,
  rejectFriendRequest,
  removeFriend,
} from "../api/friends";
import { createConversation } from "../api/chat";


function Friends() {
  const navigate = useNavigate();

  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");


  // ==========================
  // Fetch Friend Data
  // ==========================

  const fetchFriendData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        receivedResponse,
        sentResponse,
        friendsResponse,
      ] = await Promise.all([
        getReceivedFriendRequests(),
        getSentFriendRequests(),
        getFriends(),
      ]);

      setReceivedRequests(
        receivedResponse?.requests || []
      );

      setSentRequests(
        sentResponse?.requests || []
      );

      setFriends(
        friendsResponse?.friends || []
      );
    } catch (requestError) {
      console.error(
        "Failed to load friend data:",
        requestError
      );

      const message =
        requestError.response?.data?.detail ||
        "Failed to load friend data.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchFriendData();
  }, [fetchFriendData]);


  // ==========================
  // Accept Request
  // ==========================

  const handleAcceptRequest = async (
    requestId
  ) => {
    try {
      setActionLoading(
        `accept-${requestId}`
      );

      const response =
        await acceptFriendRequest(
          requestId
        );

      toast.success(
        response?.message ||
        "Friend request accepted."
      );

      await fetchFriendData();
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.detail ||
        "Failed to accept friend request."
      );
    } finally {
      setActionLoading(null);
    }
  };


  // ==========================
  // Reject Request
  // ==========================

  const handleRejectRequest = async (
    requestId
  ) => {
    try {
      setActionLoading(
        `reject-${requestId}`
      );

      const response =
        await rejectFriendRequest(
          requestId
        );

      toast.success(
        response?.message ||
        "Friend request rejected."
      );

      await fetchFriendData();
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.detail ||
        "Failed to reject friend request."
      );
    } finally {
      setActionLoading(null);
    }
  };


  // ==========================
  // Cancel Request
  // ==========================

  const handleCancelRequest = async (
    requestId
  ) => {
    try {
      setActionLoading(
        `cancel-${requestId}`
      );

      const response =
        await cancelFriendRequest(
          requestId
        );

      toast.success(
        response?.message ||
        "Friend request cancelled."
      );

      await fetchFriendData();
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.detail ||
        "Failed to cancel friend request."
      );
    } finally {
      setActionLoading(null);
    }
  };


  // ==========================
  // Remove Friend
  // ==========================

  const handleRemoveFriend = async (
    userId
  ) => {
    const shouldRemove = window.confirm(
      "Are you sure you want to remove this friend?"
    );

    if (!shouldRemove) {
      return;
    }

    try {
      setActionLoading(
        `remove-${userId}`
      );

      const response =
        await removeFriend(userId);

      toast.success(
        response?.message ||
        "Friend removed successfully."
      );

      await fetchFriendData();
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.detail ||
        "Failed to remove friend."
      );
    } finally {
      setActionLoading(null);
    }
  };


  // ==========================
  // Start Conversation
  // ==========================

  const handleStartConversation = async (
    userId
  ) => {
    try {
      setActionLoading(
        `chat-${userId}`
      );

      const response =
        await createConversation(userId);

      navigate("/messages", {
        state: {
          conversationId:
            response.conversation.id,
        },
      });
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.detail ||
        "Failed to start conversation."
      );
    } finally {
      setActionLoading(null);
    }
  };


  // ==========================
  // Loading Screen
  // ==========================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />

          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Loading Friends...
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
            className="cursor-pointer text-xl font-black tracking-tight text-slate-900"
          >
            Link
            <span className="text-indigo-600">
              Loop
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                navigate("/discover")
              }
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
            >
              Discover People
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Back to Feed
            </button>
          </div>
        </div>
      </nav>


      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Friends
            </h1>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Manage your requests and your
              accepted connections.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchFriendData}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5" />
              <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
            </svg>

            Refresh
          </button>
        </div>


        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}


        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Received Requests"
            value={receivedRequests.length}
            icon="received"
          />

          <SummaryCard
            label="Sent Requests"
            value={sentRequests.length}
            icon="sent"
          />

          <SummaryCard
            label="My Friends"
            value={friends.length}
            icon="friends"
          />
        </div>


        <div className="space-y-6">
          {/* Received Requests */}
          <FriendSection
            title="Received Requests"
            count={receivedRequests.length}
            description="People waiting for your response."
          >
            {receivedRequests.length === 0 ? (
              <EmptyState
                title="No received requests"
                message="You currently have no pending friend requests."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {receivedRequests.map(
                  (request) => (
                    <UserRow
                      key={request.id}
                      user={request.sender}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleAcceptRequest(
                            request.id
                          )
                        }
                        disabled={
                          actionLoading !== null
                        }
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {actionLoading ===
                        `accept-${request.id}`
                          ? "Accepting..."
                          : "Accept"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRejectRequest(
                            request.id
                          )
                        }
                        disabled={
                          actionLoading !== null
                        }
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {actionLoading ===
                        `reject-${request.id}`
                          ? "Rejecting..."
                          : "Reject"}
                      </button>
                    </UserRow>
                  )
                )}
              </div>
            )}
          </FriendSection>


          {/* Sent Requests */}
          <FriendSection
            title="Sent Requests"
            count={sentRequests.length}
            description="Requests you have sent and are still pending."
          >
            {sentRequests.length === 0 ? (
              <EmptyState
                title="No sent requests"
                message="You have no pending sent friend requests."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {sentRequests.map(
                  (request) => (
                    <UserRow
                      key={request.id}
                      user={request.receiver}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleCancelRequest(
                            request.id
                          )
                        }
                        disabled={
                          actionLoading !== null
                        }
                        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {actionLoading ===
                        `cancel-${request.id}`
                          ? "Cancelling..."
                          : "Cancel Request"}
                      </button>
                    </UserRow>
                  )
                )}
              </div>
            )}
          </FriendSection>


          {/* Friends List */}
          <FriendSection
            title="My Friends"
            count={friends.length}
            description="People you are currently connected with."
          >
            {friends.length === 0 ? (
              <EmptyState
                title="No friends yet"
                message="Go to Discover People and start building your network."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {friends.map(
                  (friendship) => (
                    <UserRow
                      key={
                        friendship.friendship_id
                      }
                      user={friendship.user}
                    >
                      <Link
                        to={`/profile/${friendship.user.id}`}
                        className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-700 transition hover:bg-indigo-100"
                      >
                        View Profile
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          handleStartConversation(
                            friendship.user.id
                          )
                        }
                        disabled={
                          actionLoading !== null
                        }
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {actionLoading ===
                        `chat-${friendship.user.id}`
                          ? "Opening..."
                          : "Message"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveFriend(
                            friendship.user.id
                          )
                        }
                        disabled={
                          actionLoading !== null
                        }
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {actionLoading ===
                        `remove-${friendship.user.id}`
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    </UserRow>
                  )
                )}
              </div>
            )}
          </FriendSection>
        </div>
      </main>
    </div>
  );
}


// ==========================
// Summary Card
// ==========================

function SummaryCard({
  label,
  value,
  icon,
}) {
  const iconBackground = {
    received:
      "bg-indigo-100 text-indigo-700",

    sent:
      "bg-amber-100 text-amber-700",

    friends:
      "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            iconBackground[icon]
          }`}
        >
          {icon === "friends" ? (
            <svg
              className="h-5 w-5"
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
          ) : (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="m19 12-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}


// ==========================
// Section Wrapper
// ==========================

function FriendSection({
  title,
  count,
  description,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-black text-slate-900">
            {title}
          </h2>

          <p className="mt-1 text-xs font-medium text-slate-500">
            {description}
          </p>
        </div>

        <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-indigo-50 px-2 text-xs font-black text-indigo-700">
          {count}
        </span>
      </div>

      {children}
    </section>
  );
}


// ==========================
// User Row
// ==========================

function UserRow({
  user,
  children,
}) {
  const firstLetter =
    user?.name?.charAt(0) ||
    user?.username?.charAt(0) ||
    "U";

  return (
    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {user?.profile_picture ? (
          <img
            src={user.profile_picture}
            alt={
              user.username ||
              "User profile"
            }
            className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-black text-indigo-700">
            {firstLetter.toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-900">
            {user?.name ||
              user?.username ||
              "Unknown User"}
          </p>

          <p className="truncate text-xs font-semibold text-slate-400">
            @{user?.username || "unknown"}
          </p>

          {user?.bio && (
            <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {children}
      </div>
    </div>
  );
}


// ==========================
// Empty State
// ==========================

function EmptyState({
  title,
  message,
}) {
  return (
    <div className="px-5 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 11h-6" />
        </svg>
      </div>

      <h3 className="mt-3 text-sm font-black text-slate-700">
        {title}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-xs font-medium leading-5 text-slate-400">
        {message}
      </p>
    </div>
  );
}


export default Friends;