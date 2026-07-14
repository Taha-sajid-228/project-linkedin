import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function OAuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const token = params.get("token");
    const role = params.get("role");

    if (token) {
      localStorage.setItem("token", token);

      localStorage.setItem(
        "user",
        JSON.stringify({
          role: role,
        })
      );

      setTimeout(() => {
        if (role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/dashboard");
        }
      }, 500);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans antialiased">
      <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center max-w-sm w-full hover-lift duration-300">
        <div className="flex justify-center mb-5">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Signing you in...
        </h2>

        <p className="text-xs text-slate-500 font-medium">
          Please wait while we securely prepare your account.
        </p>
      </div>
    </div>
  );
}

export default OAuthSuccess;