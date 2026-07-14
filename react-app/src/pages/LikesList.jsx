import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";

function LikesList() {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [likedUsers, setLikedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [postResponse, userResponse, likesResponse] = await Promise.all([
        API.get(`/posts/${postId}`),
        API.get("/me"),
        API.get(`/posts/${postId}/likes`),
      ]);

      setPost(postResponse.data);
      setCurrentUser(userResponse.data);
      setLikedUsers(likesResponse.data);

      localStorage.setItem("user", JSON.stringify(userResponse.data));
    } catch (err) {
      console.error("Failed to load likes page details:", err);
      setError(
        err.response?.data?.detail || "Failed to load likes page details."
      );
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const goToUserProfile = (userId) => {
    if (userId === currentUser?.id) {
      navigate("/profile");
      return;
    }
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return <Loader message="Loading reactions..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans antialiased">
        <div className="max-w-md w-full px-4">
          <ErrorMessage message={error} />
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Floating glass navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/dashboard")}
          >
            <svg
              className="w-8 h-8 text-indigo-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Link<span className="text-indigo-600">Loop</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95"
          >
            Back
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Post Context Preview Card */}
        {post && (
          <div className="mb-6 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Reactions on post by {post.author?.name || `@${post.author?.username}`}
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-600 line-clamp-2 italic">
              "{post.content || "Media Attachment Only"}"
            </div>
          </div>
        )}

        {/* Likes List Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                People who liked this post
              </h2>
              <p className="text-[10px] font-semibold text-slate-400 mt-1">
                Showing all accounts that reacted
              </p>
            </div>
            <span className="bg-indigo-50 text-indigo-600 text-xs font-extrabold px-2.5 py-1 rounded-lg">
              {likedUsers.length} {likedUsers.length === 1 ? "like" : "likes"}
            </span>
          </div>

          {likedUsers.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-slate-300 mb-3 flex justify-center">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 10h47m0 0h2v-2a2 2 0 00-2-2h-2m-2-4l-4 4H9m4 12V9a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3a2 2 0 002-2v-3"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318z"
                  />
                </svg>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                No likes yet.
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Be the first one to like this post!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {likedUsers.map((likedUser) => (
                <div
                  key={likedUser.id}
                  onClick={() => goToUserProfile(likedUser.id)}
                  className="w-full flex items-center gap-3.5 py-4 text-left hover:bg-slate-50/50 rounded-xl px-2 transition-all duration-205 cursor-pointer group"
                >
                  {likedUser.profile_picture ? (
                    <img
                      src={likedUser.profile_picture}
                      alt={likedUser.username || "User"}
                      className="h-11 w-11 rounded-2xl object-cover border border-slate-100 shrink-0 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shrink-0 transition-transform duration-300 group-hover:scale-105">
                      {likedUser.username
                        ?.substring(0, 2)
                        .toUpperCase() || "U"}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                        {likedUser.name || likedUser.username || "Unknown User"}
                      </p>
                      {likedUser.is_verified && (
                        <svg
                          className="w-4 h-4 text-indigo-600 fill-current shrink-0"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 10.586l3.293-3.293a1 1 0 111.414 1.414z" />
                        </svg>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-400 truncate mt-0.5">
                      @{likedUser.username || "unknown"}
                    </p>

                    {likedUser.bio && (
                      <p className="text-xs text-slate-500 truncate mt-1">
                        {likedUser.bio}
                      </p>
                    )}
                  </div>

                  <span className="text-slate-300 transition-transform duration-200 group-hover:translate-x-1">
                    <svg
                      className="w-5 h-5 text-slate-405 text-slate-400 group-hover:text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default LikesList;
