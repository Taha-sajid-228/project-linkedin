import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

import API from "../api/axios";
import AdminLayout from "../layouts/AdminLayout";
import ActionButton from "../components/ActionButton";
import { PostStatusBadge } from "../components/StatusBadges";
import SearchInput from "../components/SearchInput";
import InlineErrorPanel from "../components/InlineErrorPanel";


const PAGE_LIMIT = 10;


function AdminPosts() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionPostId, setActionPostId] = useState(null);
  const [error, setError] = useState("");

  const [admin, setAdmin] = useState(null);


  const fetchCurrentAdmin = useCallback(async () => {
    try {
      const response = await API.get("/me");
      setAdmin(response.data);
    } catch (requestError) {
      console.error(
        "Failed to load current admin:",
        requestError
      );
    }
  }, []);


  const fetchPosts = useCallback(async () => {
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

      const response = await API.get("/admin/posts", {
        params,
      });

      setPosts(response.data.posts || []);
      setTotal(response.data.total || 0);
      setHasMore(Boolean(response.data.has_more));
    } catch (requestError) {
      console.error(
        "Failed to load admin posts:",
        requestError
      );

      const status = requestError.response?.status;

      const message =
        requestError.response?.data?.detail ||
        "Failed to load posts.";

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
    fetchPosts();
  }, [fetchPosts]);


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


  const handleArchivePost = async (post) => {
    const result = await Swal.fire({
      title: "Archive this post?",
      text: "This post will no longer appear in the normal active feed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, archive post",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d97706",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setActionPostId(post.id);

      const response = await API.patch(
        `/admin/posts/${post.id}/archive`
      );

      toast.success(
        response.data.message ||
        "Post archived successfully."
      );

      await fetchPosts();
    } catch (requestError) {
      console.error(
        "Failed to archive post:",
        requestError
      );

      toast.error(
        requestError.response?.data?.detail ||
        "Failed to archive post."
      );
    } finally {
      setActionPostId(null);
    }
  };


  const handleUnarchivePost = async (post) => {
    const result = await Swal.fire({
      title: "Unarchive this post?",
      text: "This post will become active again.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, unarchive post",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#4f46e5",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setActionPostId(post.id);

      const response = await API.patch(
        `/admin/posts/${post.id}/unarchive`
      );

      toast.success(
        response.data.message ||
        "Post unarchived successfully."
      );

      await fetchPosts();
    } catch (requestError) {
      console.error(
        "Failed to unarchive post:",
        requestError
      );

      toast.error(
        requestError.response?.data?.detail ||
        "Failed to unarchive post."
      );
    } finally {
      setActionPostId(null);
    }
  };


  const handleDeletePost = async (post) => {
    const result = await Swal.fire({
      title: "Delete this post?",
      html: `
        <p>
          This post by
          <strong>${post.author?.username || "Unknown user"}</strong>
          will be soft deleted.
        </p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete post",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setActionPostId(post.id);

      const response = await API.delete(
        `/admin/posts/${post.id}`
      );

      toast.success(
        response.data.message ||
        "Post deleted successfully."
      );

      if (posts.length === 1 && offset > 0) {
        setOffset((currentOffset) =>
          Math.max(0, currentOffset - PAGE_LIMIT)
        );
      } else {
        await fetchPosts();
      }
    } catch (requestError) {
      console.error(
        "Failed to delete post:",
        requestError
      );

      toast.error(
        requestError.response?.data?.detail ||
        "Failed to delete post."
      );
    } finally {
      setActionPostId(null);
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
            Manage Posts
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Search, filter, archive, restore and soft delete
            platform posts.
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
              placeholder="Search content, username, email or name..."
            />

            <select
              value={statusFilter}
              onChange={handleFilterChange}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">
                All non-deleted posts
              </option>

              <option value="active">
                Active posts
              </option>

              <option value="archived">
                Archived posts
              </option>

              <option value="deleted">
                Deleted posts
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
                Posts
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {total} post{total === 1 ? "" : "s"} found
              </p>
            </div>

            <button
              type="button"
              onClick={fetchPosts}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <LoadingState />
          ) : error ? (
            <InlineErrorPanel message={error} onRetry={fetchPosts} />
          ) : posts.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <TableHeading>Post</TableHeading>
                    <TableHeading>Author</TableHeading>
                    <TableHeading>Engagement</TableHeading>
                    <TableHeading>Status</TableHeading>
                    <TableHeading>Created</TableHeading>

                    <TableHeading align="right">
                      Actions
                    </TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {posts.map((post) => {
                    const actionLoading =
                      actionPostId === post.id;

                    return (
                      <tr
                        key={post.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div
                            onClick={() =>
                              navigate(`/posts/${post.id}`)
                            }
                            className="min-w-[280px] max-w-md cursor-pointer"
                          >
                            <p className="line-clamp-3 text-sm font-semibold leading-relaxed text-slate-800">
                              {post.content ||
                                "This post has no text content."}
                            </p>

                            {post.media?.length > 0 && (
                              <div className="mt-3 flex items-center gap-2">
                                <img
                                  src={post.media[0].file_url}
                                  alt="Post media"
                                  className="h-16 w-16 rounded-lg border object-cover"
                                />

                                {post.media.length > 1 && (
                                  <span className="rounded bg-indigo-100 px-2 py-1 text-[10px] font-bold text-indigo-700">
                                    +{post.media.length - 1} more
                                  </span>
                                )}
                              </div>
                            )}

                            <p className="mt-2 text-[10px] font-semibold text-slate-400">
                              Post ID: {post.id}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex min-w-[190px] items-center gap-3">
                            {post.author?.profile_picture ? (
                              <img
                                src={
                                  post.author.profile_picture
                                }
                                alt={
                                  post.author.username
                                }
                                className="h-9 w-9 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-xs font-black uppercase text-indigo-700">
                                {getAuthorInitials(
                                  post.author
                                )}
                              </div>
                            )}

                            <div
                              className="cursor-pointer"
                              onClick={() =>
                                navigate(`/profile/${post.author.id}`)
                              }
                            >
                              <p className="text-xs font-bold text-slate-900">
                                {post.author?.name ||
                                  post.author?.username ||
                                  "Unknown user"}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                @
                                {post.author?.username ||
                                  "unknown"}
                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-400">
                                {post.author?.email}
                              </p>

                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  navigate(
                                    `/profile/${post.author.id}`
                                  );
                                }}
                                className="mt-2 text-[10px] font-bold text-indigo-600 hover:underline"
                              >
                                View Profile
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="min-w-[130px] space-y-1 text-xs font-semibold text-slate-500">
                            <p>
                              ❤️ {post.likes_count || 0} Likes
                            </p>

                            <p>
                              💬 {post.comments_count || 0} Comments
                            </p>

                            <p>
                              🔄 {post.reshare_count || 0} Shares
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <PostStatusBadge post={post} />
                        </td>

                        <td className="px-5 py-4">
                          <span className="whitespace-nowrap text-xs font-semibold text-slate-500">
                            {formatDate(post.created_at)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex min-w-[240px] flex-wrap justify-end gap-2">
                            <ActionButton
                              label="View"
                              onClick={() =>
                                navigate(`/posts/${post.id}`)
                              }
                            />

                            {post.is_deleted ? (
                              <span className="rounded-lg bg-red-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-600">
                                Deleted
                              </span>
                            ) : (
                              <>
                                {post.is_archived ? (
                                  <ActionButton
                                    label="Unarchive"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      handleUnarchivePost(post)
                                    }
                                  />
                                ) : (
                                  <ActionButton
                                    label="Archive"
                                    variant="warning"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      handleArchivePost(post)
                                    }
                                  />
                                )}

                                <ActionButton
                                  label="Delete"
                                  variant="danger"
                                  disabled={actionLoading}
                                  onClick={() =>
                                    handleDeletePost(post)
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
      className={`px-5 py-3 ${alignmentClass} text-[10px] font-extrabold uppercase tracking-wider text-slate-400`}
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
        Loading posts...
      </p>
    </div>
  );
}


function EmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
        📝
      </div>

      <h3 className="mt-3 text-sm font-black text-slate-900">
        No posts found
      </h3>

      <p className="mt-1 text-xs text-slate-500">
        Search ya filter change karke dobara try karo.
      </p>
    </div>
  );
}


function getAuthorInitials(author) {
  const displayName =
    author?.name ||
    author?.username ||
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


export default AdminPosts;