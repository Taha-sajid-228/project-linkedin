import React from "react";

function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  name,
}) {
  const base =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100";

  return (
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`${base} ${className}`}
    />
  );
}

export default SearchInput;
