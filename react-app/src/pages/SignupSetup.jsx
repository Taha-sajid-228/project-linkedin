import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function SignupSetup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    fetchPendingUser();
  }, []);

  const fetchPendingUser = async () => {
    try {
      const response = await API.get("/auth/pending-oauth-user", {
        withCredentials: true,
      });

      setEmail(response.data.email || "");
      setName(response.data.suggested_name || "");
    } catch (error) {
      navigate("/register");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (name.trim().length < 2) {
      setIsError(true);
      setMessage("Name must be at least 2 characters long.");
      return;
    }

    if (username.trim().length < 6) {
      setIsError(true);
      setMessage("Username must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("username", username.trim());

      const response = await API.post(
        "/auth/oauth-complete-registration",
        formData,
        {
          withCredentials: true,
        }
      );

      localStorage.setItem(
        "token",
        response.data.access_token
      );

      navigate("/dashboard");
    } catch (error) {
      setIsError(true);
      setMessage(
        error.response?.data?.detail ||
        "Failed to complete registration."
      );
    } finally {
      setLoading(false);
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
              Complete Your Profile
            </h2>
            <p className="mt-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Finish setting up your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-slate-100 border border-slate-200 text-slate-400 rounded-xl px-4 py-3 text-sm cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 placeholder-slate-400 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                placeholder="johndoe123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 placeholder-slate-400 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 active:scale-98 disabled:opacity-60 cursor-pointer"
              >
                {loading
                  ? "Creating Account..."
                  : "Complete Registration"}
              </button>
            </div>
          </form>

          {message && (
            <div className={`mt-5 p-3 rounded-xl text-center text-xs font-bold border transition-all ${
              isError
                ? "bg-red-50 text-red-600 border-red-100"
                : "bg-emerald-50 text-emerald-600 border-emerald-100"
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignupSetup;