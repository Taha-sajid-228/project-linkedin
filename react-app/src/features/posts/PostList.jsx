import PostCard from "../../components/PostCard";

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
  onUnarchivePost,
  onLikePost,
  onSharePost,
  onOpenComments,
  onOpenLikes,
  hasChanges,
  isSaving,
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
          onUnarchivePost={onUnarchivePost}
          onLikePost={onLikePost}
          onSharePost={onSharePost}
          onOpenComments={onOpenComments}
          onOpenLikes={onOpenLikes}
          hasChanges={hasChanges}
          isSaving={isSaving}
        />
      ))}
    </div>
  );
}

export default PostList;