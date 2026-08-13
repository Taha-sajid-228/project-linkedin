import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardNavbar from "../components/DashboardNavbar";
import { getMe } from "../api/auth";
import { showConfirmation } from "../utils/confirmDialog";

function AuthenticatedLayout({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    let isMounted = true;

    const loadMe = async () => {
      if (user) return;

      try {
        const userData = await getMe();
        if (!isMounted) return;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (err) {
        console.error("Failed to load current user in AuthenticatedLayout:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    };

    loadMe();

    return () => {
      isMounted = false;
    };
  }, [navigate, user]);

  const handleLogout = async () => {
    const result = await showConfirmation({
      title: "Logout?",
      text: "Are you sure you want to logout from your account?",
      confirmButtonText: "Logout",
      confirmButtonClass: "bg-red-600 hover:bg-red-700",
    });

    if (!result.isConfirmed) return;

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    navigate("/login", { replace: true });
  };

  const goToProfile = () => {
    navigate("/profile");
  };

  return (
    <>
      <DashboardNavbar user={user} onLogout={handleLogout} onGoProfile={goToProfile} />
      {children}
    </>
  );
}

export default AuthenticatedLayout;
