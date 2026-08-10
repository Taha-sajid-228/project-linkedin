import React from "react";

function InlineErrorPanel({
  title = "Unable to load",
  message = "",
  onRetry = null,
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
      <h3 className="text-sm font-black text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm text-red-600">{message}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default InlineErrorPanel;
