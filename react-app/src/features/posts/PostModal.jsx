import { useEffect } from "react";
import PostCard from "../../components/PostCard";

function PostModal({
  post,
  user,
  onClose,
  onLikePost,
  onSharePost,
  onOpenComments,
  onOpenLikes,
}) {
  useEffect(() => {
    if (!post) return;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [post, onClose]);

  if (!post) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <PostCard
          post={post}
          user={user}
          editingPostId={null}
          editContent=""
          setEditContent={() => {}}
          removedMediaIds={[]}
          setRemovedMediaIds={() => {}}
          selectedFiles={[]}
          setSelectedFiles={() => {}}
          onStartEditing={() => {}}
          onCancelEditing={() => {}}
          onUpdatePost={() => {}}
          onDeletePost={() => {}}
          onArchivePost={() => {}}
          onUnarchivePost={() => {}}
          onLikePost={onLikePost}
          onSharePost={onSharePost}
          onOpenComments={onOpenComments}
          onOpenLikes={onOpenLikes}
          hasChanges={false}
          isSaving={false}
          isModal={true}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

export default PostModal;