import { useNavigate } from "react-router-dom";

import DashboardNavbar from "../components/DashboardNavbar";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";

import ProfileSidebar from "../features/dashboard/ProfileSidebar";
import NewsSidebar from "../features/dashboard/NewsSidebar";

import CreatePost from "../features/posts/CreatePost";
import PostList from "../features/posts/PostList";

import useDashboard from "../hooks/useDashboard";

function Dashboard() {
  const navigate = useNavigate();

  const {
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
            hasChanges={hasChanges}
            isSaving={isSaving}
          />
        </section>

        <NewsSidebar />
      </main>
    </div>
  );
}

export default Dashboard;