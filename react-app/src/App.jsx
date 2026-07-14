import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Profile from "./pages/Profile";
import PostDetails from "./pages/PostDetails";
import NewLogin from "./pages/NewLogin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import OAuthSuccess from "./pages/OAuthSuccess";
import SignupSetup from "./pages/SignupSetup";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";

import ProtectedRoute from "./routes/ProtectedRoute";
import AdminProtectedRoute from "./routes/AdminProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Current user's profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Another user's profile */}
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Login */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Simple Login Page */}
        <Route
          path="/new-login"
          element={
            <PublicRoute>
              <NewLogin />
            </PublicRoute>
          }
        />

        {/* Register */}
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Forgot password */}
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />

        {/* Reset password */}
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/signup-setup" element={<SignupSetup />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />

        {/* Feed page */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Individual post page */}
        <Route
          path="/posts/:postId"
          element={
            <ProtectedRoute>
              <PostDetails />
            </ProtectedRoute>
          }
        />

        {/* Admin dashboard */}
        <Route
          path="/admin-dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />

        {/* Invalid URL */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;