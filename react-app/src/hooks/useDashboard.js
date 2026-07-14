import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
      alert("Please write something or select a file.");
      return;
    }

    if (
      postFiles.length > 0 &&
      !validatePostFiles(postFiles)
    ) {
      alert("Only image and video files are allowed.");
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

      await fetchPosts();
    } catch (error) {
      console.error("Failed to create post:", error);

      alert(
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

      await fetchPosts();
    } catch (error) {
      console.error("Failed to share post:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to share post"
      );
    }
  };

  const handleDeletePost = async (postId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmed) return;

    try {
      await API.delete(`/posts/${postId}`);

      await fetchPosts();
    } catch (error) {
      console.error("Failed to delete post:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to delete post"
      );
    }
  };

  const handleArchivePost = async (postId) => {
    try {
      await API.patch(`/posts/${postId}/archive`);

      await fetchPosts();
    } catch (error) {
      console.error("Failed to archive post:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to archive post"
      );
    }
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

      alert(
        error.response?.data?.detail ||
          "Failed to like post"
      );
    }
  };

  const startEditing = (post) => {
    setEditingPostId(post.id);
    setEditContent(post.content || "");
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditContent("");
  };

  const handleUpdatePost = async (postId) => {
    if (!editContent.trim()) {
      alert("Post content cannot be empty.");
      return;
    }

    try {
      await API.put(`/posts/${postId}`, {
        content: editContent.trim(),
      });

      setEditingPostId(null);
      setEditContent("");

      await fetchPosts();
    } catch (error) {
      console.error("Failed to update post:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to update post"
      );
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

    handleCreatePost,
    handleSharePost,
    handleDeletePost,
    handleArchivePost,
    handleLikePost,
    startEditing,
    cancelEditing,
    handleUpdatePost,
    handleLogout,
    goToProfile,
  };
}

export default useDashboard;