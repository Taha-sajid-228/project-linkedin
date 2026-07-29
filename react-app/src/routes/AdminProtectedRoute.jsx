import { Navigate } from "react-router-dom";


function AdminProtectedRoute({
  children,
}) {
  const token = localStorage.getItem("token");

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  let storedUser = null;

  try {
    storedUser = JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch (error) {
    console.error(
      "Invalid user data in local storage:",
      error
    );

    localStorage.removeItem("user");
  }

  const storedRole =
    storedUser?.role ||
    localStorage.getItem("role");

  if (storedRole !== "admin") {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}


export default AdminProtectedRoute;