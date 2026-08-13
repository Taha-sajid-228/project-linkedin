import API from "./axios";

// Fetch comments for a specific post
export const getPostComments = async (postId) => {
  const response = await API.get(`/comments/posts/${postId}`);
  return response.data;
};

// Create a new comment on a specific post
export const createComment = async (postId, commentData) => {
  const response = await API.post(`/comments/posts/${postId}`, commentData);
  return response.data;
};

// Delete a comment
export const deleteComment = async (commentId) => {
  const response = await API.delete(`/comments/${commentId}`);
  return response.data;
};
