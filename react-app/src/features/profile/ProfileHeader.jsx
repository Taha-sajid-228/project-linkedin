import React from "react";

function ProfileHeader({
  user,
  isMyProfile,
  currentUser,
  friendsCount,
  editingBio,
  setEditingBio,
  bio,
  setBio,
  originalBio,
  setOriginalBio,
  isSavingBio,
  hasChangesBio,
  handleBioUpdate,
  handleProfilePictureUpload,
  uploadingPhoto,
  friendStatus,
  friendLoading,
  handleSendFriendRequest,
  handleCancelRequest,
  handleAcceptRequest,
  handleRejectRequest,
  handleRemoveFriend,
  navigate,
}) {
  return (
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
            <div className="flex items-center gap-2">
              {friendStatus === "none" && (
                <button
                  onClick={handleSendFriendRequest}
                  disabled={friendLoading}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 bg-indigo-600 text-white hover:bg-indigo-700 ${friendLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {friendLoading ? "Please wait..." : "Add Friend"}
                </button>
              )}

              {friendStatus === "pending_sent" && (
                <button
                  onClick={handleCancelRequest}
                  disabled={friendLoading}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 bg-slate-100 text-slate-700 hover:bg-slate-200 ${friendLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {friendLoading ? "Please wait..." : "Cancel Request"}
                </button>
              )}

              {friendStatus === "pending_received" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAcceptRequest}
                    disabled={friendLoading}
                    className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 bg-indigo-600 text-white hover:bg-indigo-700 ${friendLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Accept
                  </button>
                  <button
                    onClick={handleRejectRequest}
                    disabled={friendLoading}
                    className={`px-5 py-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Reject
                  </button>
                </div>
              )}

              {friendStatus === "accepted" && (
                <button
                  onClick={handleRemoveFriend}
                  disabled={friendLoading}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 bg-slate-100 text-slate-700 hover:bg-slate-200 ${friendLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {friendLoading ? "Please wait..." : "Unfriend"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{user?.name || user?.username}</h2>
          {user?.is_verified && (
            <svg className="w-5 h-5 text-indigo-600 fill-current" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 10.586l3.293-3.293a1 1 0 111.414 1.414z" />
            </svg>
          )}
        </div>

        <p className="text-xs font-bold text-slate-400 mb-4">@{user?.username}</p>

        <div className="flex items-center gap-6 mb-5">
          <span className="text-sm text-slate-700"><span className="font-bold">{friendsCount}</span> Friends</span>
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
                className={`bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs ${(!hasChangesBio || isSavingBio) ? "opacity-50 cursor-not-allowed" : ""}`}
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
            <p className="text-sm text-slate-700 leading-relaxed font-medium">{user?.bio || "No biography added yet."}</p>

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
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{user?.email}</span>
          </div>
        )}
      </div>
    </section>
  );
}

export default ProfileHeader;
