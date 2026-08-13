import API from "./axios";

// User login
export const login = async (loginData) => {
  const response = await API.post("/login", loginData);
  return response.data;
};

// User registration
export const register = async (registerData) => {
  const response = await API.post("/register", registerData);
  return response.data;
};

// Verify OTP code
export const verifyOtp = async (otpData) => {
  const response = await API.post("/verify-otp", otpData);
  return response.data;
};

// Resend OTP code
export const resendOtp = async (resendData) => {
  const response = await API.post("/resend-otp", resendData);
  return response.data;
};

// Forgot password request
export const forgotPassword = async (formData) => {
  const response = await API.post("/forgot-password", formData);
  return response.data;
};

// Reset password with OTP
export const resetPassword = async (data) => {
  const response = await API.post("/reset-password", data);
  return response.data;
};

// Get currently logged-in user profile details
export const getMe = async () => {
  const response = await API.get("/me");
  return response.data;
};

// Update profile picture
export const updateProfilePicture = async (formData, config = {}) => {
  const response = await API.put("/me/profile-picture", formData, config);
  return response.data;
};

// Update user bio
export const updateBio = async (formData, config = {}) => {
  const response = await API.put("/me/bio", formData, config);
  return response.data;
};

// Get pending OAuth user details (for complete registration step)
export const getPendingOauthUser = async () => {
  const response = await API.get("/auth/pending-oauth-user");
  return response.data;
};

// Complete registration for OAuth signup flow
export const completeOauthRegistration = async (formData) => {
  const response = await API.post("/auth/oauth-complete-registration", formData);
  return response.data;
};
