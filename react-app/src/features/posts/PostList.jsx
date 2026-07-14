import PostCard from "./PostCard";

function PostList({
  posts,
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
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xs border border-[#D9E2EC] p-6 text-center">
        <p className="text-[#64748B] text-xs md:text-sm font-semibold">
          No posts yet. Create the first post!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          user={user}
          editingPostId={editingPostId}
          editContent={editContent}
          setEditContent={setEditContent}
          onStartEditing={onStartEditing}
          onCancelEditing={onCancelEditing}
          onUpdatePost={onUpdatePost}
          onDeletePost={onDeletePost}
          onArchivePost={onArchivePost}
          onLikePost={onLikePost}
          onSharePost={onSharePost}
          onOpenComments={onOpenComments}
          onOpenLikes={onOpenLikes}
        />
      ))}
    </div>
  );
}

export default PostList;