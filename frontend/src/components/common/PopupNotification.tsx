/**
 * PopupNotification Component
 * 
 * A professional popup notification system for real-time events
 * Used for Pomodoro timer events, messages, and other real-time alerts
 */

import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react';
import {
    X, CheckCircle, AlertCircle, Info, Timer,
    Bell, Users
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationType =
    | 'success'
    | 'error'
    | 'info'
    | 'warning'
    | 'pomodoro'
    | 'message'
    | 'invitation';

export interface PopupNotification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    duration?: number; // ms, 0 = persistent
    action?: {
        label: string;
        onClick: () => void;
    };
    onDismiss?: () => void;
}

interface NotificationContextType {
    notifications: PopupNotification[];
    showNotification: (notification: Omit<PopupNotification, 'id'>) => string;
    dismissNotification: (id: string) => void;
    clearAll: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextType | null>(null);

export function usePopupNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('usePopupNotification must be used within NotificationProvider');
    }
    return context;
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationProviderProps {
    children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
    const [notifications, setNotifications] = useState<PopupNotification[]>([]);

    const showNotification = useCallback((notification: Omit<PopupNotification, 'id'>) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNotification: PopupNotification = {
            ...notification,
            id,
            duration: notification.duration ?? 5000,
        };

        setNotifications(prev => [...prev, newNotification]);
        return id;
    }, []);

    const dismissNotification = useCallback((id: string) => {
        setNotifications(prev => {
            const notification = prev.find(n => n.id === id);
            if (notification?.onDismiss) {
                notification.onDismiss();
            }
            return prev.filter(n => n.id !== id);
        });
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, showNotification, dismissNotification, clearAll }}>
            {children}
            <NotificationContainer
                notifications={notifications}
                onDismiss={dismissNotification}
            />
        </NotificationContext.Provider>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification Container
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationContainerProps {
    notifications: PopupNotification[];
    onDismiss: (id: string) => void;
}

function NotificationContainer({ notifications, onDismiss }: NotificationContainerProps) {
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            {notifications.map((notification, index) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onDismiss={onDismiss}
                    index={index}
                />
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single Notification Item
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationItemProps {
    notification: PopupNotification;
    onDismiss: (id: string) => void;
    index: number;
}

function NotificationItem({ notification, onDismiss, index }: NotificationItemProps) {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (notification.duration && notification.duration > 0) {
            const startTime = Date.now();
            const duration = notification.duration;

            const progressInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
                setProgress(remaining);

                if (remaining <= 0) {
                    clearInterval(progressInterval);
                    handleDismiss();
                }
            }, 50);

            return () => clearInterval(progressInterval);
        }
    }, [notification.duration, notification.id]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(notification.id), 300);
    };

    const getIcon = () => {
        const iconProps = { size: 20, className: "flex-shrink-0" };
        switch (notification.type) {
            case 'success':
                return <CheckCircle {...iconProps} className="text-emerald-400" />;
            case 'error':
                return <AlertCircle {...iconProps} className="text-red-400" />;
            case 'warning':
                return <AlertCircle {...iconProps} className="text-amber-400" />;
            case 'info':
                return <Info {...iconProps} className="text-blue-400" />;
            case 'pomodoro':
                return <Timer {...iconProps} className="text-red-400" />;
            case 'message':
                return <Bell {...iconProps} className="text-purple-400" />;
            case 'invitation':
                return <Users {...iconProps} className="text-cyan-400" />;
            default:
                return <Bell {...iconProps} className="text-slate-400" />;
        }
    };

    const getGradient = () => {
        switch (notification.type) {
            case 'success':
                return 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30';
            case 'error':
                return 'from-red-500/20 to-red-600/10 border-red-500/30';
            case 'warning':
                return 'from-amber-500/20 to-amber-600/10 border-amber-500/30';
            case 'info':
                return 'from-blue-500/20 to-blue-600/10 border-blue-500/30';
            case 'pomodoro':
                return 'from-red-500/20 to-orange-600/10 border-red-500/30';
            case 'message':
                return 'from-purple-500/20 to-purple-600/10 border-purple-500/30';
            case 'invitation':
                return 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30';
            default:
                return 'from-slate-500/20 to-slate-600/10 border-slate-500/30';
        }
    };

    const getProgressColor = () => {
        switch (notification.type) {
            case 'success': return 'bg-emerald-500';
            case 'error': return 'bg-red-500';
            case 'warning': return 'bg-amber-500';
            case 'info': return 'bg-blue-500';
            case 'pomodoro': return 'bg-gradient-to-r from-red-500 to-orange-500';
            case 'message': return 'bg-purple-500';
            case 'invitation': return 'bg-cyan-500';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div
            className={`
        pointer-events-auto
        bg-gradient-to-r ${getGradient()}
        backdrop-blur-xl bg-[#1e293b]/90
        rounded-xl border shadow-2xl shadow-black/20
        overflow-hidden
        transform transition-all duration-300 ease-out
        ${isExiting
                    ? 'translate-x-full opacity-0 scale-95'
                    : 'translate-x-0 opacity-100 scale-100'
                }
      `}
            style={{
                animationDelay: `${index * 50}ms`,
                animation: isExiting ? undefined : 'slideInRight 0.3s ease-out forwards',
            }}
        >
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {getIcon()}

                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-white leading-tight">
                            {notification.title}
                        </h4>
                        {notification.message && (
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                {notification.message}
                            </p>
                        )}

                        {notification.action && (
                            <button
                                onClick={() => {
                                    notification.action?.onClick();
                                    handleDismiss();
                                }}
                                className="mt-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 
                         text-white text-xs font-medium rounded-lg 
                         transition-colors duration-200"
                            >
                                {notification.action.label}
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg 
                     transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            {notification.duration && notification.duration > 0 && (
                <div className="h-0.5 bg-black/20">
                    <div
                        className={`h-full ${getProgressColor()} transition-all duration-100 ease-linear`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience Functions for Common Notifications
// ─────────────────────────────────────────────────────────────────────────────

export const NotificationHelpers = {
    pomodoroStart: (startedBy: string) => ({
        type: 'pomodoro' as const,
        title: 'Focus Session Started! 🎯',
        message: `${startedBy} started the Pomodoro timer`,
        duration: 4000,
    }),

    pomodoroPause: (pausedBy: string) => ({
        type: 'warning' as const,
        title: 'Timer Paused ⏸️',
        message: `${pausedBy} paused the session`,
        duration: 3000,
    }),

    pomodoroResume: (resumedBy: string) => ({
        type: 'pomodoro' as const,
        title: 'Timer Resumed ▶️',
        message: `${resumedBy} resumed the session`,
        duration: 3000,
    }),

    pomodoroReset: () => ({
        type: 'info' as const,
        title: 'Timer Reset 🔄',
        message: 'Session has been reset to beginning',
        duration: 3000,
    }),

    pomodoroComplete: (phase: string) => ({
        type: 'success' as const,
        title: phase === 'work' ? 'Focus Complete! 🎉' : 'Break Over! 💪',
        message: phase === 'work'
            ? 'Great job! Time for a break.'
            : 'Ready to get back to work?',
        duration: 6000,
    }),

    sessionInvitation: (startedBy: string, onJoin: () => void) => ({
        type: 'invitation' as const,
        title: 'Join Focus Session? 📚',
        message: `${startedBy} started a study session`,
        duration: 10000,
        action: {
            label: 'Join Now',
            onClick: onJoin,
        },
    }),
};

export default NotificationProvider;
