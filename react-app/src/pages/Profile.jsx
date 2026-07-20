import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import API from "../api/axios";
import PostCard from "../components/PostCard";
import FollowListModal from "../components/FollowListModal";

function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const isMyProfile = !userId;

  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Follow system state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [followListType, setFollowListType] = useState(null);

  // Bio state
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState("");
  const [originalBio, setOriginalBio] = useState("");
  const [isSavingBio, setIsSavingBio] = useState(false);

  const hasChangesBio = (bio || "").trim() !== (originalBio || "").trim();

  // Post edit state
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = (editContent || "").trim() !== (originalContent || "").trim();

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);

      const meRes = await API.get("/me");
      setCurrentUser(meRes.data);
      localStorage.setItem("user", JSON.stringify(meRes.data));

      const profileUserId = isMyProfile
        ? meRes.data.id
        : Number(userId);

      const userResponse = isMyProfile
        ? meRes
        : await API.get(`/users/${userId}`);

      const postsResponse = isMyProfile
        ? await API.get("/posts/my-posts")
        : await API.get(`/posts/user/${userId}`);

      const followStatusResponse = await API.get(
        `/users/${profileUserId}/follow-status`
      );

      setUser(userResponse.data);
      setBio(userResponse.data.bio || "");
      setOriginalBio(userResponse.data.bio || "");
      setMyPosts(postsResponse.data);

      setIsFollowing(followStatusResponse.data.is_following);
      setFollowersCount(followStatusResponse.data.followers_count);
      setFollowingCount(followStatusResponse.data.following_count);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error(error.response?.data?.detail || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [isMyProfile, userId]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleFollow = async () => {
    if (isMyProfile || followLoading) {
      return;
    }

    try {
      setFollowLoading(true);

      const response = await API.post(
        `/users/${userId}/follow`
      );

      setIsFollowing(response.data.is_following);
      setFollowersCount(response.data.followers_count);

      toast.success(
        response.data.message || "User followed successfully."
      );
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to follow user."
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (isMyProfile || followLoading) {
      return;
    }

    try {
      setFollowLoading(true);

      const response = await API.delete(
        `/users/${userId}/follow`
      );

      setIsFollowing(response.data.is_following);
      setFollowersCount(response.data.followers_count);

      toast.success(
        response.data.message || "User unfollowed successfully."
      );
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to unfollow user."
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadingPhoto(true);

    try {
      const res = await API.put("/me/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUser((prevUser) => ({
        ...prevUser,
        profile_picture: res.data.profile_picture,
      }));
      toast.success("Profile picture updated successfully.");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to upload profile picture");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleBioUpdate = async () => {
    if ((bio || "").trim() === (originalBio || "").trim()) {
      setEditingBio(false);
      return;
    }

    setIsSavingBio(true);

    const formData = new FormData();
    formData.append("bio", bio);

    try {
      const res = await API.put("/me/bio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUser((prev) => ({
        ...prev,
        bio: res.data.bio,
      }));
      setOriginalBio(res.data.bio || "");
      setEditingBio(false);
      toast.success("Biography updated successfully.");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update bio");
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleUnarchivePost = (postId) => {
    Swal.fire({
      title: "Restore this post?",
      text: "The post will become visible in the feed again.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Restore",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-2xl border border-slate-200 bg-white p-6 shadow-xl font-sans",
        title: "text-lg font-black text-slate-900",
        htmlContainer: "text-sm text-slate-500",
        confirmButton: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs mx-2 cursor-pointer transition-all active:scale-95",
        cancelButton: "bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs mx-2 cursor-pointer transition-all active:scale-95",
      },
      buttonsStyling: false,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await API.patch(`/posts/${postId}/unarchive`);
          toast.success("Post restored successfully.");
          await fetchProfileData();
        } catch (error) {
          toast.error(error.response?.data?.detail || "Failed to restore the post.");
        }
      }
    });
  };

  const handleArchivePost = (postId) => {
    Swal.fire({
      title: "Archive this post?",
      text: "The post will be hidden from the feed but will remain available on your profile.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Archive",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-2xl border border-slate-200 bg-white p-6 shadow-xl font-sans",
        title: "text-lg font-black text-slate-900",
        htmlContainer: "text-sm text-slate-500",
        confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-xl text-xs mx-2 cursor-pointer transition-all active:scale-95",
        cancelButton: "bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs mx-2 cursor-pointer transition-all active:scale-95",
      },
      buttonsStyling: false,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await API.patch(`/posts/${postId}/archive`);
          toast.success("Post archived successfully.");
          await fetchProfileData();
        } catch (error) {
          toast.error(error.response?.data?.detail || "Failed to archive the post.");
        }
      }
    });
  };

  const handleDeletePost = (postId) => {
    Swal.fire({
      title: "Delete this post?",
      text: "This post will be removed from your profile and feed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-2xl border border-slate-200 bg-white p-6 shadow-xl font-sans",
        title: "text-lg font-black text-slate-900",
        htmlContainer: "text-sm text-slate-500",
        confirmButton: "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-xs mx-2 cursor-pointer transition-all active:scale-95",
        cancelButton: "bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs mx-2 cursor-pointer transition-all active:scale-95",
      },
      buttonsStyling: false,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await API.delete(`/posts/${postId}`);
          toast.success("Post deleted successfully.");
          await fetchProfileData();
        } catch (error) {
          toast.error(error.response?.data?.detail || "Failed to delete the post.");
        }
      }
    });
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await API.post(`/posts/${postId}/like`);

      setMyPosts((previousPosts) =>
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
      toast.error(error.response?.data?.detail || "Failed to like post");
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

      toast.success("Post shared successfully.");
      await fetchProfileData();
    } catch (error) {
      console.error("Failed to share post:", error);
      toast.error(error.response?.data?.detail || "Failed to share post");
    }
  };

  const startEditing = (post) => {
    setEditingPostId(post.id);
    setEditContent(post.content || "");
    setOriginalContent(post.content || "");
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditContent("");
    setOriginalContent("");
  };

  const handleUpdatePost = async (postId) => {
    if ((editContent || "").trim() === (originalContent || "").trim()) {
      cancelEditing();
      return;
    }

    if (!editContent.trim()) {
      toast.error("Post content cannot be empty.");
      return;
    }

    try {
      setIsSaving(true);
      await API.put(`/posts/${postId}`, { content: editContent.trim() });

      toast.success("Post updated successfully.");
      setEditingPostId(null);
      setEditContent("");
      setOriginalContent("");
      await fetchProfileData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update post");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans antialiased">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Floating glass navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Link<span className="text-indigo-600">Loop</span>
            </span>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95"
          >
            Back to Feed
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <section className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs mb-8 hover-lift duration-300">
          <div className="h-40 bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
          </div>

          <div className="px-8 pb-8 relative">
            <div className="-mt-16 mb-4 flex items-end justify-between">
              <div className="relative">
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.username}
                    className="h-28 w-28 rounded-2xl border-4 border-white object-cover shadow-sm"
                  />
                ) : (
                  <div className="h-28 w-28 rounded-2xl border-4 border-white bg-gradient-to-br from-indigo-500 to-purple-650 text-white text-3xl font-extrabold flex items-center justify-center shadow-sm">
                    {user?.username?.substring(0, 2).toUpperCase()}
                  </div>
                )}
                {isMyProfile && (
                  <label className="absolute -bottom-2 -right-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl border-2 border-white shadow-md cursor-pointer transition-all duration-200 active:scale-95 flex items-center justify-center" title="Update Profile Picture">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {isMyProfile && (
                <label className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95">
                  {uploadingPhoto ? "Uploading..." : "Upload Cover"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </label>
              )}

              {!isMyProfile && (
                <button
                  onClick={
                    isFollowing
                      ? handleUnfollow
                      : handleFollow
                  }
                  disabled={followLoading}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${
                    isFollowing
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  } ${
                    followLoading
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {followLoading
                    ? "Please wait..."
                    : isFollowing
                    ? "Unfollow"
                    : "Follow"}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {user?.name || user?.username}
              </h2>
              {user?.is_verified && (
                <svg className="w-5 h-5 text-indigo-600 fill-current" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 10.586l3.293-3.293a1 1 0 111.414 1.414z" />
                </svg>
              )}
            </div>

            <p className="text-xs font-bold text-slate-400 mb-4">@{user?.username}</p>

            <div className="flex items-center gap-6 mb-5">
              <button
                type="button"
                onClick={() => setFollowListType("followers")}
                className="text-sm text-slate-700 hover:text-indigo-600 transition"
              >
                <span className="font-bold">{followersCount}</span> Followers
              </button>

              <button
                type="button"
                onClick={() => setFollowListType("following")}
                className="text-sm text-slate-700 hover:text-indigo-600 transition"
              >
                <span className="font-bold">{followingCount}</span> Following
              </button>
            </div>

            {editingBio ? (
              <div className="mt-4">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs md:text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all duration-200 resize-none"
                  placeholder="Tell us about yourself..."
                />

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleBioUpdate}
                    disabled={!hasChangesBio || isSavingBio}
                    className={`bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs ${
                      (!hasChangesBio || isSavingBio) ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isSavingBio ? "Saving..." : "Save Bio"}
                  </button>

                  <button
                    onClick={() => {
                      setEditingBio(false);
                      setBio(user.bio || "");
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {user?.bio || "No biography added yet."}
                </p>

                {isMyProfile && (
                  <button
                    onClick={() => {
                      setOriginalBio(user?.bio || "");
                      setBio(user?.bio || "");
                      setEditingBio(true);
                    }}
                    className="text-xs text-indigo-600 font-bold mt-3.5 hover:text-indigo-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Edit Biography
                  </button>
                )}
              </div>
            )}

            {isMyProfile && (
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400 font-semibold">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{user?.email}</span>
              </div>
            )}
          </div>
        </section>

        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-4 ml-1">
          {isMyProfile ? "My Publications" : `${user?.username}'s Publications`}
        </h3>

        <div className="space-y-4">
          {myPosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center shadow-xs">
              <div className="text-slate-300 mb-3.5 flex justify-center">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                {isMyProfile
                  ? "You have not published any posts yet"
                  : "This user has not published any posts yet"}
              </p>
            </div>
          ) : (
            myPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                user={currentUser}
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
                onOpenComments={(postId) => navigate(`/posts/${postId}?view=comments`)}
                onOpenLikes={(postId) => navigate(`/posts/${postId}/likes`)}
                hasChanges={hasChanges}
                isSaving={isSaving}
              />
            ))
          )}
        </div>
      </main>

      {followListType && user?.id && (
        <FollowListModal
          userId={user.id}
          type={followListType}
          onClose={() => setFollowListType(null)}
        />
      )}
    </div>
  );
}

export default Profile;