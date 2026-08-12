import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Profile from "./pages/Profile";
import PostDetails from "./pages/PostDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import OAuthSuccess from "./pages/OAuthSuccess";
import SignupSetup from "./pages/SignupSetup";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminPosts from "./pages/AdminPosts";
import LikesList from "./pages/LikesList";
import DiscoverUsers from "./pages/DiscoverUsers";
import Friends from "./pages/Friends";
import Messages from "./pages/Messages";

import { Toaster } from "react-hot-toast";

import ProtectedRoute from "./routes/ProtectedRoute";
import AdminProtectedRoute from "./routes/AdminProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import AuthenticatedLayout from "./layouts/AuthenticatedLayout";


function App() {
  return (
    <>
      <Toaster />

      <BrowserRouter>
        <Routes>
          {/* Default route */}
          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          {/* Current user's profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Profile />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />

          {/* Another user's profile */}
          <Route
            path="/profile/:userId"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Profile />
                </AuthenticatedLayout>
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

          {/* OTP verification */}
          <Route
            path="/verify-otp"
            element={<VerifyOtp />}
          />

          {/* OAuth username setup */}
          <Route
            path="/signup-setup"
            element={<SignupSetup />}
          />

          {/* OAuth success */}
          <Route
            path="/oauth-success"
            element={<OAuthSuccess />}
          />

          {/* Feed page */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Dashboard />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />

          {/* Discover people page */}
          <Route
            path="/discover"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <DiscoverUsers />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />

          {/* Friends page */}
          <Route
            path="/friends"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Friends />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />

          {/* Messages page */}
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Messages />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />

          {/* Individual post page */}
          <Route
            path="/posts/:postId"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <PostDetails />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />

          {/* Likes list page */}
          <Route
            path="/posts/:postId/likes"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <LikesList />
                </AuthenticatedLayout>
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

          {/* Admin user management */}
          <Route
            path="/admin/users"
            element={
              <AdminProtectedRoute>
                <AdminUsers />
              </AdminProtectedRoute>
            }
          />

          {/* Admin post management */}
          <Route
            path="/admin/posts"
            element={
              <AdminProtectedRoute>
                <AdminPosts />
              </AdminProtectedRoute>
            }
          />

          {/* Invalid URL */}
          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}


export default App;