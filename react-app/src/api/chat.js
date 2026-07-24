import API from "./axios";


// Create a new conversation or return the existing one
export const createConversation = async (userId) => {
  const response = await API.post(
    `/chat/conversations/${userId}`
  );

  return response.data;
};


// Get all conversations
export const getConversations = async () => {
  const response = await API.get(
    "/chat/conversations"
  );

  return response.data;
};


// Get messages of a conversation
export const getMessages = async (
  conversationId,
  limit = 30,
  beforeId = null
) => {
  const params = {
    limit,
  };

  if (beforeId) {
    params.before_id = beforeId;
  }

  const response = await API.get(
    `/chat/conversations/${conversationId}/messages`,
    {
      params,
    }
  );

  return response.data;
};


// Send a message
export const sendMessage = async (
  conversationId,
  content
) => {
  const response = await API.post(
    `/chat/conversations/${conversationId}/messages`,
    {
      content,
    }
  );

  return response.data;
};


// Mark messages as read
export const markMessagesAsRead = async (
  conversationId
) => {
  const response = await API.patch(
    `/chat/conversations/${conversationId}/read`
  );

  return response.data;
};