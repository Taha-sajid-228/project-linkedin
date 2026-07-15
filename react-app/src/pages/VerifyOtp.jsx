import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";

function VerifyOtp() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const emailFromUrl = params.get("email") || "";
  const TIMER_SECONDS = 300;

  const [email, setEmail] = useState(emailFromUrl);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const getStorageKey = (emailValue) => {
    return `verify_otp_timer_${emailValue.trim().toLowerCase()}`;
  };

  const startTimer = (emailValue) => {
    const expiresAt = Date.now() + TIMER_SECONDS * 1000;
    localStorage.setItem(getStorageKey(emailValue), expiresAt.toString());
    setSeconds(TIMER_SECONDS);
  };

  useEffect(() => {
    if (!email.trim()) return;

    const savedExpiry = localStorage.getItem(getStorageKey(email));

    if (savedExpiry) {
      const remaining = Math.ceil((Number(savedExpiry) - Date.now()) / 1000);
      setSeconds(remaining > 0 ? remaining : 0);
    } else {
      startTimer(email);
    }
  }, [email]);

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          localStorage.removeItem(getStorageKey(email));
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, email]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setIsError(true);
      setMessage("Email is required.");
      return;
    }

    if (otp.trim().length !== 6) {
      setIsError(true);
      setMessage("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const otpData = new FormData();
      otpData.append("email", email.trim());
      otpData.append("otp", otp.trim());

      await API.post("/verify-otp", otpData);

      localStorage.removeItem(getStorageKey(email));

      setIsError(false);
      setMessage("Email verified successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.detail || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (seconds > 0 || resendLoading) return;

    if (!email.trim()) {
      setIsError(true);
      setMessage("Email is required.");
      return;
    }

    try {
      setResendLoading(true);

      const resendData = new FormData();
      resendData.append("email", email.trim());

      await API.post("/resend-otp", resendData);

      setIsError(false);
      setMessage("A new OTP has been sent to your email.");
      startTimer(email);
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.detail || "Failed to resend OTP.");
    } finally {
      setResendLoading(false);
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
              Verify your email
            </h2>
            <p className="mt-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              We sent a 6-digit OTP code to your email
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setMessage("");
                  setIsError(false);
                }}
                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 placeholder-slate-400 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200"
                required
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setOtp(value.slice(0, 6));
                  setMessage("");
                  setIsError(false);
                }}
                maxLength={6}
                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 placeholder-slate-300 rounded-xl px-4 py-3.5 text-center text-2xl tracking-[16px] font-black text-slate-900 outline-none transition-all duration-200"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 active:scale-98 disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Verifying..." : "Verify OTP"}
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

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-semibold mb-2">Did not receive the OTP?</p>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={seconds > 0 || resendLoading}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {resendLoading
                ? "Sending..."
                : seconds > 0
                  ? `Resend OTP in ${seconds}s`
                  : "Resend OTP"}
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link to="/register" className="text-xs text-slate-400 hover:text-slate-600 font-semibold transition-colors">
              Back to Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;