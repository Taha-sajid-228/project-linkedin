import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import API from "../api/axios";

function useDashboard() {
  const navigate = useNavigate();

  // Core App State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // Concurrency Guard
  const feedRequestRunning = useRef(false);

  const hasChanges = editContent.trim() !== originalContent.trim();
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

      const response = await API.get("/posts/feed", {
        params: { page: pageNumber, limit: 10 },
      });

      const receivedPosts = response.data?.posts || [];

      setPosts((previousPosts) => {
        if (replace) return receivedPosts;

        const uniquePosts = new Map();
        [...previousPosts, ...receivedPosts].forEach((post) => {
          if (post?.id) uniquePosts.set(post.id, post);
        });

        return Array.from(uniquePosts.values());
      });

      setPage(pageNumber);
      setHasMore(Boolean(response.data?.has_more));
    } catch (err) {
      console.error("Failed to fetch personalized feed:", err);
      toast.error(err.response?.data?.detail || "Failed to load feed.");
    } finally {
      feedRequestRunning.current = false;
      setFeedLoading(false);
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

  // Initial Authentication & Bootstrap Effect
  useEffect(() => {
    let isMounted = true;

    const fetchUserAndFeed = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await API.get("/me");

        if (!isMounted) return;

        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));

        // Fetch feed directly after successfully resolving user session
        await fetchPosts(1, true);
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
  }, [fetchPosts, navigate]);

  // Handlers
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

      await API.post("/posts/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPostContent("");
      setPostFiles([]);
      toast.success("Post created successfully.");
      await refreshFeed();
    } catch (err) {
      console.error("Failed to create post:", err);
      toast.error(err.response?.data?.detail || "Failed to create post");
    } finally {
      setPostLoading(false);
    }
  };

  const handleSharePost = async (postId) => {
    try {
      const formData = new FormData();
      formData.append("original_post_id", postId);

      await API.post("/posts/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Post shared successfully.");
      await refreshFeed();
    } catch (err) {
      console.error("Failed to share post:", err);
      toast.error(err.response?.data?.detail || "Failed to share post");
    }
  };

  const handleDeletePost = (postId) => {
    Swal.fire({
      title: "Delete this post?",
      text: "This post will be removed from your profile and feed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-2xl border border-slate-200 bg-white p-6 shadow-xl font-sans",
        title: "text-lg font-black text-slate-900",
        htmlContainer: "text-sm text-slate-500",
        confirmButton: "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-xs mx-2 cursor-pointer transition-all active:scale-95",
        cancelButton: "bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs mx-2 cursor-pointer transition-all active:scale-95",
      },
      buttonsStyling: false,
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        await API.delete(`/posts/${postId}`);
        toast.success("Post deleted successfully.");
        await refreshFeed();
      } catch (err) {
        console.error("Failed to delete post:", err);
        toast.error(err.response?.data?.detail || "Failed to delete the post.");
      }
    });
  };

  const handleArchivePost = (postId) => {
    Swal.fire({
      title: "Archive this post?",
      text: "The post will be hidden from the feed but will remain available on your profile.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Archive",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-2xl border border-slate-200 bg-white p-6 shadow-xl font-sans",
        title: "text-lg font-black text-slate-900",
        htmlContainer: "text-sm text-slate-500",
        confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-xl text-xs mx-2 cursor-pointer transition-all active:scale-95",
        cancelButton: "bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs mx-2 cursor-pointer transition-all active:scale-95",
      },
      buttonsStyling: false,
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        await API.patch(`/posts/${postId}/archive`);
        toast.success("Post archived successfully.");
        await refreshFeed();
      } catch (err) {
        console.error("Failed to archive post:", err);
        toast.error(err.response?.data?.detail || "Failed to archive the post.");
      }
    });
  };

  const handleUnarchivePost = (postId) => {
    Swal.fire({
      title: "Restore this post?",
      text: "The post will become visible in the feed again.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Restore",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-2xl border border-slate-200 bg-white p-6 shadow-xl font-sans",
        title: "text-lg font-black text-slate-900",
        htmlContainer: "text-sm text-slate-500",
        confirmButton: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs mx-2 cursor-pointer transition-all active:scale-95",
        cancelButton: "bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs mx-2 cursor-pointer transition-all active:scale-95",
      },
      buttonsStyling: false,
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        await API.patch(`/posts/${postId}/unarchive`);
        toast.success("Post restored successfully.");
        await refreshFeed();
      } catch (err) {
        console.error("Failed to restore post:", err);
        toast.error(err.response?.data?.detail || "Failed to restore the post.");
      }
    });
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await API.post(`/posts/${postId}/like`);

      setPosts((previousPosts) =>
        previousPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes_count: response.data?.likes_count ?? post.likes_count,
                is_liked_by_me: response.data?.liked ?? !post.is_liked_by_me,
              }
            : post
        )
      );
    } catch (err) {
      console.error("Failed to like post:", err);
      toast.error(err.response?.data?.detail || "Failed to like post");
    }
  };

  const startEditing = (post) => {
    if (!post) return;
    setEditingPostId(post.id);
    setEditContent(post.content || "");
    setOriginalContent(post.content || "");
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditContent("");
    setOriginalContent("");
  };

  const handleUpdatePost = async (postId) => {
    if (editContent.trim() === originalContent.trim()) {
      cancelEditing();
      return;
    }

    if (!editContent.trim()) {
      toast.error("Post content cannot be empty.");
      return;
    }

    try {
      setIsSaving(true);

      await API.put(`/posts/${postId}`, {
        content: editContent.trim(),
      });

      toast.success("Post updated successfully.");
      cancelEditing();
      await refreshFeed();
    } catch (err) {
      console.error("Failed to update post:", err);
      toast.error(err.response?.data?.detail || "Failed to update post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const goToProfile = () => {
    navigate("/profile");
  };

  return {
    user,
    loading,
    error,

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