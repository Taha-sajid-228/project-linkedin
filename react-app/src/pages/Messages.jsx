import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  getConversations,
  getMessages,
  markMessagesAsRead,
} from "../api/chat";

import useChatSocket from "../hooks/useChatSocket";
import DashboardNavbar from "../components/DashboardNavbar";
import API from "../api/axios";


const formatMessageTime = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  return new Date(dateValue).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};


function Messages() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState("");

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] =
    useState(null);

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] =
    useState(false);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");
  const [messagesError, setMessagesError] =
    useState("");

  const messagesEndRef = useRef(null);


  const addOrUpdateMessage = useCallback(
    (incomingMessage) => {
      if (!incomingMessage) {
        return;
      }

      setMessages((previousMessages) => {
        const existingIndex =
          previousMessages.findIndex(
            (message) =>
              message.id === incomingMessage.id
          );

        if (existingIndex === -1) {
          return [
            ...previousMessages,
            incomingMessage,
          ];
        }

        return previousMessages.map((message) =>
          message.id === incomingMessage.id
            ? {
                ...message,
                ...incomingMessage,
              }
            : message
        );
      });

      setConversations((previousConversations) =>
        previousConversations.map((conversation) => {
          if (
            conversation.id !==
            incomingMessage.conversation_id
          ) {
            return conversation;
          }

          const messageCameFromOtherUser =
            incomingMessage.sender_id ===
            conversation.other_user.id;

          return {
            ...conversation,
            last_message: {
              id: incomingMessage.id,
              sender_id: incomingMessage.sender_id,
              content: incomingMessage.content,
              is_delivered:
                incomingMessage.is_delivered,
              is_read: incomingMessage.is_read,
              created_at: incomingMessage.created_at,
            },
            unread_count:
              selectedConversation?.id ===
                conversation.id ||
              !messageCameFromOtherUser
                ? conversation.unread_count
                : conversation.unread_count + 1,
            updated_at: incomingMessage.created_at,
          };
        })
      );
    },
    [selectedConversation?.id]
  );


  const handleMessagesRead = useCallback((eventData) => {
    const readMessageIds =
      eventData?.message_ids || [];

    setMessages((previousMessages) =>
      previousMessages.map((message) =>
        readMessageIds.includes(message.id)
          ? {
              ...message,
              is_read: true,
              read_at: eventData.read_at,
            }
          : message
      )
    );

    setConversations((previousConversations) =>
      previousConversations.map((conversation) =>
        conversation.id ===
        eventData?.conversation_id
          ? {
              ...conversation,
              last_message:
                conversation.last_message &&
                readMessageIds.includes(
                  conversation.last_message.id
                )
                  ? {
                      ...conversation.last_message,
                      is_read: true,
                    }
                  : conversation.last_message,
            }
          : conversation
      )
    );
  }, []);


  const handleMessageDelivered = useCallback(
    (deliveredMessage) => {
      addOrUpdateMessage(deliveredMessage);
    },
    [addOrUpdateMessage]
  );


  const {
    isConnected,
    socketError,
    sendSocketMessage,
  } = useChatSocket({
    conversationId: selectedConversation?.id,
    onMessage: addOrUpdateMessage,
    onMessagesRead: handleMessagesRead,
    onMessageDelivered: handleMessageDelivered,
  });


  const scrollToLatestMessage = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, []);


  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getConversations();
      const loadedConversations =
        response.conversations || [];

      setConversations(loadedConversations);

      setSelectedConversation(
        (currentConversation) => {
          if (!loadedConversations.length) {
            return null;
          }

          const conversationIdFromNavigation =
            location.state?.conversationId;

          if (conversationIdFromNavigation) {
            const targetConversation =
              loadedConversations.find(
                (conversation) =>
                  conversation.id ===
                  conversationIdFromNavigation
              );

            if (targetConversation) {
              return targetConversation;
            }
          }

          if (currentConversation) {
            const refreshedConversation =
              loadedConversations.find(
                (conversation) =>
                  conversation.id ===
                  currentConversation.id
              );

            if (refreshedConversation) {
              return refreshedConversation;
            }
          }

          return loadedConversations[0];
        }
      );
    } catch (requestError) {
      console.error(
        "Failed to load conversations:",
        requestError
      );

      setError("Failed to load conversations.");
    } finally {
      setLoading(false);
    }
  }, [location.state]);


  const loadConversationMessages = useCallback(
    async (conversationId) => {
      if (!conversationId) {
        setMessages([]);
        return;
      }

      try {
        setMessagesLoading(true);
        setMessagesError("");

        const response = await getMessages(
          conversationId,
          30
        );

        setMessages(response.messages || []);

        await markMessagesAsRead(conversationId);

        setConversations(
          (previousConversations) =>
            previousConversations.map(
              (conversation) =>
                conversation.id === conversationId
                  ? {
                      ...conversation,
                      unread_count: 0,
                    }
                  : conversation
            )
        );
      } catch (requestError) {
        console.error(
          "Failed to load messages:",
          requestError
        );

        setMessagesError(
          "Failed to load messages."
        );
      } finally {
        setMessagesLoading(false);
      }
    },
    []
  );


  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      try {
        setUserLoading(true);
        setUserError("");

        const response = await API.get("/me");

        if (!isMounted) {
          return;
        }

        setUser(response.data);
        localStorage.setItem(
          "user",
          JSON.stringify(response.data)
        );
      } catch (requestError) {
        console.error(
          "Failed to load current user:",
          requestError
        );

        if (!isMounted) {
          return;
        }

        setUserError(
          "Session expired. Please log in again."
        );

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
      } finally {
        if (isMounted) {
          setUserLoading(false);
        }
      }
    };

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [navigate]);


  useEffect(() => {
    loadConversations();
  }, [loadConversations]);


  useEffect(() => {
    loadConversationMessages(
      selectedConversation?.id
    );
  }, [
    selectedConversation?.id,
    loadConversationMessages,
  ]);


  useEffect(() => {
    scrollToLatestMessage();
  }, [messages, scrollToLatestMessage]);


  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    setMessagesError("");
  };


  const handleSendMessage = (event) => {
    event.preventDefault();

    const cleanedMessage = messageText.trim();

    if (
      !cleanedMessage ||
      !selectedConversation ||
      sending
    ) {
      return;
    }

    try {
      setSending(true);
      setMessagesError("");

      const sentSuccessfully =
        sendSocketMessage(cleanedMessage);

      if (!sentSuccessfully) {
        setMessagesError(
          "Chat is not connected. Please wait and try again."
        );
        return;
      }

      setMessageText("");
    } finally {
      setSending(false);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };


  const handleGoProfile = () => {
    navigate("/profile");
  };


  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm font-semibold text-slate-500">
          Loading messages...
        </p>
      </div>
    );
  }


  if (userError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm font-semibold text-red-600">
          {userError}
        </p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-100">
      <DashboardNavbar
        user={user}
        onLogout={handleLogout}
        onGoProfile={handleGoProfile}
      />
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-900">
            Messages
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Chat with your accepted friends in real time.
          </p>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-slate-500">
            Loading conversations...
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {!loading && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex h-[720px] overflow-hidden">
            {/* Conversation List */}
            <aside className="w-80 border-r border-slate-200 flex flex-col">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="font-bold text-slate-900">
                  Conversations
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  {conversations.length} conversation
                  {conversations.length === 1
                    ? ""
                    : "s"}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-6 text-sm text-slate-500">
                    No conversations found. Start a chat
                    with one of your accepted friends.
                  </div>
                ) : (
                  conversations.map((conversation) => {
                    const isSelected =
                      selectedConversation?.id ===
                      conversation.id;

                    return (
                      <button
                        type="button"
                        key={conversation.id}
                        onClick={() =>
                          handleSelectConversation(
                            conversation
                          )
                        }
                        className={`w-full text-left p-4 border-b border-slate-100 transition-colors ${
                          isSelected
                            ? "bg-indigo-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {conversation.other_user
                            .profile_picture ? (
                            <img
                              src={
                                conversation.other_user
                                  .profile_picture
                              }
                              alt={
                                conversation.other_user
                                  .username
                              }
                              className="h-11 w-11 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="h-11 w-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                              {conversation.other_user.username
                                .substring(0, 2)
                                .toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-bold text-sm text-slate-900 truncate">
                                {conversation.other_user
                                  .name ||
                                  conversation.other_user
                                    .username}
                              </h3>

                              {conversation.unread_count >
                                0 && (
                                <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                                  {
                                    conversation.unread_count
                                  }
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 truncate mt-1">
                              {conversation.last_message
                                ?.content ||
                                "No messages yet"}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Chat Window */}
            <section className="flex-1 min-w-0 flex flex-col">
              {!selectedConversation ? (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <div className="mx-auto h-14 w-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <svg
                        className="h-7 w-7"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                      </svg>
                    </div>

                    <p className="mt-4 font-bold text-slate-800">
                      Select a conversation
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      Choose a friend from the left side.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="h-20 px-5 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedConversation.other_user
                        .profile_picture ? (
                        <img
                          src={
                            selectedConversation.other_user
                              .profile_picture
                          }
                          alt={
                            selectedConversation.other_user
                              .username
                          }
                          className="h-11 w-11 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                          {selectedConversation.other_user.username
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                      )}

                      <div>
                        <h2 className="font-black text-slate-900">
                          {selectedConversation.other_user
                            .name ||
                            selectedConversation.other_user
                              .username}
                        </h2>

                        <p
                          className={`text-xs font-semibold ${
                            isConnected
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }`}
                        >
                          {isConnected
                            ? "Connected"
                            : "Connecting..."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto bg-slate-50 px-5 py-5">
                    {messagesLoading ? (
                      <div className="text-center text-sm text-slate-500 py-8">
                        Loading messages...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center">
                        <div>
                          <p className="font-bold text-slate-700">
                            No messages yet
                          </p>

                          <p className="text-sm text-slate-500 mt-1">
                            Send the first message.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((message) => {
                          const isMyMessage =
                            message.sender_id !==
                            selectedConversation.other_user
                              .id;

                          return (
                            <div
                              key={message.id}
                              className={`flex ${
                                isMyMessage
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[72%] rounded-2xl px-4 py-2.5 shadow-sm ${
                                  isMyMessage
                                    ? "bg-indigo-600 text-white rounded-br-md"
                                    : "bg-white text-slate-900 border border-slate-200 rounded-bl-md"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>

                                <div
                                  className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                                    isMyMessage
                                      ? "text-indigo-100"
                                      : "text-slate-400"
                                  }`}
                                >
                                  <span>
                                    {formatMessageTime(
                                      message.created_at
                                    )}
                                  </span>

                                  {isMyMessage && (
                                    <span>
                                      {message.is_read
                                        ? "Seen"
                                        : message.is_delivered
                                          ? "Delivered"
                                          : "Sent"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {(messagesError || socketError) && (
                    <div className="px-5 py-2 bg-red-50 text-red-700 text-xs border-t border-red-100">
                      {messagesError || socketError}
                    </div>
                  )}

                  {/* Message Input */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-4 border-t border-slate-200 bg-white"
                  >
                    <div className="flex items-end gap-3">
                      <textarea
                        value={messageText}
                        onChange={(event) =>
                          setMessageText(
                            event.target.value
                          )
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" &&
                            !event.shiftKey
                          ) {
                            event.preventDefault();
                            handleSendMessage(event);
                          }
                        }}
                        placeholder="Write a message..."
                        rows={1}
                        maxLength={5000}
                        className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
                      />

                      <button
                        type="submit"
                        disabled={
                          !messageText.trim() ||
                          !isConnected ||
                          sending
                        }
                        className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {sending ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;