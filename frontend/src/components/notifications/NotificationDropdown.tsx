// src/components/notifications/NotificationDropdown.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import api from "../../api/apiClient";
import { WS_BASE } from "../../api/apiClient";
import NotificationItem from "./NotificationItem";
import toast from "react-hot-toast";

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const resp = await api.get('/notifications/');
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
      const resp = await api.get('/notifications/unread/');
      return Array.isArray(resp.data) ? resp.data : resp.data.results ?? [];
    } catch (err) {
      console.error("Failed to load unread notifications", err);
      return [];
    }
  };

  // Mark single notification as read on server and update local state
  const markAsRead = async (id: number) => {
    if (marking) return;
    setMarking(true);
    try {
      await api.post(`/notifications/${id}/mark_read/`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    } finally {
      setMarking(false);
    }
  };

  // Mark all as read
  const markAllUnreadOnOpen = async () => {
    try {
      await api.post('/notifications/mark_all_read/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  // Toggle dropdown
  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(prev => {
      const opening = !prev;
      if (opening) fetchNotifications();
      return opening;
    });
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch initial unread count
  useEffect(() => {
    fetchUnread().then(items => setNotifications(items));
  }, []);

  // WebSocket for real-time notifications
  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = `${WS_BASE}/ws/notifications/?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[NOTIF WS] Connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          const newNotif: Notification = {
            id: data.notification?.id || Date.now(),
            title: data.notification?.title || data.title || '',
            message: data.notification?.message || data.message || '',
            notification_type: data.notification?.notification_type || 'general',
            is_read: false,
            created_at: new Date().toISOString(),
          };
          setNotifications(prev => [newNotif, ...prev]);
          toast(newNotif.title || 'New notification', { icon: '🔔' });
        }
      } catch (err) {
        console.error('Failed to parse notification WS message', err);
      }
    };

    ws.onerror = () => {};

    ws.onclose = () => {
      console.log('Notification WebSocket closed, reconnecting in 5s...');
      reconnectTimeoutRef.current = window.setTimeout(connectWebSocket, 5000);
    };

    wsRef.current = ws;
  }, []);

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
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-[55] sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown panel — mobile: centered fixed; desktop: absolute right */}
          <div
            className="
              fixed left-3 right-3 top-16 z-[60]
              sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-80
              bg-slate-900 shadow-2xl shadow-black/50 rounded-2xl overflow-hidden border border-slate-600 ring-1 ring-black/5
            "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
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

            <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto custom-scrollbar bg-slate-900">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                  <Bell size={24} className="opacity-20" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 5).map(notification => (
                  <div key={notification.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors">
                    <NotificationItem notification={notification} />
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-900 border-t border-slate-700 text-center">
              <a href="/notifications" onClick={() => setIsOpen(false)} className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors block w-full">
                See More
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
