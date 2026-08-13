import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { getMe } from "../api/auth";
import {
  getFeedPosts,
  createPost,
  updatePost,
  deletePost,
  archivePost,
  unarchivePost,
  likePost,
} from "../api/posts";
import { getUserSuggestions } from "../api/users";
import { sendFriendRequest } from "../api/friends";
import { showConfirmation } from "../utils/confirmDialog";

// Helper function to safely parse API error details as strings
const getErrorMessage = (err, fallbackMessage) => {
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail[0]?.msg || fallbackMessage;
  }
  return fallbackMessage;
};

function useDashboard() {
  const navigate = useNavigate();

  // Core App State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Suggested Users State
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Feed State
  const [posts, setPosts] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [postFiles, setPostFiles] = useState([]);
  const [postLoading, setPostLoading] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);

  // Edit Post State
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [removedMediaIds, setRemovedMediaIds] = useState([]);

  // Concurrency Guard
  const feedRequestRunning = useRef(false);

  const hasChanges =
    editContent.trim() !== originalContent.trim() ||
    selectedFiles.length > 0 ||
    removedMediaIds.length > 0;

  const allowedFileTypes = ["image/", "video/"];

  const validatePostFiles = (files) => {
    if (!Array.isArray(files)) return false;
    return files.every((file) =>
      allowedFileTypes.some((type) => file.type?.startsWith(type))
    );
  };

  // Safe Post Fetcher
  const fetchPosts = useCallback(async (pageNumber = 1, replace = false) => {
    if (feedRequestRunning.current) return;

    try {
      feedRequestRunning.current = true;
      setFeedLoading(true);

      const data = await getFeedPosts({ page: pageNumber, limit: 10 });

      const receivedPosts = data?.posts || [];

      setPosts((previousPosts) => {
        if (replace) return receivedPosts;

        const uniquePosts = new Map();
        [...previousPosts, ...receivedPosts].forEach((post) => {
          if (post?.id) uniquePosts.set(post.id, post);
        });

        return Array.from(uniquePosts.values());
      });

      setPage(pageNumber);
      setHasMore(Boolean(data?.has_more));
    } catch (err) {
      console.error("Failed to fetch personalized feed:", err);
      toast.error(getErrorMessage(err, "Failed to load feed."));
    } finally {
      feedRequestRunning.current = false;
      setFeedLoading(false);
    }
  }, []);

  // Fetch Suggested Users - Safe string parsing prevents white screen crash
  const fetchSuggestedUsers = useCallback(async () => {
    try {
      setSuggestionsLoading(true);
      const data = await getUserSuggestions();
      setSuggestedUsers(data || []);
    } catch (err) {
      console.error("Failed to fetch suggested users:", err);
      toast.error(getErrorMessage(err, "Failed to load suggestions."));
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  const refreshFeed = useCallback(async () => {
    setPage(1);
    setHasMore(true);
    await fetchPosts(1, true);
  }, [fetchPosts]);

  const loadMorePosts = useCallback(() => {
    if (feedRequestRunning.current || !hasMore) return;
    fetchPosts(page + 1, false);
  }, [fetchPosts, hasMore, page]);

  // Initial Authentication & Parallel Data Bootstrap
  useEffect(() => {
    let isMounted = true;

    const fetchUserAndFeed = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const data = await getMe();

        if (!isMounted) return;

        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));

        // Fetch feed and suggestions in parallel
        await Promise.all([fetchPosts(1, true), fetchSuggestedUsers()]);
      } catch (err) {
        if (!isMounted) return;

        console.error("Failed to load dashboard:", err);
        setError("Session expired. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserAndFeed();

    return () => {
      isMounted = false;
    };
  }, [fetchPosts, fetchSuggestedUsers, navigate]);

  // Optimized Friend Request Handler
  const handleAddFriend = useCallback(async (userId) => {
    try {
      await sendFriendRequest(userId);
      toast.success("Friend request sent.");

      setSuggestedUsers((previousUsers) =>
        previousUsers.map((u) =>
          u.id === userId
            ? {
                ...u,
                friendship_status: "pending_sent",
              }
            : u
        )
      );
    } catch (err) {
      console.error("Failed to send friend request:", err);
      toast.error(getErrorMessage(err, "Failed to send friend request."));
    }
  }, []);

  // Post Handlers
  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!postContent.trim() && postFiles.length === 0) {
      toast.error("Please write something or select a file.");
      return;
    }

    if (postFiles.length > 0 && !validatePostFiles(postFiles)) {
      toast.error("Only image and video files are allowed.");
      return;
    }

    try {
      setPostLoading(true);

      const formData = new FormData();
      if (postContent.trim()) {
        formData.append("content", postContent.trim());
      }

      postFiles.forEach((file) => {
        formData.append("files", file);
      });

      await createPost(formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPostContent("");
      setPostFiles([]);
      toast.success("Post created successfully.");
      await refreshFeed();
    } catch (err) {
      console.error("Failed to create post:", err);
      toast.error(getErrorMessage(err, "Failed to create post"));
    } finally {
      setPostLoading(false);
    }
  };

  const handleSharePost = async (postId) => {
    try {
      const formData = new FormData();
      formData.append("original_post_id", postId);

      await createPost(formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Post shared successfully.");
      await refreshFeed();
    } catch (err) {
      console.error("Failed to share post:", err);
      toast.error(getErrorMessage(err, "Failed to share post"));
    }
  };

  const handleDeletePost = async (postId) => {
    const result = await showConfirmation({
      title: "Delete this post?",
      text: "This post will be removed from your profile and feed.",
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deletePost(postId);
      toast.success("Post deleted successfully.");
      await refreshFeed();
    } catch (err) {
      console.error("Failed to delete post:", err);
      toast.error(getErrorMessage(err, "Failed to delete the post."));
    }
  };

  const handleArchivePost = async (postId) => {
    const result = await showConfirmation({
      title: "Archive this post?",
      text: "The post will be hidden from the feed but will remain available on your profile.",
      confirmButtonText: "Archive",
      confirmButtonClass: "bg-yellow-600 hover:bg-yellow-700",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await archivePost(postId);
      toast.success("Post archived successfully.");
      await refreshFeed();
    } catch (err) {
      console.error("Failed to archive post:", err);
      toast.error(getErrorMessage(err, "Failed to archive the post."));
    }
  };

  const handleUnarchivePost = async (postId) => {
    const result = await showConfirmation({
      title: "Restore this post?",
      text: "The post will become visible in the feed again.",
      confirmButtonText: "Restore",
      confirmButtonClass: "bg-indigo-600 hover:bg-indigo-700",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await unarchivePost(postId);
      toast.success("Post restored successfully.");
      await refreshFeed();
    } catch (err) {
      console.error("Failed to restore post:", err);
      toast.error(getErrorMessage(err, "Failed to restore the post."));
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const data = await likePost(postId);

      setPosts((previousPosts) =>
        previousPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes_count: data?.likes_count ?? post.likes_count,
                is_liked_by_me: data?.liked ?? !post.is_liked_by_me,
              }
            : post
        )
      );
    } catch (err) {
      console.error("Failed to like post:", err);
      toast.error(getErrorMessage(err, "Failed to like post"));
    }
  };

  const startEditing = (post) => {
    if (!post) return;
    setEditingPostId(post.id);
    setEditContent(post.content || "");
    setOriginalContent(post.content || "");
    setSelectedFiles([]);
    setRemovedMediaIds([]);
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditContent("");
    setOriginalContent("");
    setSelectedFiles([]);
    setRemovedMediaIds([]);
  };

  const handleUpdatePost = async (postId) => {
    if (!hasChanges) {
      cancelEditing();
      return;
    }

    if (
      !editContent.trim() &&
      selectedFiles.length === 0 &&
      removedMediaIds.length === 0
    ) {
      toast.error("Post cannot be empty.");
      return;
    }

    try {
      setIsSaving(true);

      const formData = new FormData();

      formData.append("content", editContent.trim());

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      removedMediaIds.forEach((id) => {
        formData.append("removed_media_ids", id);
      });

      const data = await updatePost(postId, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedPost = data;

      setPosts((previousPosts) =>
        previousPosts.map((post) =>
          post.id === postId ? updatedPost : post
        )
      );

      toast.success("Post updated successfully.");

      cancelEditing();
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed to update post"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    const result = await showConfirmation({
      title: "Logout?",
      text: "Are you sure you want to logout from your account?",
      confirmButtonText: "Logout",
      confirmButtonClass: "bg-red-600 hover:bg-red-700",
    });

    if (!result.isConfirmed) {
      return;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    toast.success("Logged out successfully.");

    navigate("/login", {
      replace: true,
    });
  };

  const goToProfile = () => {
    navigate("/profile");
  };

  return {
    user,
    loading,
    error,

    suggestedUsers,
    suggestionsLoading,
    fetchSuggestedUsers,

    posts,
    postContent,
    setPostContent,
    postFiles,
    setPostFiles,
    postLoading,

    page,
    hasMore,
    feedLoading,
    loadMorePosts,
    refreshFeed,

    editingPostId,
    editContent,
    setEditContent,
    originalContent,
    isSaving,
    hasChanges,
    selectedFiles,
    setSelectedFiles,
    removedMediaIds,
    setRemovedMediaIds,

    handleAddFriend,
    handleCreatePost,
    handleSharePost,
    handleDeletePost,
    handleArchivePost,
    handleUnarchivePost,
    handleLikePost,
    startEditing,
    cancelEditing,
    handleUpdatePost,
    handleLogout,
    goToProfile,
  };
}

export default useDashboard;