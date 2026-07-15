function Loader({ message = "Loading..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans antialiased">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>

        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {message}
        </p>
      </div>
    </div>
  );
}

export default Loader;