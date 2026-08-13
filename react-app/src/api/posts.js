import API from "./axios";

// Fetch feed posts with optional pagination params
export const getFeedPosts = async (params = {}) => {
  const response = await API.get("/posts/feed", { params });
  return response.data;
};

// Fetch posts written by the logged-in user
export const getMyPosts = async () => {
  const response = await API.get("/posts/my-posts");
  return response.data;
};

// Fetch posts written by a specific user
export const getUserPosts = async (userId) => {
  const response = await API.get(`/posts/user/${userId}`);
  return response.data;
};

// Create a new post (supporting multipart form data for files)
export const createPost = async (formData, config = {}) => {
  const response = await API.post("/posts/", formData, config);
  return response.data;
};

// Update an existing post
export const updatePost = async (postId, formData, config = {}) => {
  const response = await API.put(`/posts/${postId}`, formData, config);
  return response.data;
};

// Delete a post (soft delete)
export const deletePost = async (postId) => {
  const response = await API.delete(`/posts/${postId}`);
  return response.data;
};

// Archive a post
export const archivePost = async (postId) => {
  const response = await API.patch(`/posts/${postId}/archive`);
  return response.data;
};

// Unarchive a post
export const unarchivePost = async (postId) => {
  const response = await API.patch(`/posts/${postId}/unarchive`);
  return response.data;
};

// Toggle like status on a post
export const likePost = async (postId) => {
  const response = await API.post(`/posts/${postId}/like`);
  return response.data;
};

// Get a single post by ID
export const getPost = async (postId) => {
  const response = await API.get(`/posts/${postId}`);
  return response.data;
};

// Get the list of users who liked a specific post
export const getPostLikes = async (postId) => {
  const response = await API.get(`/posts/${postId}/likes`);
  return response.data;
};
