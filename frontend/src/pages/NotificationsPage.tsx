import { useEffect, useState } from "react";
import axios from "axios";
import { Bell, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import NotificationItem from "../components/notifications/NotificationItem";

interface Notification {
    id: number;
    title: string;
    message: string;
    notification_type: string;
    is_read: boolean;
    created_at: string;
}

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token");
    const authHeaders = {
        headers: {
            Authorization: token ? `Bearer ${token}` : "",
        },
    };

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                const resp = await axios.get(`${API_BASE_URL}/notifications/`, authHeaders);
                const items: Notification[] = Array.isArray(resp.data) ? resp.data : resp.data.results ?? [];

                // Ensure sorted by time (newest first)
                items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                setNotifications(items);
            } catch (err) {
                console.error("Failed to load notifications", err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [token]);

    const markAllAsRead = async () => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

            // Call backend for each unread (or bulk if available, but reusing dropdown logic for now which does parallel requests or similar)
            // Ideally backend has a bulk endpoint. If not, we just rely on visual update for now or loop.
            // Dropdown does: Promise.all(unreadIds.map(...))

            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
            if (unreadIds.length === 0) return;

            await Promise.all(unreadIds.map(id =>
                axios.put(`${API_BASE_URL}/notifications/${id}/mark-read/`, {}, authHeaders)
            ));
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <header className="flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-sm p-4 rounded-2xl border border-slate-800 shadow-lg z-10">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                            Notifications
                        </h1>
                    </div>
                    <button
                        onClick={markAllAsRead}
                        className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-4 py-2 hover:bg-slate-800 rounded-lg"
                    >
                        Mark all read
                    </button>
                </header>

                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-8 h-8 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
                            <p className="text-slate-500">Loading your updates...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
                            <div className="p-4 bg-slate-800 rounded-full">
                                <Bell className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="text-lg">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                            {notifications.map((notification) => (
                                <div key={notification.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors">
                                    <NotificationItem notification={notification} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
