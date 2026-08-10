import React from "react";

export function PostStatusBadge({ post }) {
  if (post.is_deleted) {
    return (
      <span className="inline-flex rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600">
        Deleted
      </span>
    );
  }

  if (post.is_archived) {
    return (
      <span className="inline-flex rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
        Archived
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
      Active
    </span>
  );
}

export function RoleBadge({ role }) {
  const isAdmin = role === "admin";

  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
        isAdmin
          ? "border-violet-200 bg-violet-50 text-violet-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {role}
    </span>
  );
}

export function UserStatusBadge({ user }) {
  if (user.is_deleted) {
    return (
      <span className="inline-flex rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600">
        Deleted
      </span>
    );
  }

  if (user.is_blocked) {
    return (
      <span className="inline-flex rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
        Blocked
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
      Active
    </span>
  );
}

export default null;
