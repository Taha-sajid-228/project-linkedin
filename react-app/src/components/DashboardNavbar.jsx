import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  getReceivedFriendRequests,
} from "../api/friends";
import {
  getConversations,
} from "../api/chat";


function DashboardNavbar({
  user,
  onLogout,
  onGoProfile,
}) {
  const navigate = useNavigate();

  const [hasFriendNotifications, setHasFriendNotifications] =
    useState(false);

  const [hasMessageNotifications, setHasMessageNotifications] =
    useState(false);


  // ==========================
  // Load Navbar Notifications
  // ==========================

  const loadNotifications = useCallback(async () => {
    const [
      friendRequestsResult,
      conversationsResult,
    ] = await Promise.allSettled([
      getReceivedFriendRequests(),
      getConversations(),
    ]);

    if (
      friendRequestsResult.status === "fulfilled"
    ) {
      const receivedRequests =
        friendRequestsResult.value?.requests || [];

      setHasFriendNotifications(
        receivedRequests.length > 0
      );
    }

    if (
      conversationsResult.status === "fulfilled"
    ) {
      const conversations =
        conversationsResult.value?.conversations || [];

      const hasUnreadMessages =
        conversations.some(
          (conversation) =>
            (conversation.unread_count || 0) > 0
        );

      setHasMessageNotifications(
        hasUnreadMessages
      );
    }
  }, []);


  // ==========================
  // Notification Polling
  // ==========================

  useEffect(() => {
    loadNotifications();

    const intervalId = window.setInterval(
      loadNotifications,
      10000
    );

    const handleWindowFocus = () => {
      loadNotifications();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadNotifications();
      }
    };

    window.addEventListener(
      "focus",
      handleWindowFocus
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearInterval(intervalId);

      window.removeEventListener(
        "focus",
        handleWindowFocus
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [loadNotifications]);


  const handleOpenFriends = () => {
    navigate("/friends");
  };


  const handleOpenMessages = () => {
    navigate("/messages");
  };


  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 shadow-xs backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex flex-1 items-center gap-4">
          {/* Brand Logo */}
          <div
            className="flex cursor-pointer items-center gap-2"
            onClick={onGoProfile}
          >
            <svg
              className="h-8 w-8 text-indigo-600"
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
              Link
              <span className="text-indigo-600">
                Loop
              </span>
            </span>
          </div>

          {/* Search bar */}
          <div className="hidden w-72 items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 transition-all duration-200 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-600/10 md:flex">
            <svg
              className="mr-2 h-4.5 w-4.5 text-slate-400"
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
              className="w-full border-none bg-transparent text-xs font-medium text-slate-900 outline-none placeholder-slate-400"
            />
          </div>
        </div>

        <nav className="flex items-center gap-6">
          {/* Home Button */}
          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
            className="group flex cursor-pointer flex-col items-center justify-center text-slate-500 transition-colors hover:text-indigo-600"
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

            <span className="mt-1 hidden text-[10px] font-bold uppercase tracking-wider sm:inline">
              Home
            </span>
          </button>

          {/* Network Button */}
          <button
            type="button"
            onClick={() =>
              navigate("/discover")
            }
            className="flex cursor-pointer flex-col items-center justify-center text-slate-500 transition-colors hover:text-indigo-600"
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

            <span className="mt-1 hidden text-[10px] font-bold uppercase tracking-wider sm:inline">
              Network
            </span>
          </button>

          {/* Friends Button */}
          <button
            type="button"
            onClick={handleOpenFriends}
            className="relative flex cursor-pointer flex-col items-center justify-center text-slate-500 transition-colors hover:text-indigo-600"
          >
            <div className="relative">
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

              {hasFriendNotifications && (
                <span
                  aria-label="New friend request"
                  className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500"
                />
              )}
            </div>

            <span className="mt-1 hidden text-[10px] font-bold uppercase tracking-wider sm:inline">
              Friends
            </span>
          </button>

          {/* Messages Button */}
          <button
            type="button"
            onClick={handleOpenMessages}
            className="relative flex cursor-pointer flex-col items-center justify-center text-slate-500 transition-colors hover:text-indigo-600"
          >
            <div className="relative">
              <svg
                className="h-5 w-5 text-current"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
              </svg>

              {hasMessageNotifications && (
                <span
                  aria-label="Unread messages"
                  className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500"
                />
              )}
            </div>

            <span className="mt-1 hidden text-[10px] font-bold uppercase tracking-wider sm:inline">
              Messages
            </span>
          </button>

          {/* Jobs Button */}
          <button
            type="button"
            className="flex cursor-pointer flex-col items-center justify-center text-slate-500 transition-colors hover:text-indigo-600"
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
              <rect
                width="20"
                height="14"
                x="2"
                y="7"
                rx="2"
                ry="2"
              />

              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>

            <span className="mt-1 hidden text-[10px] font-bold uppercase tracking-wider sm:inline">
              Jobs
            </span>
          </button>

          {/* Profile Button */}
          <button
            type="button"
            onClick={onGoProfile}
            className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-200 transition-all duration-150 hover:bg-indigo-700 active:scale-95"
          >
            Profile
          </button>

          {/* User Section & Logout */}
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="flex items-center gap-2">
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={
                    user.username ||
                    "User avatar"
                  }
                  className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-xs">
                  {user?.username
                    ?.substring(0, 2)
                    .toUpperCase() || "U"}
                </div>
              )}

              <div className="hidden text-left lg:block">
                <p className="text-xs font-bold leading-none text-slate-800">
                  {user?.username}
                </p>

                <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition-all hover:border-red-150 hover:bg-red-50 hover:text-red-600 active:scale-95"
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