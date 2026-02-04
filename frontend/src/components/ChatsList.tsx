import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuth } from "../contexts/AuthContext";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";

function ChatsList() {
  const { getAllIndividualContacts, chats = [], isUsersLoading, setSelectedUser } = useChatStore();
  const { user } = useAuth();

  useEffect(() => {
    getAllIndividualContacts();
  }, [getAllIndividualContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (!chats || chats.length === 0) return <NoChatsFound />;

  return (
    <div className="space-y-2">
      {chats.map((chat) => {
        const otherUser = (chat.members || []).find((p) => p.id !== user?.id);
        if (!otherUser) return null;

        const isActive = useChatStore.getState().selectedUser?.id === chat.id;

        return (
          <button
            key={chat.id}
            className={`w-full group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${isActive
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
              : "bg-transparent text-slate-400 hover:bg-white/5"
              }`}
            onClick={() => setSelectedUser(chat)}
          >
            {/* Avatar (Soft) */}
            <div className="relative flex-shrink-0">
              <div className={`size-12 rounded-2xl overflow-hidden ring-1 ${isActive ? 'ring-white/20' : 'ring-white/5'}`}>
                <img
                  src={otherUser.profile_pic_url || "/avatar.png"}
                  alt={otherUser.full_name}
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 grayscale-0`}
                />
              </div>
              {chat.unread_count > 0 && !isActive && (
                <div className="absolute -top-1 -right-1 size-5 bg-indigo-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[#0b0f1a] shadow-lg">
                  {chat.unread_count}
                </div>
              )}
            </div>

            <div className="flex-1 text-left min-w-0">
              <h4 className="text-[14px] font-bold tracking-tight truncate group-hover:text-white transition-colors">
                {otherUser.full_name}
              </h4>
              <p className={`text-[12px] font-medium truncate mt-0.5 ${isActive ? 'text-white/70' : 'text-slate-500 group-hover:text-slate-400'}`}>
                Direct Feed
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default ChatsList;