import { useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardNavbar from "../components/DashboardNavbar";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";

import ProfileSidebar from "../features/dashboard/ProfileSidebar";
import NewsSidebar from "../features/dashboard/NewsSidebar";

import CreatePost from "../features/posts/CreatePost";
import PostList from "../features/posts/PostList";
import PostModal from "../features/posts/PostModal";

import useDashboard from "../hooks/useDashboard";

function Dashboard() {
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState(null);

  const {
    user,
    loading,
    error,

    suggestedUsers,
    handleAddFriend,

    posts,
    postContent,
    setPostContent,
    postFiles,
    setPostFiles,
    postLoading,

    editingPostId,
    editContent,
    setEditContent,
    selectedFiles,
    setSelectedFiles,
    removedMediaIds,
    setRemovedMediaIds,

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
    handleUnarchivePost,
    hasChanges,
    isSaving,
  } = useDashboard();

  const handleOpenComments = (postId) => {
    navigate(`/posts/${postId}?view=comments`);
  };

  const handleOpenLikes = (postId) => {
    navigate(`/posts/${postId}/likes`);
  };

  const handleOpenPost = (post) => {
    console.log("Opening post", post);
    setSelectedPost(post);
  };

  const handleClosePost = () => {
    setSelectedPost(null);
  };

  if (loading) {
    return <Loader message="Securing connection & loading feed..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <DashboardNavbar
        user={user}
        onLogout={handleLogout}
        onGoProfile={goToProfile}
      />

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <ProfileSidebar user={user} />

        <section className="md:col-span-2 space-y-4">
          <CreatePost
            user={user}
            postContent={postContent}
            setPostContent={setPostContent}
            postFiles={postFiles}
            setPostFiles={setPostFiles}
            postLoading={postLoading}
            onCreatePost={handleCreatePost}
          />

          <PostList
            posts={posts}
            user={user}
            editingPostId={editingPostId}
            editContent={editContent}
            setEditContent={setEditContent}
            removedMediaIds={removedMediaIds}
            setRemovedMediaIds={setRemovedMediaIds}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            onStartEditing={startEditing}
            onCancelEditing={cancelEditing}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
            onArchivePost={handleArchivePost}
            onUnarchivePost={handleUnarchivePost}
            onLikePost={handleLikePost}
            onSharePost={handleSharePost}
            onOpenComments={handleOpenComments}
            onOpenLikes={handleOpenLikes}
            onOpenPost={handleOpenPost}
            hasChanges={hasChanges}
            isSaving={isSaving}
          />
        </section>

        <NewsSidebar
          suggestedUsers={suggestedUsers}
          onAddFriend={handleAddFriend}
        />
      </main>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          user={user}
          onClose={handleClosePost}
          onLikePost={handleLikePost}
          onSharePost={handleSharePost}
          onOpenComments={handleOpenComments}
          onOpenLikes={handleOpenLikes}
        />
      )}
    </div>
  );
}

export default Dashboard;