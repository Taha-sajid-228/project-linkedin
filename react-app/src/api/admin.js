import API from "./axios";

// Fetch admin statistics
export const getAdminStats = async () => {
  const response = await API.get("/admin/stats");
  return response.data;
};

// Fetch users for admin management (with search, page, limit)
export const getAdminUsers = async (params = {}) => {
  const response = await API.get("/admin/users", { params });
  return response.data;
};

// Block a user account
export const blockUser = async (userId) => {
  const response = await API.patch(`/admin/users/${userId}/block`);
  return response.data;
};

// Unblock a user account
export const unblockUser = async (userId) => {
  const response = await API.patch(`/admin/users/${userId}/unblock`);
  return response.data;
};

// Permanently delete a user account
export const deleteUser = async (userId) => {
  const response = await API.delete(`/admin/users/${userId}`);
  return response.data;
};

// Fetch posts for admin management (with search, page, limit)
export const getAdminPosts = async (params = {}) => {
  const response = await API.get("/admin/posts", { params });
  return response.data;
};

// Archive a post by admin
export const archiveAdminPost = async (postId) => {
  const response = await API.patch(`/admin/posts/${postId}/archive`);
  return response.data;
};

// Unarchive a post by admin
export const unarchiveAdminPost = async (postId) => {
  const response = await API.patch(`/admin/posts/${postId}/unarchive`);
  return response.data;
};

// Permanently delete a post by admin
export const deleteAdminPost = async (postId) => {
  const response = await API.delete(`/admin/posts/${postId}`);
  return response.data;
};
