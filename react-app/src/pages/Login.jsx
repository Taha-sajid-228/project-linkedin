import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");

    if (error) {
      setIsError(true);
      setMessage(error);
    }
  }, [searchParams]);

 const handleGoogleLogin = () => {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/login`;
};

const handleGithubLogin = () => {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/github/login`;
};

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setMessage("");
    setIsError(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const loginData = new FormData();
      loginData.append("email", formData.email);
      loginData.append("password", formData.password);

      const response = await API.post("/login", loginData);

      const token = response.data.access_token;
      const user = response.data.user;

      if (!token) {
        setIsError(true);
        setMessage("Login failed. Token not received.");
        return;
      }

      localStorage.setItem("token", token);

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user");
      }

      setIsError(false);
      setMessage("Login successful! Redirecting...");

      setTimeout(() => {
        if (user?.role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/dashboard");
        }
      }, 700);
    } catch (error) {
      console.log(error);
      setIsError(true);
      setMessage(error.response?.data?.detail || "Invalid email or password.");
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
              Welcome back
            </h2>
            <p className="mt-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Stay updated on your professional world
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 placeholder-slate-400 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200"
                required
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 placeholder-slate-400 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200"
                required
              />
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 active:scale-98 cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/80" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-extrabold tracking-wider">or</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-900 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-98 cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={handleGithubLogin}
                className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-900 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-98 cursor-pointer"
              >
                <svg className="h-4 w-4 fill-slate-800" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                <span>GitHub</span>
              </button>
            </div>
          </div>

          {message && (
            <div className={`mt-5 p-3 rounded-xl text-center text-xs font-bold border transition-all ${
              isError
                ? "bg-red-50 text-red-600 border-red-100"
                : "bg-emerald-50 text-emerald-600 border-emerald-100"
            }`}>
              {message}
            </div>
          )}

          <div className="mt-8 text-center text-xs text-slate-500 font-semibold">
            New to LinkLoop?{" "}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-bold ml-1 transition-colors">
              Join now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;