
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import API from "../api/axios";

import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import Comments from "../components/Comments";

import PostCard from "../features/posts/PostCard";

function PostDetails() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selectedView = searchParams.get("view") || "comments";

  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);

  const [likedUsers, setLikedUsers] = useState([]);
  const [likesLoading, setLikesLoading] = useState(false);
  const [likesError, setLikesError] = useState("");

  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPostDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [postResponse, userResponse] = await Promise.all([
        API.get(`/posts/${postId}`),
        API.get("/me"),
      ]);

      setPost(postResponse.data);
      setUser(userResponse.data);

      localStorage.setItem(
        "user",
        JSON.stringify(userResponse.data)
      );
    } catch (error) {
      console.error("Failed to load post details:", error);

      setError(
        error.response?.data?.detail ||
          "Failed to load post details."
      );
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const fetchLikedUsers = useCallback(async () => {
    try {
      setLikesLoading(true);
      setLikesError("");

      const response = await API.get(
        `/posts/${postId}/likes`
      );

      setLikedUsers(response.data);
    } catch (error) {
      console.error("Failed to load likes:", error);

      setLikesError(
        error.response?.data?.detail ||
          "Failed to load likes."
      );
    } finally {
      setLikesLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPostDetails();
  }, [fetchPostDetails]);

  useEffect(() => {
    if (selectedView === "likes") {
      fetchLikedUsers();
    }
  }, [selectedView, fetchLikedUsers]);

  const handleLikePost = async (selectedPostId) => {
    try {
      const response = await API.post(
        `/posts/${selectedPostId}/like`
      );

      setPost((previousPost) => ({
        ...previousPost,
        likes_count: response.data.likes_count,
        is_liked_by_me: response.data.liked,
      }));

      if (selectedView === "likes") {
        await fetchLikedUsers();
      }
    } catch (error) {
      console.error("Failed to like post:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to like post"
      );
    }
  };

  const handleSharePost = async (selectedPostId) => {
    try {
      const formData = new FormData();

      formData.append(
        "original_post_id",
        selectedPostId
      );

      await API.post("/posts/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Post shared successfully.");
    } catch (error) {
      console.error("Failed to share post:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to share post"
      );
    }
  };

  const startEditing = (selectedPost) => {
    setEditingPostId(selectedPost.id);
    setEditContent(selectedPost.content || "");
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditContent("");
  };

  const handleUpdatePost = async (selectedPostId) => {
    if (!editContent.trim()) {
      alert("Post content cannot be empty.");
      return;
    }

    try {
      const response = await API.put(
        `/posts/${selectedPostId}`,
        {
          content: editContent.trim(),
        }
      );

      setPost(response.data);
      setEditingPostId(null);
      setEditContent("");
    } catch (error) {
      console.error("Failed to update post:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to update post"
      );
    }
  };

  const handleDeletePost = async (selectedPostId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmed) return;

    try {
      await API.delete(`/posts/${selectedPostId}`);

      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to delete post:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to delete post"
      );
    }
  };

  const handleArchivePost = async (selectedPostId) => {
    try {
      await API.patch(
        `/posts/${selectedPostId}/archive`
      );

      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to archive post:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to archive post"
      );
    }
  };

  const handleCommentAdded = () => {
    setPost((previousPost) => ({
      ...previousPost,
      comments_count:
        (previousPost.comments_count || 0) + 1,
    }));
  };

  const handleCommentDeleted = () => {
    setPost((previousPost) => ({
      ...previousPost,
      comments_count: Math.max(
        (previousPost.comments_count || 0) - 1,
        0
      ),
    }));
  };

  const handleOpenComments = () => {
    navigate(`/posts/${postId}?view=comments`);
  };

  const handleOpenLikes = () => {
    navigate(`/posts/${postId}?view=likes`);
  };

  const goToLikedUserProfile = (likedUserId) => {
    if (likedUserId === user?.id) {
      navigate("/profile");
      return;
    }

    navigate(`/profile/${likedUserId}`);
  };

  if (loading) {
    return <Loader message="Loading post..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!post) {
    return <ErrorMessage message="Post not found." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          ← Back
        </button>

        <PostCard
          post={post}
          user={user}
          editingPostId={editingPostId}
          editContent={editContent}
          setEditContent={setEditContent}
          onStartEditing={startEditing}
          onCancelEditing={cancelEditing}
          onUpdatePost={handleUpdatePost}
          onDeletePost={handleDeletePost}
          onArchivePost={handleArchivePost}
          onLikePost={handleLikePost}
          onSharePost={handleSharePost}
          onOpenComments={handleOpenComments}
          onOpenLikes={handleOpenLikes}
        />

        {/* Comments View */}
        {selectedView === "comments" && (
          <div className="mt-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900">
                Comments
              </h2>

              <span className="text-xs font-bold text-slate-400">
                {post.comments_count || 0}
              </span>
            </div>

            <Comments
              postId={post.id}
              currentUser={user}
              onCommentAdded={handleCommentAdded}
              onCommentDeleted={handleCommentDeleted}
            />
          </div>
        )}

        {/* Likes View */}
        {selectedView === "likes" && (
          <div className="mt-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  People who liked this post
                </h2>

                <p className="text-[10px] font-semibold text-slate-400 mt-1">
                  View all reactions on this post
                </p>
              </div>

              <span className="text-xs font-bold text-slate-400">
                {post.likes_count || 0}
              </span>
            </div>

            {likesLoading ? (
              <p className="py-8 text-center text-xs font-bold text-slate-400">
                Loading likes...
              </p>
            ) : likesError ? (
              <div className="py-6 text-center">
                <p className="text-xs font-semibold text-red-500">
                  {likesError}
                </p>

                <button
                  type="button"
                  onClick={fetchLikedUsers}
                  className="mt-3 text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Try again
                </button>
              </div>
            ) : likedUsers.length === 0 ? (
              <p className="py-8 text-center text-xs font-bold text-slate-400">
                No likes yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {likedUsers.map((likedUser) => (
                  <button
                    key={likedUser.id}
                    type="button"
                    onClick={() =>
                      goToLikedUserProfile(likedUser.id)
                    }
                    className="w-full flex items-center gap-3 py-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {likedUser.profile_picture ? (
                      <img
                        src={likedUser.profile_picture}
                        alt={
                          likedUser.username || "User"
                        }
                        className="h-11 w-11 rounded-2xl object-cover border border-slate-100 shrink-0"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {likedUser.username
                          ?.substring(0, 2)
                          .toUpperCase() || "U"}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {likedUser.name ||
                          likedUser.username ||
                          "Unknown User"}
                      </p>

                      <p className="text-xs font-semibold text-slate-400 truncate mt-0.5">
                        @{likedUser.username || "unknown"}
                      </p>

                      {likedUser.bio && (
                        <p className="text-xs text-slate-500 truncate mt-1">
                          {likedUser.bio}
                        </p>
                      )}
                    </div>

                    <span className="text-slate-300">
                      →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PostDetails;
