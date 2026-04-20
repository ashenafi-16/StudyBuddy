import { useEffect, useState } from "react";
import api from "../api/apiClient";
import { Bell, ArrowLeft, Inbox, Filter } from "lucide-react";
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

type FilterTab = 'all' | 'unread';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                const resp = await api.get('/notifications/');
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
    }, []);

    const markAllAsRead = async () => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
            if (unreadIds.length === 0) return;

            await Promise.all(unreadIds.map(id =>
                api.put(`/notifications/${id}/mark-read/`)
            ));
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    const filteredNotifications = activeFilter === 'unread'
        ? notifications.filter(n => !n.is_read)
        : notifications;

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
                <header className="flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-sm p-4 rounded-2xl border border-slate-800 shadow-lg z-10">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Link to="/dashboard" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                            Notifications
                        </h1>
                    </div>
                    <button
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                        className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 sm:px-4 py-2 hover:bg-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Mark all read
                    </button>
                </header>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 px-1">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            activeFilter === 'all'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                        }`}
                    >
                        <Inbox size={16} />
                        All
                        <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded-full">{notifications.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveFilter('unread')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            activeFilter === 'unread'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                        }`}
                    >
                        <Filter size={16} />
                        Unread
                        {unreadCount > 0 && (
                            <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                        )}
                    </button>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-8 h-8 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
                            <p className="text-slate-500">Loading your updates...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
                            <div className="p-5 bg-slate-800/50 rounded-full">
                                <Bell className="w-10 h-10 opacity-40" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-medium text-slate-400 mb-1">
                                    {activeFilter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                                </p>
                                <p className="text-sm text-slate-600">
                                    {activeFilter === 'unread'
                                        ? 'You have no unread notifications'
                                        : 'Notifications will appear here when there is activity'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                            {filteredNotifications.map((notification) => (
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
