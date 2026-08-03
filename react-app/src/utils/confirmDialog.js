import Swal from "sweetalert2";

export async function showConfirmation({
  title,
  text,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonClass =
    "bg-red-600 hover:bg-red-700",
  icon = "warning",
}) {
  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,

    customClass: {
      popup:
        "rounded-2xl border border-slate-200 bg-white p-6 shadow-xl font-sans",

      title:
        "text-lg font-black text-slate-900",

      htmlContainer:
        "text-sm text-slate-500",

      confirmButton:
        `${confirmButtonClass} text-white font-bold py-2 px-4 rounded-xl text-xs mx-2 cursor-pointer transition-all active:scale-95`,

      cancelButton:
        "bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs mx-2 cursor-pointer transition-all active:scale-95",
    },

    buttonsStyling: false,
  });
}