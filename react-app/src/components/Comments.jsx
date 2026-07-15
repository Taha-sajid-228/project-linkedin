import { useCallback, useEffect, useState } from "react";
import API from "../api/axios";

function Comments({
  postId,
  currentUser,
  onCommentAdded,
  onCommentDeleted,
}) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchComments = useCallback(async () => {
    try {
      setCommentsLoading(true);
      setError("");

      const res = await API.get(`/comments/posts/${postId}`);

      setComments(res.data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);

      setError(
        error.response?.data?.detail || "Failed to load comments"
      );
    } finally {
      setCommentsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await API.post(`/comments/posts/${postId}`, {
        content: content.trim(),
      });

      setComments((prevComments) => [
        res.data,
        ...prevComments,
      ]);

      setContent("");

      if (onCommentAdded) {
        onCommentAdded(postId);
      }
    } catch (error) {
      console.error("Failed to add comment:", error);

      setError(
        error.response?.data?.detail || "Failed to add comment"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      setError("");

      await API.delete(`/comments/${commentId}`);

      setComments((prevComments) =>
        prevComments.filter(
          (comment) => comment.id !== commentId
        )
      );

      if (onCommentDeleted) {
        onCommentDeleted(postId);
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);

      setError(
        error.response?.data?.detail || "Failed to delete comment"
      );
    }
  };

  return (
    <div className="mt-4 border-t border-slate-100 pt-4 space-y-4">
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        {currentUser?.profile_picture ? (
          <img
            src={currentUser.profile_picture}
            alt={currentUser.username || "User"}
            className="h-8 w-8 rounded-xl object-cover shrink-0 border border-slate-100"
          />
        ) : (
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
            {currentUser?.username
              ?.substring(0, 2)
              .toUpperCase() || "U"}
          </div>
        )}

        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Write a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 placeholder-slate-400 rounded-xl px-4 py-2 text-xs text-slate-800 outline-none transition-all duration-200 disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs shrink-0"
          >
            {loading ? "Posting..." : "Comment"}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <p className="ml-11 text-xs font-semibold text-red-500">
          {error}
        </p>
      )}

      {/* Comments Loading */}
      {commentsLoading ? (
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-11">
          Loading comments...
        </p>
      ) : comments.length === 0 ? (
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-11">
          No comments yet.
        </p>
      ) : (
        <div className="space-y-3.5 ml-11">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 items-start animate-in fade-in duration-200"
            >
              {comment.author?.profile_picture ? (
                <img
                  src={comment.author.profile_picture}
                  alt={comment.author.username || "User"}
                  className="h-7 w-7 rounded-xl object-cover shrink-0 border border-slate-100"
                />
              ) : (
                <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 shadow-2xs">
                  {comment.author?.username
                    ?.substring(0, 2)
                    .toUpperCase() || "U"}
                </div>
              )}

              <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 shadow-2xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-slate-900 leading-none">
                    @
                    {comment.author?.username ||
                      "Unknown user"}
                  </span>

                  {currentUser?.id === comment.author_id && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      className="text-[10px] text-slate-400 hover:text-red-500 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-700 font-medium leading-relaxed my-1">
                  {comment.content}
                </p>

                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">
                  {comment.created_at
                    ? new Date(
                        comment.created_at
                      ).toLocaleString()
                    : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Comments;