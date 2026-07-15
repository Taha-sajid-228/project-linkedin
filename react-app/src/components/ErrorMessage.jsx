function ErrorMessage({ message }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans antialiased">
      <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-red-100 max-w-sm w-full hover-lift duration-300">
        <div className="text-red-500 mb-4 flex justify-center">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <p className="text-red-600 text-sm font-bold tracking-tight mb-2">
          {message}
        </p>

        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
          Redirecting to sign-in...
        </p>
      </div>
    </div>
  );
}

export default ErrorMessage;