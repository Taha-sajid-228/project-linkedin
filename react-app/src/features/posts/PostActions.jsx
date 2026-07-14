function PostActions({
  post,
  onLike,
  onShare,
  onComment,
}) {
  return (
    <div className="flex items-center justify-around text-slate-500 text-xs font-bold pt-1.5 border-t border-slate-100">
      {/* Like Button */}
      <button
        type="button"
        onClick={() => onLike(post.id)}
        className={`flex items-center justify-center gap-2 p-2 rounded-xl cursor-pointer transition-all duration-150 active:scale-90 w-full hover:bg-slate-50 ${
          post.is_liked_by_me
            ? "text-red-500 font-extrabold bg-red-50/50"
            : "hover:text-red-500"
        }`}
      >
        <svg
          className={`h-4.5 w-4.5 transition-transform ${
            post.is_liked_by_me
              ? "scale-110 fill-red-500 stroke-red-500"
              : "stroke-current"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>

        <span className="text-[10px] uppercase tracking-wider">
          {post.is_liked_by_me ? "Liked" : "Like"}
        </span>
      </button>

      {/* Comment Button */}
      <button
        type="button"
        onClick={onComment}
        className="flex items-center justify-center gap-2 p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-all duration-150 hover:text-indigo-600 active:scale-90 w-full"
      >
        <svg
          className="h-4.5 w-4.5 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>

        <span className="text-[10px] uppercase tracking-wider">
          Comment
        </span>
      </button>

      {/* Share Button */}
      <button
        type="button"
        onClick={() => onShare(post.id)}
        className="flex items-center justify-center gap-2 p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-all duration-150 hover:text-indigo-600 active:scale-90 w-full"
      >
        <svg
          className="h-4.5 w-4.5 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.684 10.742l4.636-2.318a4.5 4.5 0 110 7.152l-4.636-2.318a4.5 4.5 0 110-2.516z"
          />
        </svg>

        <span className="text-[10px] uppercase tracking-wider">
          Share
        </span>
      </button>
    </div>
  );
}

export default PostActions;