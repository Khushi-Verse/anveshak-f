
import { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestToast, setLatestToast] = useState(null);

  const { user, token: contextToken } = useAuth();

  useEffect(() => {
    const token =
      contextToken || localStorage.getItem("anveshak_token");

    if (!token) return;

    // 1. Fetch initial notifications
    fetch(`${API_URL}/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(
            data.filter((notification) => !notification.isRead).length
          );
        }
      })
      .catch((err) =>
        console.error("Failed to fetch notifications:", err)
      );

    // 2. Connect Socket.IO to the backend root
    const socket = io(SOCKET_URL, {
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("Socket.IO connected:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error.message);
    });

    socket.on("newNotification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setLatestToast(notif);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, contextToken]);

  const markAsRead = useCallback(
    async (id) => {
      let shouldCallApi = false;

      setNotifications((prev) => {
        const target = prev.find((notification) => notification._id === id);

        if (!target || target.isRead) {
          return prev;
        }

        shouldCallApi = true;

        return prev.map((notification) =>
          notification._id === id
            ? { ...notification, isRead: true }
            : notification
        );
      });

      if (!shouldCallApi) return;

      setUnreadCount((prev) => Math.max(0, prev - 1));

      const token =
        contextToken || localStorage.getItem("anveshak_token");

      try {
        await fetch(`${API_URL}/notifications/${id}/read`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.error(
          "Failed to mark notification as read:",
          err
        );
      }
    },
    [contextToken]
  );

  const clearToast = useCallback(() => {
    setLatestToast(null);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    latestToast,
    clearToast,
  };
}
