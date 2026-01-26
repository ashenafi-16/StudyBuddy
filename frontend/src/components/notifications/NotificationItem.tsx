// src/components/notifications/NotificationItem.tsx
import React from "react";
import { MessageSquare, ClipboardList, Users, Bell } from "lucide-react";

interface NotificationProps {
  notification: {
    id: number;
    title: string;
    message: string;
    notification_type: string;
    is_read: boolean;
    created_at: string;
  };
}

const NotificationItem: React.FC<NotificationProps> = ({ notification }) => {
  const { title, message, notification_type, is_read, created_at } = notification;

  const icons: Record<string, React.ReactElement> = {
    message: <MessageSquare className="w-5 h-5 text-blue-500" />,
    task: <ClipboardList className="w-5 h-5 text-green-500" />,
    group: <Users className="w-5 h-5 text-yellow-500" />,
    system: <Bell className="w-5 h-5 text-red-500" />,
  };

  return (
    <div
      className={`flex items-start p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${!is_read ? "bg-blue-50 dark:bg-gray-800/40" : ""
        }`}
    >
      <div className="mr-3">{icons[notification_type] || icons.system}</div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
          {title}
        </h4>
        <p className="text-gray-600 dark:text-gray-400 text-xs">{message}</p>
        <span className="text-xs text-gray-400 mt-1 block">
          {new Date(created_at).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default NotificationItem;
