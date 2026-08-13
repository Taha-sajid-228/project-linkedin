import API from "./axios";

// Fetch discovered users with query, limit, offset
export const discoverUsers = async (params = {}) => {
  const response = await API.get("/users", { params });
  return response.data;
};

// Fetch user profile details by ID
export const getUserProfile = async (userId) => {
  const response = await API.get(`/users/${userId}`);
  return response.data;
};

// Get suggested users to connect with
export const getUserSuggestions = async () => {
  const response = await API.get("/users/suggestions");
  return response.data;
};

// Follow a user
export const followUser = async (userId) => {
  const response = await API.post(`/users/${userId}/follow`);
  return response.data;
};

// Unfollow a user
export const unfollowUser = async (userId) => {
  const response = await API.delete(`/users/${userId}/follow`);
  return response.data;
};

// Get follow relationship status and stats with another user
export const getFollowStatus = async (userId) => {
  const response = await API.get(`/users/${userId}/follow-status`);
  return response.data;
};

// Fetch a user's followers list
export const getFollowers = async (userId, params = {}) => {
  const response = await API.get(`/users/${userId}/followers`, { params });
  return response.data;
};

// Fetch a user's following list
export const getFollowing = async (userId, params = {}) => {
  const response = await API.get(`/users/${userId}/following`, { params });
  return response.data;
};
