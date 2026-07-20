import API from "./axios";


// Send Friend Request
export const sendFriendRequest = async (userId) => {
  const response = await API.post(`/friends/request/${userId}`);
  return response.data;
};


// Get Received Friend Requests
export const getReceivedFriendRequests = async () => {
  const response = await API.get("/friends/requests/received");
  return response.data;
};


// Get Sent Friend Requests
export const getSentFriendRequests = async () => {
  const response = await API.get("/friends/requests/sent");
  return response.data;
};


// Accept Friend Request
export const acceptFriendRequest = async (requestId) => {
  const response = await API.put(
    `/friends/requests/${requestId}/accept`
  );

  return response.data;
};


// Reject Friend Request
export const rejectFriendRequest = async (requestId) => {
  const response = await API.put(
    `/friends/requests/${requestId}/reject`
  );

  return response.data;
};


// Cancel Friend Request
export const cancelFriendRequest = async (requestId) => {
  const response = await API.delete(
    `/friends/requests/${requestId}/cancel`
  );

  return response.data;
};


// Get Friends List
export const getFriends = async () => {
  const response = await API.get("/friends");

  return response.data;
};


// Remove Friend
export const removeFriend = async (userId) => {
  const response = await API.delete(
    `/friends/${userId}`
  );

  return response.data;
};