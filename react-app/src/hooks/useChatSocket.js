import { useCallback, useEffect, useRef, useState } from "react";


const getWebSocketBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    return "ws://127.0.0.1:8000";
  }

  return apiUrl
    .replace(/^http:/, "ws:")
    .replace(/^https:/, "wss:")
    .replace(/\/$/, "");
};


const useChatSocket = ({
  conversationId,
  onMessage,
  onMessagesRead,
  onMessageDelivered,
}) => {
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState("");

  const connectSocket = useCallback(() => {
    if (!conversationId) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setSocketError("Authentication token was not found.");
      return;
    }

    if (
      socketRef.current &&
      (
        socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING
      )
    ) {
      return;
    }

    const websocketBaseUrl = getWebSocketBaseUrl();

    const socketUrl =
      `${websocketBaseUrl}/chat/ws/${conversationId}` +
      `?token=${encodeURIComponent(token)}`;

    const socket = new WebSocket(socketUrl);

    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      setSocketError("");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (
          data.type === "new_message" ||
          data.type === "message_sent"
        ) {
          onMessage?.(data.message);
          return;
        }

        if (data.type === "message_delivered") {
          onMessageDelivered?.(data.message);
          return;
        }

        if (data.type === "messages_read") {
          onMessagesRead?.(data);
          return;
        }

        if (data.type === "error") {
          setSocketError(
            data.detail || "A WebSocket error occurred."
          );
        }
      } catch (error) {
        console.error(
          "Failed to process WebSocket message:",
          error
        );
      }
    };

    socket.onerror = () => {
      setSocketError("WebSocket connection failed.");
    };

    socket.onclose = (event) => {
      setIsConnected(false);

      if (
        event.code !== 1000 &&
        conversationId
      ) {
        reconnectTimerRef.current = setTimeout(
          connectSocket,
          2000
        );
      }
    };
  }, [
    conversationId,
    onMessage,
    onMessagesRead,
    onMessageDelivered,
  ]);

  useEffect(() => {
    connectSocket();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close(1000);
        socketRef.current = null;
      }

      setIsConnected(false);
    };
  }, [connectSocket]);

  const sendSocketMessage = useCallback((content) => {
    const cleanedContent = content.trim();

    if (!cleanedContent) {
      return false;
    }

    if (
      !socketRef.current ||
      socketRef.current.readyState !== WebSocket.OPEN
    ) {
      setSocketError("Chat is not connected.");
      return false;
    }

    socketRef.current.send(
      JSON.stringify({
        content: cleanedContent,
      })
    );

    return true;
  }, []);

  return {
    isConnected,
    socketError,
    sendSocketMessage,
  };
};


export default useChatSocket;