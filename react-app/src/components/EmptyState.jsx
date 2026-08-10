import React from "react";

function EmptyState({ title = "No items", message = "", icon = null }) {
  return (
    <div className="px-5 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        {icon || (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 11h-6" />
          </svg>
        )}
      </div>

      <h3 className="mt-3 text-sm font-black text-slate-700">{title}</h3>

      {message && (
        <p className="mx-auto mt-1 max-w-sm text-xs font-medium leading-5 text-slate-400">{message}</p>
      )}
    </div>
  );
}

export default EmptyState;
