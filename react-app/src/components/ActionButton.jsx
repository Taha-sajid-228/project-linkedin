import React from "react";

function ActionButton({ label, onClick, disabled, variant = "default" }) {
  const styles = {
    default: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
    warning: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
    danger: "border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {disabled ? "Please wait..." : label}
    </button>
  );
}

export default ActionButton;
