function NewsSidebar() {
  return (
    <section className="hidden lg:col-span-1 lg:block">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover-lift duration-300">
        <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center justify-between uppercase tracking-wider">
          <span>LinkLoop News</span>
          <span className="text-slate-400 cursor-help" title="Trending discussions">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </h3>

        <ul className="space-y-3.5">
          <li className="group">
            <h4 className="text-xs font-bold text-slate-700 group-hover:text-indigo-650 cursor-pointer transition-colors duration-150 leading-snug">
              OAuth Integration Completed!
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">1h ago • 2,401 readers</p>
          </li>

          <li className="border-t border-slate-100/80 pt-3 group">
            <h4 className="text-xs font-bold text-slate-700 group-hover:text-indigo-650 cursor-pointer transition-colors duration-150 leading-snug">
              FastAPI rises in microservice backend
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">8h ago • 15,310 readers</p>
          </li>

          <li className="border-t border-slate-100/80 pt-3 group">
            <h4 className="text-xs font-bold text-slate-700 group-hover:text-indigo-650 cursor-pointer transition-colors duration-150 leading-snug">
              React 19 adoption spikes
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">1d ago • 34,910 readers</p>
          </li>

          <li className="border-t border-slate-100/80 pt-3 group">
            <h4 className="text-xs font-bold text-slate-700 group-hover:text-indigo-650 cursor-pointer transition-colors duration-150 leading-snug">
              Tailwind CSS v4 performance benchmarks
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">2d ago • 8,924 readers</p>
          </li>
        </ul>
      </div>
    </section>
  );
}

export default NewsSidebar;