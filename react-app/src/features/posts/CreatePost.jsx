import { useState } from "react";
import PostPreview from "./PostPreview";

function CreatePost({
  user,
  postContent,
  setPostContent,
  postFiles,
  setPostFiles,
  postLoading,
  onCreatePost,
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [fileError, setFileError] = useState("");

  const allowedFileTypes = ["image/", "video/"];

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    const validFiles = selectedFiles.filter((file) =>
      allowedFileTypes.some((type) => file.type.startsWith(type))
    );

    if (validFiles.length !== selectedFiles.length) {
      setFileError("Only image and video files are allowed.");
    } else {
      setFileError("");
    }

    setPostFiles(validFiles);

    e.target.value = "";
  };

  const removeFile = (indexToRemove) => {
    setPostFiles(postFiles.filter((_, index) => index !== indexToRemove));
  };

  const hasPostData = postContent.trim() || postFiles.length > 0;

  return (
    <>
      <form
        onSubmit={onCreatePost}
        className="bg-white rounded-2xl border border-slate-200/80 p-5 mb-4 shadow-xs"
      >
        <div className="flex items-start gap-4">
          {user?.profile_picture ? (
            <img
              src={user.profile_picture}
              alt={user.username}
              className="h-10 w-10 rounded-2xl object-cover border border-slate-100"
            />
          ) : (
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-650 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
              {user?.username?.substring(0, 2).toUpperCase() || "U"}
            </div>
          )}

          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="Start a discussion, share an update or article..."
            rows="3"
            className="flex-1 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 placeholder-slate-400 rounded-xl px-4 py-3.5 text-sm text-slate-800 outline-none resize-none transition-all duration-200"
          />
        </div>

        {fileError && (
          <div className="mt-3 ml-14 p-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold text-center">
            {fileError}
          </div>
        )}

        {postFiles.length > 0 && (
          <div className="mt-4 ml-14 bg-slate-50/50 border border-slate-200/80 rounded-xl p-3.5">
            <p className="text-[10px] font-bold text-slate-405 uppercase tracking-wider mb-2">
              Selected Attachments ({postFiles.length})
            </p>

            <div className="space-y-2">
              {postFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate max-w-[240px]">
                    <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="truncate font-semibold text-slate-700">{file.name}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-slate-400 hover:text-red-650 transition-colors cursor-pointer"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl cursor-pointer transition-all text-slate-500 hover:text-slate-800 text-xs font-bold active:scale-95">
            <svg className="h-4.5 w-4.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <span>Attach Media</span>

            <input
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!hasPostData || postLoading}
              onClick={() => setShowPreview(true)}
              className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-95 cursor-pointer"
            >
              Preview
            </button>

            <button
              type="submit"
              disabled={postLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-95 cursor-pointer shadow-sm shadow-indigo-205"
            >
              {postLoading ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </form>

      {showPreview && (
        <PostPreview
          user={user}
          postContent={postContent}
          postFiles={postFiles}
          postLoading={postLoading}
          onClose={() => setShowPreview(false)}
          onPublish={onCreatePost}
        />
      )}
    </>
  );
}

export default CreatePost;