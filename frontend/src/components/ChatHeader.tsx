import { ArrowLeft, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuth } from "../contexts/AuthContext";
import GroupDetailPanel from "./GroupDetailPanel";

interface ChatHeaderProps {
  onBackClick?: () => void;
}

function ChatHeader({ onBackClick }: ChatHeaderProps) {
  const { selectedUser, setSelectedUser, onlineUsers, typingUsers } = useChatStore();
  const { user } = useAuth();
  const [showGroupPanel, setShowGroupPanel] = useState(false);

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
      if (e.key === "Escape") {
        if (showGroupPanel) {
          setShowGroupPanel(false);
        } else {
          setSelectedUser(null);
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [setSelectedUser, showGroupPanel]);

  const displayName = isGroup ? selectedUser.group_name : otherUser?.full_name;
  const avatarSrc = isGroup
    ? selectedUser.group_profile_pic || "/avatar.png"
    : otherUser?.profile_pic_url || "/avatar.png";

  return (
    <>
      <div className="flex justify-between items-center bg-[#0d1117] border-b border-white/[0.06] h-[64px] sm:h-[72px] px-3 sm:px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          <button
            onClick={onBackClick}
            className="md:hidden p-2 -ml-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Clickable Avatar + Info (group opens detail panel) */}
          <button
            onClick={() => isGroup && setShowGroupPanel(true)}
            className={`flex items-center gap-3 min-w-0 ${isGroup ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden ring-2 ring-white/[0.06]">
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              {!isGroup && isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5">
                  <span className="block w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0d1117]" />
                </div>
              )}
            </div>

            {/* User / Group Info */}
            <div className="flex flex-col min-w-0 text-left">
              <h3 className="text-white font-semibold text-[14px] sm:text-[15px] tracking-tight truncate">
                {displayName}
              </h3>
              <div className="flex items-center gap-1.5">
                {(isTypingIndividual || isTypingGroup) ? (
                  <div className="flex items-center gap-1.5">
                    <span className="flex gap-[3px]">
                      <span className="w-[5px] h-[5px] bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-[5px] h-[5px] bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-[5px] h-[5px] bg-indigo-400 rounded-full animate-bounce" />
                    </span>
                    <span className="text-[12px] text-indigo-400 font-medium">typing</span>
                  </div>
                ) : (
                  <span className={`text-[12px] font-medium ${isOnline || onlineCount > 0 ? 'text-emerald-400/80' : 'text-slate-500'
                    }`}>
                    {isGroup
                      ? `${onlineCount} online · ${selectedUser.total_members ?? 0} members`
                      : isOnline ? "Online" : "Offline"}
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setSelectedUser(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            title="Close Chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Group Detail Panel */}
      {isGroup && (
        <GroupDetailPanel
          isOpen={showGroupPanel}
          onClose={() => setShowGroupPanel(false)}
        />
      )}
    </>
  );
}

export default ChatHeader;