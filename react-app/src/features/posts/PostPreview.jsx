import PostMedia from "./PostMedia";

function PostPreview({
  user,
  postContent,
  postFiles,
  postLoading,
  onClose,
  onPublish,
}) {
  const previewMedia = postFiles.map((file, index) => ({
    id: index,
    file_type: file.type.startsWith("video") ? "video" : "image",
    file_url: URL.createObjectURL(file),
  }));

  return (
    <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">Post Preview</h2>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="bg-slate-50/50 rounded-2xl border border-slate-150 p-4">
            <div className="flex items-center gap-3.5 mb-3.5">
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.username}
                  className="h-10 w-10 rounded-2xl object-cover border border-slate-100"
                />
              ) : (
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-650 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                  {user?.username?.substring(0, 2).toUpperCase() || "U"}
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  {user?.name || user?.username || "Unknown User"}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Just now • Draft Preview</p>
              </div>
            </div>

            {postContent && (
              <p className="text-sm text-slate-800 leading-relaxed mb-4 whitespace-pre-line font-medium">
                {postContent}
              </p>
            )}

            {previewMedia.length > 0 && <PostMedia media={previewMedia} />}

            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100 pt-3.5 mt-3.5">
              <span>👍 0 Likes</span>
              <span>0 Comments • 0 Shares</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-white text-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            Back to Edit
          </button>

          <button
            type="button"
            onClick={(e) => {
              onPublish(e);
              onClose();
            }}
            disabled={postLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-all active:scale-95 cursor-pointer shadow-sm shadow-indigo-200"
          >
            {postLoading ? "Publishing..." : "Publish Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PostPreview;