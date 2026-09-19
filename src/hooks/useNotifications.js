import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestToast, setLatestToast] = useState(null);
  
  // Destructure token from AuthContext. Fallback to localStorage for robustness.
  const { user, token: contextToken } = useAuth();

  useEffect(() => {
    const token = contextToken || localStorage.getItem('anveshak_token');
    
    // If not authenticated, we don't connect.
    if (!token) return;

    // 1. Fetch initial notifications from REST endpoint
   fetch(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.isRead).length);
        }
      })
      .catch(err => console.error("Failed to fetch notifications:", err));

    // 2. Connect Socket.io for real-time updates
    const socket = io(API_URL, {
      auth: { token }
    });

    socket.on("newNotification", (notif) => {
      // Prepend new notification to the list
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Trigger the toast popup
      setLatestToast(notif);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, contextToken]);

  const markAsRead = useCallback(async (id) => {
    let shouldCallApi = false;
    
    setNotifications(prev => {
      const target = prev.find(n => n._id === id);
      if (!target || target.isRead) return prev;
      shouldCallApi = true;
      return prev.map(n => n._id === id ? { ...n, isRead: true } : n);
    });

    if (!shouldCallApi) return;
    
    setUnreadCount(prev => Math.max(0, prev - 1));

    const token = contextToken || localStorage.getItem('anveshak_token');
    try {
      // Send PATCH request to backend
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, [contextToken]);

  const clearToast = useCallback(() => setLatestToast(null), []);

  return { 
    notifications, 
    unreadCount, 
    markAsRead, 
    latestToast, 
    clearToast 
  };
}
