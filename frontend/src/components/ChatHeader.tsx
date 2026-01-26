import { XIcon } from "lucide-react";
import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuth } from "../contexts/AuthContext";

function ChatHeader() {
  const { selectedUser, setSelectedUser, onlineUsers, typingUsers } = useChatStore();
  const { user } = useAuth();

  if (!selectedUser) return null;

  const isGroup = !!selectedUser.group_name;

  const otherUser = !isGroup
    ? selectedUser.members?.find((m: any) => m.id !== user?.id)
    : null;

  const isOnline = 
    !isGroup &&
    otherUser &&
    onlineUsers instanceof Set &&
    onlineUsers.has(otherUser?.id);

  // typing checks
  const isTypingIndividual = 
    !isGroup && 
    !!otherUser && 
    typingUsers.has(otherUser.id);
  

  const isTypingGroup =
    isGroup &&
    selectedUser.members?.some((m: any) =>
      typingUsers.has(m.id)
    );
  
  const onlineCount = isGroup
    ? selectedUser.members?.filter((m: any) =>
        onlineUsers.has(m.id)
      ).length || 0
    : 0;
  console.log("is typing; ", isTypingIndividual, otherUser, typingUsers)


  console.log("currently typing user: ", typingUsers)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedUser(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [setSelectedUser]);

  return (
    <div className="flex justify-between items-center bg-slate-800/50 border-b border-slate-700/50 h-[84px] px-6">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <img
              src={
                isGroup
                  ? selectedUser.group_profile_pic || "/avatar.png"
                  : otherUser?.profile_pic_url || "/avatar.png"
              }
              alt={isGroup ? selectedUser.group_name : otherUser?.full_name}
            />
          </div>

          {/* ✅ Online dot */}
          {!isGroup && isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
          )}
        </div>

        <div>
          <h3 className="text-slate-200 font-medium">
            {isGroup ? selectedUser.group_name : otherUser?.full_name}
          </h3>

          {/* ✅ Status / Typing text */}
          <p className="text-slate-400 text-sm">
            {isTypingIndividual && "Typing..."}
            {isTypingGroup && "Someone is typing..."}
            {!isTypingIndividual && !isTypingGroup && (
              isGroup
                ? `${onlineCount} online / ${selectedUser.total_members || 0}`
                : isOnline
                ? "Online"
                : "Offline"
            )}
          </p>
        </div>
      </div>

      <button onClick={() => setSelectedUser(null)}>
        <XIcon className="w-5 h-5 text-slate-400 hover:text-slate-200" />
      </button>
    </div>
  );
}

export default ChatHeader;