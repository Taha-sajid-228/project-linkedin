
import { useNavigate } from "react-router-dom";

import EditPost from "./EditPost";
import PostMedia from "./PostMedia";
import PostActions from "./PostActions";

function PostCard({
  post,
  user,
  editingPostId,
  editContent,
  setEditContent,
  onStartEditing,
  onCancelEditing,
  onUpdatePost,
  onDeletePost,
  onArchivePost,
  onLikePost,
  onSharePost,
  onOpenComments,
  onOpenLikes,
}) {
  const navigate = useNavigate();

  const isOwner = post.author_id === user?.id;
  const isSharedPost = Boolean(post.original_post);

  const goToAuthorProfile = () => {
    if (!post.author?.id) return;

    if (post.author.id === user?.id) {
      navigate("/profile");
    } else {
      navigate(`/profile/${post.author.id}`);
    }
  };

  const goToOriginalAuthorProfile = () => {
    const originalAuthor = post.original_post?.author;

    if (!originalAuthor?.id) return;

    if (originalAuthor.id === user?.id) {
      navigate("/profile");
    } else {
      navigate(`/profile/${originalAuthor.id}`);
    }
  };

  const handleOpenPostComments = () => {
    if (onOpenComments) {
      onOpenComments(post.id);
      return;
    }

    navigate(`/posts/${post.id}?view=comments`);
  };

  const handleOpenPostLikes = () => {
    if (onOpenLikes) {
      onOpenLikes(post.id);
      return;
    }

    navigate(`/posts/${post.id}?view=likes`);
  };

  return (
    <article className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all duration-300 hover:shadow-sm">
      {isSharedPost && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-4 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 w-fit">
          <svg
            className="w-4 h-4 text-indigo-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 2.1l4 4-4 4" />
            <path d="M3 22v-6a4 4 0 0 1 4-4h14" />
          </svg>

          <span>
            <button
              type="button"
              onClick={goToAuthorProfile}
              className="font-extrabold text-slate-800 cursor-pointer hover:underline"
            >
              {post.author?.name ||
                post.author?.username ||
                "Someone"}
            </button>{" "}
            shared this post
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToAuthorProfile}
          className="flex items-center gap-3.5 cursor-pointer group text-left"
        >
          {post.author?.profile_picture ? (
            <img
              src={post.author.profile_picture}
              alt={post.author.username || "User"}
              className="h-10 w-10 rounded-2xl object-cover border border-slate-100 transition-all duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs transition-all duration-300 group-hover:scale-105">
              {post.author?.username
                ?.substring(0, 2)
                .toUpperCase() || "U"}
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
              {post.author?.name ||
                post.author?.username ||
                "Unknown User"}
            </h3>

            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              @{post.author?.username || "unknown"} •{" "}
              {post.created_at
                ? new Date(post.created_at).toLocaleString()
                : ""}
            </p>
          </div>
        </button>

        {isOwner && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onStartEditing(post)}
              className="bg-slate-50 border border-slate-150 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-500 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer active:scale-95"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => onArchivePost(post.id)}
              className="bg-slate-50 border border-slate-150 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-250 text-slate-500 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer active:scale-95"
            >
              Archive
            </button>

            <button
              type="button"
              onClick={() => onDeletePost(post.id)}
              className="bg-slate-50 border border-slate-150 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-500 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer active:scale-95"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {editingPostId === post.id ? (
        <EditPost
          editContent={editContent}
          setEditContent={setEditContent}
          onSave={() => onUpdatePost(post.id)}
          onCancel={onCancelEditing}
        />
      ) : (
        post.content && (
          <p className="text-sm text-slate-800 leading-relaxed mb-4 whitespace-pre-line font-medium">
            {post.content}
          </p>
        )
      )}

      {isSharedPost ? (
        <div className="border border-slate-100 rounded-2xl p-4 mb-4 bg-slate-50/50 hover:bg-slate-50 transition-colors duration-200">
          <button
            type="button"
            onClick={goToOriginalAuthorProfile}
            className="flex items-center gap-3 cursor-pointer mb-3.5 group text-left"
          >
            {post.original_post?.author?.profile_picture ? (
              <img
                src={post.original_post.author.profile_picture}
                alt={
                  post.original_post.author.username ||
                  "Original author"
                }
                className="h-8.5 w-8.5 rounded-xl object-cover border border-slate-100 transition-all duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-[10px] shadow-2xs transition-all duration-300 group-hover:scale-105">
                {post.original_post?.author?.username
                  ?.substring(0, 2)
                  .toUpperCase() || "U"}
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                {post.original_post?.author?.name ||
                  post.original_post?.author?.username ||
                  "Unknown User"}
              </h4>

              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                @{post.original_post?.author?.username || "unknown"} •{" "}
                {post.original_post?.created_at
                  ? new Date(
                      post.original_post.created_at
                    ).toLocaleString()
                  : ""}
              </p>
            </div>
          </button>

          {post.original_post?.content && (
            <p className="text-sm text-slate-700 leading-relaxed mb-4 whitespace-pre-line font-medium">
              {post.original_post.content}
            </p>
          )}

          <PostMedia media={post.original_post?.media || []} />
        </div>
      ) : (
        <PostMedia media={post.media || []} />
      )}

      {/* Post statistics */}
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 pb-2.5 border-b border-slate-100">
        <button
          type="button"
          onClick={handleOpenPostLikes}
          className="cursor-pointer hover:text-indigo-600 hover:underline transition-colors"
        >
          👍 {post.likes_count || 0} likes
        </button>

        <button
          type="button"
          onClick={handleOpenPostComments}
          className="cursor-pointer hover:text-indigo-600 hover:underline transition-colors"
        >
          {post.comments_count || 0} comments • 0 shares
        </button>
      </div>

      <PostActions
        post={post}
        onLike={onLikePost}
        onShare={onSharePost}
        onComment={handleOpenPostComments}
      />
    </article>
  );
}

export default PostCard;

