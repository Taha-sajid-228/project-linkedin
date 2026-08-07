import { useState } from "react";
import PostPreview from "./PostPreview";
import MediaPicker from "./MediaPicker";

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

        <div className="ml-14">
          <MediaPicker
            mode="create"
            selectedFiles={postFiles}
            setSelectedFiles={setPostFiles}
          />
        </div>

        <div className="flex items-center justify-end mt-4 pt-3 border-t border-slate-100 gap-2">
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