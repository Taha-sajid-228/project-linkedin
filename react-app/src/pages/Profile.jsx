import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";

function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const isMyProfile = !userId;

  const [user, setUser] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const renderMedia = (media = []) => {
    if (!media || media.length === 0) return null;

    return (
      <div className="space-y-3 mt-3">
        {media.map((file) => (
          <div key={file.id} className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
            {file.file_type === "image" ? (
              <img
                src={file.file_url}
                alt="post media"
                className="w-full max-h-[500px] object-contain select-none"
              />
            ) : file.file_type === "video" ? (
              <video
                src={file.file_url}
                controls
                className="w-full max-h-[500px] rounded-2xl"
              />
            ) : (
              <a
                href={file.file_url}
                target="_blank"
                rel="noreferrer"
                className="block text-white underline text-xs font-bold p-6 text-center"
              >
                View attached file
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);

      const userResponse = isMyProfile
        ? await API.get("/me")
        : await API.get(`/users/${userId}`);

      const postsResponse = isMyProfile
        ? await API.get("/posts/my-posts")
        : await API.get(`/posts/user/${userId}`);

      setUser(userResponse.data);
      setBio(userResponse.data.bio || "");
      setMyPosts(postsResponse.data);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      alert(error.response?.data?.detail || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [isMyProfile, userId]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed");
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
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to upload profile picture");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleBioUpdate = async () => {
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

      setEditingBio(false);
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to update bio");
    }
  };

  const handleUnarchivePost = async (postId) => {
    try {
      await API.patch(`/posts/${postId}/unarchive`);
      await fetchProfileData();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to unarchive post");
    }
  };

  const handleArchivePost = async (postId) => {
    try {
      await API.patch(`/posts/${postId}/archive`);
      await fetchProfileData();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to archive post");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await API.delete(`/posts/${postId}`);
      await fetchProfileData();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to delete post");
    }
  };

  const startEditing = (post) => {
    setEditingPostId(post.id);
    setEditContent(post.content || "");
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditContent("");
  };

  const handleUpdatePost = async (postId) => {
    try {
      await API.put(`/posts/${postId}`, { content: editContent });

      setEditingPostId(null);
      setEditContent("");
      await fetchProfileData();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to update post");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans antialiased">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-650 border-indigo-600 border-t-transparent"></div>
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
            className="bg-slate-50 border border-slate-205 border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95"
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
                  <label className="absolute -bottom-2 -right-2 bg-indigo-600 hover:bg-indigo-755 hover:bg-indigo-700 text-white p-2.5 rounded-xl border-2 border-white shadow-md cursor-pointer transition-all duration-200 active:scale-95 flex items-center justify-center" title="Update Profile Picture">
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

            {editingBio ? (
              <div className="mt-4">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs md:text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-650 focus:border-indigo-655 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all duration-200 resize-none"
                  placeholder="Tell us about yourself..."
                />

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleBioUpdate}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
                  >
                    Save Bio
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
                    onClick={() => setEditingBio(true)}
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
            myPosts.map((post) => {
              const isSharedPost = Boolean(post.original_post);

              return (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all duration-300 hover:shadow-sm"
                >
                  {isSharedPost && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-4 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 w-fit">
                      <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 2.1l4 4-4 4" />
                        <path d="M3 22v-6a4 4 0 0 1 4-4h14" />
                      </svg>
                      <span>
                        {post.author?.name || post.author?.username} shared this post
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {new Date(post.created_at).toLocaleString()}
                      </p>

                      {post.is_archived && (
                        <span className="inline-block mt-1.5 text-[9px] bg-yellow-50 text-yellow-605 text-yellow-600 border border-yellow-100 px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wider">
                          Archived
                        </span>
                      )}
                    </div>

                    {isMyProfile && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEditing(post)}
                          className="bg-slate-50 border border-slate-150 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-500 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer active:scale-95"
                        >
                          Edit
                        </button>

                        {post.is_archived ? (
                          <button
                            type="button"
                            onClick={() => handleUnarchivePost(post.id)}
                            className="bg-slate-50 border border-slate-150 hover:bg-emerald-50 hover:text-emerald-650 hover:text-emerald-600 hover:border-emerald-200 text-slate-500 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer active:scale-95"
                          >
                            Unarchive
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleArchivePost(post.id)}
                            className="bg-slate-50 border border-slate-150 hover:bg-yellow-50 hover:text-yellow-605 hover:text-yellow-600 hover:border-yellow-250 text-slate-500 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer active:scale-95"
                          >
                            Archive
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="bg-slate-50 border border-slate-150 hover:bg-red-50 hover:text-red-655 hover:text-red-600 hover:border-red-200 text-slate-500 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer active:scale-95"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {editingPostId === post.id ? (
                    <div className="mb-4">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows="3"
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-650 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 placeholder-slate-400 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-800 outline-none resize-none transition-all"
                      />

                      <div className="flex gap-2 mt-2.5">
                        <button
                          type="button"
                          onClick={() => handleUpdatePost(post.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                        >
                          Save Changes
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-705 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    post.content && (
                      <p className="text-sm text-slate-800 leading-relaxed font-medium mb-4 whitespace-pre-line">
                        {post.content}
                      </p>
                    )
                  )}

                  {isSharedPost ? (
                    <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors duration-200">
                      <div className="flex items-center gap-3 mb-3.5 group">
                        {post.original_post?.author?.profile_picture ? (
                          <img
                            src={post.original_post.author.profile_picture}
                            alt={post.original_post.author.username}
                            className="h-8.5 w-8.5 rounded-xl object-cover border border-slate-100 transition-all duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-650 text-white font-bold flex items-center justify-center text-[10px] shadow-2xs transition-all duration-300 group-hover:scale-105">
                            {post.original_post?.author?.username
                              ?.substring(0, 2)
                              .toUpperCase() || "U"}
                          </div>
                        )}

                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-650 transition-colors leading-tight">
                            {post.original_post?.author?.name ||
                              post.original_post?.author?.username ||
                              "Unknown User"}
                          </h4>

                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            @{post.original_post?.author?.username} •{" "}
                            {post.original_post?.created_at
                              ? new Date(
                                post.original_post.created_at
                              ).toLocaleString()
                              : ""}
                          </p>
                        </div>
                      </div>

                      {post.original_post?.content && (
                        <p className="text-sm text-slate-700 leading-relaxed font-medium mb-4 whitespace-pre-line">
                          {post.original_post.content}
                        </p>
                      )}

                      {renderMedia(post.original_post?.media || [])}
                    </div>
                  ) : (
                    renderMedia(post.media || [])
                  )}
                </article>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

export default Profile;