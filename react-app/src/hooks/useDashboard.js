import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import API from "../api/axios";

function useDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [posts, setPosts] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [postFiles, setPostFiles] = useState([]);
  const [postLoading, setPostLoading] = useState(false);

  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = (editContent || "").trim() !== (originalContent || "").trim();

  const allowedFileTypes = ["image/", "video/"];

  const validatePostFiles = (files) => {
    return files.every((file) =>
      allowedFileTypes.some((type) => file.type.startsWith(type))
    );
  };

  const fetchPosts = async () => {
    try {
      const response = await API.get("/posts/");
      setPosts(response.data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await API.get("/me");

        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));

        await fetchPosts();
      } catch (error) {
        console.error("Failed to load dashboard:", error);

        setError("Session expired. Please log in again.");

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetchUser();
  }, [navigate]);

  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!postContent.trim() && postFiles.length === 0) {
      toast.error("Please write something or select a file.");
      return;
    }

    if (
      postFiles.length > 0 &&
      !validatePostFiles(postFiles)
    ) {
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
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setPostContent("");
      setPostFiles([]);
      toast.success("Post created successfully.");

      await fetchPosts();
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error(
        error.response?.data?.detail ||
          "Failed to create post"
      );
    } finally {
      setPostLoading(false);
    }
  };

  const handleSharePost = async (postId) => {
    try {
      const formData = new FormData();

      formData.append("original_post_id", postId);

      await API.post("/posts/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Post shared successfully.");
      await fetchPosts();
    } catch (error) {
      console.error("Failed to share post:", error);
      toast.error(
        error.response?.data?.detail ||
          "Failed to share post"
      );
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
      if (result.isConfirmed) {
        try {
          await API.delete(`/posts/${postId}`);
          toast.success("Post deleted successfully.");
          await fetchPosts();
        } catch (error) {
          console.error("Failed to delete post:", error);
          toast.error(
            error.response?.data?.detail ||
              "Failed to delete the post."
          );
        }
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
      if (result.isConfirmed) {
        try {
          await API.patch(`/posts/${postId}/archive`);
          toast.success("Post archived successfully.");
          await fetchPosts();
        } catch (error) {
          console.error("Failed to archive post:", error);
          toast.error(
            error.response?.data?.detail ||
              "Failed to archive the post."
          );
        }
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
      if (result.isConfirmed) {
        try {
          await API.patch(`/posts/${postId}/unarchive`);
          toast.success("Post restored successfully.");
          await fetchPosts();
        } catch (error) {
          console.error("Failed to restore post:", error);
          toast.error(
            error.response?.data?.detail ||
              "Failed to restore the post."
          );
        }
      }
    });
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await API.post(
        `/posts/${postId}/like`
      );

      setPosts((previousPosts) =>
        previousPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes_count: response.data.likes_count,
                is_liked_by_me: response.data.liked,
              }
            : post
        )
      );
    } catch (error) {
      console.error("Failed to like post:", error);
      toast.error(
        error.response?.data?.detail ||
          "Failed to like post"
      );
    }
  };

  const startEditing = (post) => {
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
    if ((editContent || "").trim() === (originalContent || "").trim()) {
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
      setEditingPostId(null);
      setEditContent("");
      setOriginalContent("");

      await fetchPosts();
    } catch (error) {
      console.error("Failed to update post:", error);
      toast.error(
        error.response?.data?.detail ||
          "Failed to update post"
      );
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