// src/components/notifications/NotificationDropdown.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import axios from "axios";
import NotificationItem from "./NotificationItem";

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

const API_BASE_URL = "http://127.0.0.1:8000/api";
const WS_BASE_URL = "ws://127.0.0.1:8000";

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false); // prevents duplicate mark-read runs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const token = localStorage.getItem("token"); // or get from context

  const authHeaders = {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const resp = await axios.get(`${API_BASE_URL}/notifications/`, authHeaders);
      const items = Array.isArray(resp.data) ? resp.data : resp.data.results ?? [];
      setNotifications(items);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnread = async (): Promise<Notification[]> => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/notifications/unread/`, authHeaders);
      return Array.isArray(resp.data) ? resp.data : resp.data.results ?? [];
    } catch (err) {
      console.error("Failed to load unread notifications", err);
      return [];
    }
  };

  // Mark single notification as read on server and update local state
  // Mark as read functionality handled by NotificationContext

  const markAllUnreadOnOpen = async () => {
    if (marking) return;
    setMarking(true);
    try {
      const unread = await fetchUnread();
      if (!unread || unread.length === 0) {
        setMarking(false);
        return;
      }

      const unreadIds = unread.map(n => n.id);
      setNotifications(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, is_read: true } : n));

      await Promise.all(unreadIds.map(id =>
        axios.put(`${API_BASE_URL}/notifications/${id}/mark-read/`, {}, authHeaders)
          .catch(err => {
            console.error(`mark-read failed for ${id}`, err);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: false } : n));
          })
      ));
    } finally {
      setMarking(false);
    }
  };

  const toggleDropdown = async () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);

    if (willOpen) {
      await fetchNotifications();
      await markAllUnreadOnOpen();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // WebSocket connection for real-time notifications
  const connectWebSocket = useCallback(() => {
    if (!token) return;

    const wsUrl = `${WS_BASE_URL}/ws/notifications/?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Notification WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'initial_load') {
          // Server sends unread notifications on connect
          setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const newNotifications = data.notifications.filter(
              (n: Notification) => !existingIds.has(n.id)
            );
            return [...newNotifications, ...prev];
          });
        } else if (data.type === 'new_notification') {
          // Real-time notification from Pomodoro lifecycle
          const notification = data.notification;
          setNotifications(prev => [notification, ...prev]);
        }
      } catch (err) {
        console.error('Failed to parse notification message', err);
      }
    };

    ws.onerror = (error) => {
      console.error('Notification WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Notification WebSocket closed, reconnecting in 5s...');
      reconnectTimeoutRef.current = window.setTimeout(connectWebSocket, 5000);
    };

    wsRef.current = ws;
  }, [token]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center border-2 border-[#1e293b]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-[#1e293b] shadow-xl shadow-black/20 rounded-2xl overflow-hidden border border-slate-700 z-50">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-[#0f172a]/50">
            <span className="font-semibold text-white">Notifications</span>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchNotifications}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={() => {
                  markAllUnreadOnOpen();
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Mark all read
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                <Bell size={24} className="opacity-20" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div key={notification.id} className="border-b border-slate-700/50 last:border-0">
                  <NotificationItem notification={notification} />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
