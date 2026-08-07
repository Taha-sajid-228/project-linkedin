import { useEffect, useMemo, useRef } from "react";
import { X, ImagePlus, ImageOff } from "lucide-react";
import toast from "react-hot-toast";

const ALLOWED_TYPES = ["image/", "video/"];
const MAX_FILES = 10;

// mode: "create" -> no existing media, just picking files for a new post
// mode: "edit"   -> shows existing media (removable) alongside newly selected files
function MediaPicker({
  mode = "create",
  existingMedia = [],
  removedMediaIds = [],
  setRemovedMediaIds = () => {},
  selectedFiles = [],
  setSelectedFiles = () => {},
}) {
  const fileInputRef = useRef(null);

  const isEditMode = mode === "edit";

  const visibleExistingMedia = isEditMode
    ? existingMedia.filter((media) => !removedMediaIds.includes(media.id))
    : [];

  // Generate object URLs once per selectedFiles change, not on every render
  const previewFiles = useMemo(
    () =>
      selectedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      })),
    [selectedFiles]
  );

  // Revoke object URLs on cleanup to avoid memory leaks
  useEffect(() => {
    return () => {
      previewFiles.forEach(({ preview }) => URL.revokeObjectURL(preview));
    };
  }, [previewFiles]);

  const handleRemoveExisting = (mediaId) => {
    setRemovedMediaIds((prev) =>
      prev.includes(mediaId) ? prev : [...prev, mediaId]
    );
  };

  const handleRemoveSelected = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = "";

    const valid = selected.filter((file) =>
      ALLOWED_TYPES.some((type) => file.type?.startsWith(type))
    );
    const invalidCount = selected.length - valid.length;

    if (invalidCount > 0) {
      toast.error("Only images and videos are allowed.");
    }

    if (valid.length === 0) return;

    const existingCount = visibleExistingMedia.length;

    setSelectedFiles((prev) => {
      const merged = [...prev];

      valid.forEach((file) => {
        const isDuplicate = merged.some(
          (existing) =>
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified
        );
        if (!isDuplicate) merged.push(file);
      });

      if (existingCount + merged.length > MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} files per post.`);
        return merged.slice(0, Math.max(0, MAX_FILES - existingCount));
      }

      return merged;
    });
  };

  const totalCount = visibleExistingMedia.length + previewFiles.length;
  const reachedLimit = totalCount >= MAX_FILES;

  return (
    <div className="mt-3">
      {totalCount > 0 ? (
        <div className="flex flex-wrap gap-2 mb-2">
          {visibleExistingMedia.map((media) => (
            <div
              key={`existing-${media.id}`}
              className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group transition-all duration-200 hover:scale-105"
            >
              {media.media_type?.startsWith("video") ? (
                <video
                  src={media.url}
                  className="w-full h-full object-cover"
                  muted
                />
              ) : (
                <img
                  src={media.url}
                  alt="Post media"
                  className="w-full h-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => handleRemoveExisting(media.id)}
                className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {previewFiles.map(({ file, preview }, index) => (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="relative w-20 h-20 rounded-xl overflow-hidden border border-indigo-200 group transition-all duration-200 hover:scale-105"
            >
              {file.type?.startsWith("video") ? (
                <video src={preview} className="w-full h-full object-cover" muted />
              ) : (
                <img
                  src={preview}
                  alt="Selected upload"
                  className="w-full h-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => handleRemoveSelected(index)}
                className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <ImageOff size={14} />
          <span>No media selected</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={reachedLimit}
        className={`flex items-center gap-1.5 text-xs font-bold text-indigo-600 px-3 py-1.5 rounded-lg transition-all duration-150 ${
          reachedLimit
            ? "opacity-50 cursor-not-allowed"
            : "hover:text-indigo-700 hover:bg-indigo-50 cursor-pointer"
        }`}
      >
        <ImagePlus size={14} />
        {reachedLimit ? `Max ${MAX_FILES} files reached` : "Add images or videos"}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

export default MediaPicker;