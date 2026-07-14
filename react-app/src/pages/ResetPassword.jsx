import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    email: searchParams.get("email") || "",
    otp: "",
    newPassword: "",
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();

      data.append("email", formData.email);
      data.append("otp", formData.otp);
      data.append("new_password", formData.newPassword);

      const response = await API.post("/reset-password", data);

      setIsError(false);
      setMessage(response.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setIsError(true);
      setMessage(
        error.response?.data?.detail || "Password reset failed."
      );
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
              Set New Password
            </h2>
            <p className="mt-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Enter the OTP sent to your email to reset
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
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
                type="text"
                name="otp"
                placeholder="OTP Code"
                value={formData.otp}
                onChange={handleChange}
                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 placeholder-slate-400 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200"
                required
              />
            </div>

            <div>
              <input
                type="password"
                name="newPassword"
                placeholder="New Password"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 placeholder-slate-400 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 active:scale-98 cursor-pointer"
              >
                Reset Password
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

          <div className="mt-8 text-center text-xs text-slate-500 font-semibold">
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;