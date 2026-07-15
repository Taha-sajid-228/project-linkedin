import { useState } from "react";

function PostMedia({ media }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) return null;

  const currentFile = media[currentIndex];

  const goPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="mb-4">
      <div className="relative bg-slate-955 bg-slate-950 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
        {currentFile.file_type === "image" ? (
          <img
            src={currentFile.file_url}
            alt="post media"
            className="w-full max-h-[500px] object-contain select-none"
          />
        ) : currentFile.file_type === "video" ? (
          <video
            src={currentFile.file_url}
            controls
            className="w-full max-h-[500px] rounded-2xl"
          />
        ) : (
          <a
            href={currentFile.file_url}
            target="_blank"
            rel="noreferrer"
            className="block text-white underline text-xs font-bold p-8 text-center"
          >
            View attached file
          </a>
        )}

        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 w-8 h-8 rounded-xl shadow-xs text-lg flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 w-8 h-8 rounded-xl shadow-xs text-lg flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
              {currentIndex + 1} / {media.length}
            </div>
          </>
        )}
      </div>

      {media.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2.5">
          {media.map((file, index) => (
            <button
              key={file.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${index === currentIndex
                ? "w-4 bg-indigo-600"
                : "w-1.5 bg-slate-200 hover:bg-slate-350"
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PostMedia;