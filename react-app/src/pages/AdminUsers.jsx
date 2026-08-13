import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

import { getMe } from "../api/auth";
import {
  getAdminUsers,
  blockUser,
  unblockUser,
  deleteUser,
} from "../api/admin";
import AdminLayout from "../layouts/AdminLayout";
import ActionButton from "../components/ActionButton";
import { RoleBadge, UserStatusBadge } from "../components/StatusBadges";
import SearchInput from "../components/SearchInput";
import InlineErrorPanel from "../components/InlineErrorPanel";


const PAGE_LIMIT = 10;


function AdminUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState(null);
  const [error, setError] = useState("");

  const [admin, setAdmin] = useState(null);


  const fetchCurrentAdmin = useCallback(async () => {
    try {
      const adminData = await getMe();
      setAdmin(adminData);
    } catch (requestError) {
      console.error(
        "Failed to load current admin:",
        requestError
      );
    }
  }, []);


  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        limit: PAGE_LIMIT,
        offset,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (statusFilter) {
        params.status = statusFilter;
      }

      const data = await getAdminUsers(params);

      setUsers(data.users || []);
      setTotal(data.total || 0);
      setHasMore(Boolean(data.has_more));
    } catch (requestError) {
      console.error(
        "Failed to load admin users:",
        requestError
      );

      const status = requestError.response?.status;
      const message =
        requestError.response?.data?.detail ||
        "Failed to load users.";

      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      if (status === 403) {
        navigate("/dashboard", {
          replace: true,
        });

        return;
      }

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [
    navigate,
    offset,
    search,
    statusFilter,
  ]);


  useEffect(() => {
    fetchCurrentAdmin();
  }, [fetchCurrentAdmin]);


  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);


  const handleSearchSubmit = (event) => {
    event.preventDefault();

    setOffset(0);
    setSearch(searchInput);
  };


  const handleFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setOffset(0);
  };


  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setOffset(0);
  };


  const handleBlockUser = async (user) => {
    const result = await Swal.fire({
      title: "Block this user?",
      text: `${user.username} will no longer be able to log in or use the platform.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, block user",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setActionUserId(user.id);

      const data = await blockUser(user.id);

      toast.success(
        data.message ||
        "User blocked successfully."
      );

      await fetchUsers();
    } catch (requestError) {
      console.error(
        "Failed to block user:",
        requestError
      );

      toast.error(
        requestError.response?.data?.detail ||
        "Failed to block user."
      );
    } finally {
      setActionUserId(null);
    }
  };


  const handleUnblockUser = async (user) => {
    const result = await Swal.fire({
      title: "Unblock this user?",
      text: `${user.username} will be able to access the platform again.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, unblock user",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#4f46e5",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setActionUserId(user.id);

      const data = await unblockUser(user.id);

      toast.success(
        data.message ||
        "User unblocked successfully."
      );

      await fetchUsers();
    } catch (requestError) {
      console.error(
        "Failed to unblock user:",
        requestError
      );

      toast.error(
        requestError.response?.data?.detail ||
        "Failed to unblock user."
      );
    } finally {
      setActionUserId(null);
    }
  };


  const handleDeleteUser = async (user) => {
    const result = await Swal.fire({
      title: "Delete this user?",
      html: `
        <p>
          <strong>${user.username}</strong> will be soft deleted
          and blocked from using the platform.
        </p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete user",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setActionUserId(user.id);

      const data = await deleteUser(user.id);

      toast.success(
        data.message ||
        "User deleted successfully."
      );

      if (users.length === 1 && offset > 0) {
        setOffset((currentOffset) =>
          Math.max(0, currentOffset - PAGE_LIMIT)
        );
      } else {
        await fetchUsers();
      }
    } catch (requestError) {
      console.error(
        "Failed to delete user:",
        requestError
      );

      toast.error(
        requestError.response?.data?.detail ||
        "Failed to delete user."
      );
    } finally {
      setActionUserId(null);
    }
  };


  const currentPage =
    Math.floor(offset / PAGE_LIMIT) + 1;

  const totalPages = Math.max(
    1,
    Math.ceil(total / PAGE_LIMIT)
  );


  return (
    <AdminLayout user={admin}>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-extrabold uppercase tracking-widest text-indigo-600">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Manage Users
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Search, filter, block, unblock and soft delete
            platform users.
          </p>
        </div>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_auto_auto]"
          >
            <SearchInput
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Search by username, email or name..."
            />

            <select
              value={statusFilter}
              onChange={handleFilterChange}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">
                All non-deleted users
              </option>
              <option value="active">
                Active users
              </option>
              <option value="blocked">
                Blocked users
              </option>
              <option value="deleted">
                Deleted users
              </option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-indigo-700 active:scale-95"
            >
              Search
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95"
            >
              Reset
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Users
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {total} user{total === 1 ? "" : "s"} found
              </p>
            </div>

            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <LoadingState />
          ) : error ? (
            <InlineErrorPanel message={error} onRetry={fetchUsers} />
          ) : users.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <TableHeading>User</TableHeading>
                    <TableHeading>Role</TableHeading>
                    <TableHeading>Provider</TableHeading>
                    <TableHeading>Status</TableHeading>
                    <TableHeading>Joined</TableHeading>
                    <TableHeading align="right">
                      Actions
                    </TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => {
                    const actionLoading =
                      actionUserId === user.id;

                    return (
                      <tr
                        key={user.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex min-w-[240px] items-center gap-3">
                            {user.profile_picture ? (
                              <img
                                src={user.profile_picture}
                                alt={user.username}
                                className="h-10 w-10 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-xs font-black uppercase text-indigo-700">
                                {getInitials(user)}
                              </div>
                            )}

                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {user.name ||
                                  user.username}
                              </p>

                              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                                @{user.username}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <RoleBadge role={user.role} />
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-xs font-semibold capitalize text-slate-600">
                            {user.provider}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <UserStatusBadge user={user} />
                        </td>

                        <td className="px-5 py-4">
                          <span className="whitespace-nowrap text-xs font-semibold text-slate-500">
                            {formatDate(user.created_at)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex min-w-[230px] justify-end gap-2">
                            {user.role === "admin" ? (
                              <span className="rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Protected Admin
                              </span>
                            ) : user.is_deleted ? (
                              <span className="rounded-lg bg-red-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-600">
                                Deleted
                              </span>
                            ) : (
                              <>
                                {user.is_blocked ? (
                                  <ActionButton
                                    label="Unblock"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      handleUnblockUser(user)
                                    }
                                  />
                                ) : (
                                  <ActionButton
                                    label="Block"
                                    variant="warning"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      handleBlockUser(user)
                                    }
                                  />
                                )}

                                <ActionButton
                                  label="Delete"
                                  variant="danger"
                                  disabled={actionLoading}
                                  onClick={() =>
                                    handleDeleteUser(user)
                                  }
                                />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && total > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-slate-500">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={offset === 0}
                  onClick={() =>
                    setOffset((currentOffset) =>
                      Math.max(
                        0,
                        currentOffset - PAGE_LIMIT
                      )
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={!hasMore}
                  onClick={() =>
                    setOffset(
                      (currentOffset) =>
                        currentOffset + PAGE_LIMIT
                    )
                  }
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </AdminLayout>
  );
}


function TableHeading({
  children,
  align = "left",
}) {
  const alignmentClass =
    align === "right"
      ? "text-right"
      : "text-left";

  return (
    <th
      className={`px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 ${alignmentClass}`}
    >
      {children}
    </th>
  );
}





function LoadingState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-3">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />

      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Loading users...
      </p>
    </div>
  );
}





function EmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
        👤
      </div>

      <h3 className="mt-3 text-sm font-black text-slate-900">
        No users found
      </h3>

      <p className="mt-1 text-xs text-slate-500">
        Search ya filter change karke dobara try karo.
      </p>
    </div>
  );
}


function getInitials(user) {
  const displayName =
    user.name ||
    user.username ||
    "User";

  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
}


function formatDate(dateValue) {
  if (!dateValue) {
    return "Unknown";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


export default AdminUsers;