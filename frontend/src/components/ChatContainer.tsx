import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuth } from "../contexts/AuthContext";
import { useWebSocket } from "../hooks/useWebSocket";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

interface ChatContainerProps {
  onBackClick?: () => void;
}

function ChatContainer({ onBackClick }: ChatContainerProps) {
  const { selectedUser, messages, getMessageByConvId, isMessagesLoading, handleWebSocketMessage } =
    useChatStore();
  const { user } = useAuth();

  // Connect to WebSocket for real-time messages
  useWebSocket({
    conversationId: selectedUser?.id || null,
    onMessageReceived: handleWebSocketMessage,
  });

  useEffect(() => {
    if (selectedUser?.id) {
      getMessageByConvId(selectedUser.id);
    }
  }, [selectedUser, getMessageByConvId]);

  return (
    <div className="flex-1 flex flex-col bg-[#0b0f1a] relative h-full overflow-hidden">
      <ChatHeader onBackClick={onBackClick} />

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-8 custom-scrollbar">
        {isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (!messages || messages.length === 0) ? (
          <div className="flex-1 flex items-center justify-center h-full min-h-[300px]">
            <NoChatHistoryPlaceholder />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3 sm:space-y-6">
            {messages.map((msg) => {
              const isOwn = msg.sender?.id === user?.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOwn ? "items-end" : "items-start"} w-full animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`relative min-w-[60px] max-w-[80%] sm:max-w-[70%] md:max-w-[65%] p-3 sm:p-4 rounded-2xl shadow-sm transition-all duration-300 ${isOwn
                      ? "bg-indigo-600 text-white rounded-tr-sm"
                      : "bg-slate-800/80 backdrop-blur-sm text-slate-100 rounded-tl-sm border border-white/5"
                      }`}
                  >
                    {/* Image Message */}
                    {msg.message_type === "image" && msg.file_attachment && (
                      <div className="mb-2 sm:mb-3 overflow-hidden rounded-xl border border-white/10 shadow-lg">
                        <img
                          src={msg.file_attachment}
                          alt="shared"
                          className="max-h-[300px] sm:max-h-[400px] w-full object-cover cursor-pointer hover:opacity-90 transition-opacity duration-300"
                        />
                      </div>
                    )}

                    {/* File Message */}
                    {msg.message_type === "file" && msg.file_attachment && (
                      <div className={`flex items-center gap-3 p-2 sm:p-3 rounded-xl mb-2 sm:mb-3 border ${isOwn ? 'bg-black/10 border-white/10' : 'bg-slate-900/50 border-white/5'
                        }`}>
                        <div className={`p-2 rounded-lg flex items-center justify-center ${isOwn ? 'bg-white/10 text-white' : 'bg-indigo-500/20 text-indigo-400'
                          }`}>
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold truncate leading-tight">
                            {msg.file_info?.name || msg.file_attachment.split('/').pop() || 'Document'}
                          </p>
                          <div className="flex items-center gap-2 sm:gap-3 mt-1">
                            <span className="text-[9px] sm:text-[10px] opacity-70 font-mono font-bold uppercase tracking-wider">
                              {msg.file_info?.size ? `${(msg.file_info.size / 1024).toFixed(1)} KB` : 'PDF'}
                            </span>
                            <a
                              href={msg.file_attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] underline underline-offset-4 hover:opacity-80 transition-opacity ${isOwn ? 'text-white' : 'text-indigo-400'
                                }`}
                            >
                              Open
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Text Message */}
                    {msg.message_type === "text" && (
                      <p className="text-[14px] sm:text-[15px] leading-relaxed font-normal whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    )}

                    {/* Timestamp */}
                    <div className={`flex items-center gap-2 mt-1.5 sm:mt-2 transition-opacity ${isOwn ? 'justify-end text-white/50' : 'justify-start text-slate-500'
                      }`}>
                      <span className="text-[9px] sm:text-[10px] font-semibold tracking-wide">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isOwn && (
                        <div className="flex items-center">
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <MessageInput />
    </div>
  );
}

export default ChatContainer;
