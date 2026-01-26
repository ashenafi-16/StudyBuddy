import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuth } from "../contexts/AuthContext";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";

function ChatsList() {
  const { getAllIndividualContacts, chats, isUsersLoading, setSelectedUser } = useChatStore();
  const { user } = useAuth();  
  useEffect(() => {
    getAllIndividualContacts();
  }, [getAllIndividualContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;
  return (
    <>
      {chats.map((chat) => {
        // Extract the other user (not me)
        const otherUser = chat.members.find(
          (participant) => participant.id !== user?.id
        );

        if (!otherUser) return null; // safety (should never happen)

        return (
          <div
            key={chat.id}
            className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
            onClick={() => setSelectedUser(chat)}
          >
            <div key={chat.id} className="flex justify-between items-center p-2">
              <span>{chat.full_name}</span>
              {chat.unread_count > 0 && (
                <span className="bg-red-500 text-white rounded-full px-2 text-xs">
                  {chat.unread_count}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="avatar size-14 rounded-full overflow-hidden">
                <img
                  src={otherUser.profile_pic_url || "/avatar.png"}
                  alt={otherUser.full_name}
                />
              </div>

              <h4 className="text-slate-200 font-medium truncate">
                {otherUser.full_name}
              </h4>
            </div>
          </div>
        );
      })}
    </>
  );
}

export default ChatsList;
