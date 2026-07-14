function EditPost({
  editContent,
  setEditContent,
  onSave,
  onCancel,
}) {
  return (
    <div className="mb-4 animate-in fade-in-50 duration-150">
      <textarea
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        rows="3"
        className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 placeholder-slate-400 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none resize-none transition-all duration-200"
      />

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={onSave}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs"
        >
          Save
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default EditPost;