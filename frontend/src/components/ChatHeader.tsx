import { ArrowLeft, XIcon, MoreVertical } from "lucide-react";
import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuth } from "../contexts/AuthContext";

interface ChatHeaderProps {
  onBackClick?: () => void;
}

function ChatHeader({ onBackClick }: ChatHeaderProps) {
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

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedUser(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [setSelectedUser]);

  return (
    <div className="flex justify-between items-center bg-[#0b0f1a] border-b border-white/5 h-16 sm:h-20 px-3 sm:px-8 sticky top-0 z-10 backdrop-blur-md bg-opacity-95">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile Back/Menu Button */}
        <button
          onClick={onBackClick}
          className="md:hidden p-2 -ml-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={22} />
        </button>

        {/* Profile Image */}
        <div className="relative group flex-shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl overflow-hidden ring-2 ring-white/5 group-hover:ring-indigo-500/50 transition-all duration-300">
            <img
              src={
                isGroup
                  ? selectedUser.group_profile_pic || "/avatar.png"
                  : otherUser?.profile_pic_url || "/avatar.png"
              }
              alt={isGroup ? selectedUser.group_name : otherUser?.full_name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          {!isGroup && isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1">
              <span className="block w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 sm:border-4 border-[#0b0f1a] shadow-lg shadow-emerald-500/20" />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex flex-col min-w-0">
          <h3 className="text-white font-bold text-[14px] sm:text-[16px] tracking-tight truncate max-w-[150px] sm:max-w-none">
            {isGroup ? selectedUser.group_name : otherUser?.full_name}
          </h3>
          <div className="flex items-center gap-2">
            {/* Status Indicator */}
            {(isTypingIndividual || isTypingGroup) ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="flex gap-0.5 sm:gap-1">
                  <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" />
                </span>
                <p className="text-[11px] sm:text-[13px] text-indigo-400 font-semibold animate-pulse">
                  Typing...
                </p>
              </div>
            ) : (
              <p className={`text-[11px] sm:text-[13px] font-medium transition-colors truncate ${isOnline ? 'text-indigo-400/80' : 'text-slate-500'
                }`}>
                {isGroup
                  ? `${onlineCount} Active`
                  : isOnline ? "Online" : "Offline"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
        <button
          onClick={() => setSelectedUser(null)}
          className="hidden sm:flex p-2.5 rounded-xl bg-slate-800/20 text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all duration-200 border border-white/5"
          title="Close Chat"
        >
          <XIcon size={20} />
        </button>

        {/* Mobile Options */}
        <button
          className="sm:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
        >
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;