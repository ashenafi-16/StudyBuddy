import { useEffect, useMemo } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuth } from "../contexts/AuthContext";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";

interface ChatsListProps {
  searchQuery?: string;
}

function ChatsList({ searchQuery = "" }: ChatsListProps) {
  const { getAllIndividualContacts, chats = [], isUsersLoading, setSelectedUser, selectedUser, onlineUsers, typingUsers } = useChatStore();
  const { user } = useAuth();

  useEffect(() => {
    getAllIndividualContacts();
  }, [getAllIndividualContacts]);

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter((chat) => {
      const otherUser = (chat.members || []).find((p) => p.id !== user?.id);
      return otherUser?.full_name?.toLowerCase().includes(q);
    });
  }, [chats, searchQuery, user?.id]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (!chats || chats.length === 0) return <NoChatsFound />;

  return (
    <div className="space-y-0.5">
      {filteredChats.map((chat) => {
        const otherUser = (chat.members || []).find((p) => p.id !== user?.id);
        if (!otherUser) return null;

        const isActive = selectedUser?.id === chat.id;
        const isOnline = onlineUsers instanceof Set && onlineUsers.has(otherUser.id);
        const isTyping = typingUsers instanceof Set && typingUsers.has(otherUser.id);

        return (
          <button
            key={chat.id}
            className={`w-full group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${isActive
                ? "bg-indigo-600/15 border border-indigo-500/20"
                : "bg-transparent hover:bg-white/[0.03] border border-transparent"
              }`}
            onClick={() => setSelectedUser(chat)}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className={`w-11 h-11 rounded-full overflow-hidden ring-2 transition-all duration-300 ${isActive ? 'ring-indigo-500/30' : 'ring-white/[0.06] group-hover:ring-white/10'
                }`}>
                <img
                  src={otherUser.profile_pic_url || "/avatar.png"}
                  alt={otherUser.full_name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Online Dot */}
              {isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5">
                  <span className="block w-3.5 h-3.5 bg-emerald-500 rounded-full border-[2.5px] border-[#0a0e1a] shadow-sm shadow-emerald-500/30" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className={`text-[13.5px] font-semibold truncate transition-colors ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
                  }`}>
                  {otherUser.full_name}
                </h4>
                {chat.updated_at && (
                  <span className="text-[10px] text-slate-500 flex-shrink-0 font-medium">
                    {formatRelativeTime(chat.updated_at)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className={`text-[12px] truncate ${isActive ? 'text-indigo-300/70' : isTyping ? 'text-indigo-400' : 'text-slate-500'
                  }`}>
                  {isTyping ? (
                    <span className="flex items-center gap-1">
                      <span className="flex gap-[2px]">
                        <span className="w-[4px] h-[4px] bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-[4px] h-[4px] bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-[4px] h-[4px] bg-indigo-400 rounded-full animate-bounce" />
                      </span>
                      typing
                    </span>
                  ) : isOnline ? 'Online' : 'Offline'}
                </p>
                {chat.unread_count > 0 && !isActive && (
                  <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                    {chat.unread_count > 99 ? '99+' : chat.unread_count}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHrs < 24) return `${diffHrs}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default ChatsList;