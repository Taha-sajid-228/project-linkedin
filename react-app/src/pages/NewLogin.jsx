import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function NewLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const loginData = new FormData();
      loginData.append("email", email);
      loginData.append("password", password);

      const response = await API.post("/login", loginData);

      localStorage.setItem("token", response.data.access_token);

      if (response.data.user?.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      alert(error.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        {/* Custom Premium Logo */}
        <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => navigate("/")}>
          <svg className="w-9 h-9 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Link<span className="text-indigo-600">Loop</span>
          </span>
        </div>
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-200/80 rounded-2xl shadow-sm sm:px-10 hover-lift duration-300">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign In
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Access your development dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email address"
                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 placeholder-slate-400 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 placeholder-slate-400 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 active:scale-98 cursor-pointer"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NewLogin;