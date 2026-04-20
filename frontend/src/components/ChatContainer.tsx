import { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuth } from "../contexts/AuthContext";
import { useWebSocket } from "../hooks/useWebSocket";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { Reply, CornerUpLeft } from "lucide-react";

interface ChatContainerProps {
  onBackClick?: () => void;
}

function ChatContainer({ onBackClick }: ChatContainerProps) {
  const { selectedUser, messages, getMessageByConvId, isMessagesLoading, handleWebSocketMessage, setReplyTo, typingUsers, setUserTyping, clearUserTyping } =
    useChatStore();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<number | string | null>(null);

  // Handle typing events from chat WebSocket
  const handleTypingIndicator = useCallback((userId: number, isTyping: boolean) => {
    if (isTyping) {
      setUserTyping(userId);
      // Auto-clear after 3 seconds
      setTimeout(() => clearUserTyping(userId), 3000);
    } else {
      clearUserTyping(userId);
    }
  }, [setUserTyping, clearUserTyping]);

  // Connect to WebSocket for real-time messages + typing
  const { sendTypingIndicator } = useWebSocket({
    conversationId: selectedUser?.id || null,
    onMessageReceived: handleWebSocketMessage,
    onTypingIndicator: handleTypingIndicator,
  });

  useEffect(() => {
    if (selectedUser?.id) {
      getMessageByConvId(selectedUser.id);
      // Mark messages as read when opening a conversation
      import('../services/api').then(({ default: api }) => {
        api.post('/messages/mark_read/', { conversation_id: selectedUser.id }).catch(() => {});
      });
    }
  }, [selectedUser, getMessageByConvId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isGroup = !!selectedUser?.group_name;

  // Determine if someone is typing
  const typingUserIds = isGroup
    ? selectedUser?.members?.filter((m: any) => m.id !== user?.id && typingUsers.has(m.id)) || []
    : [];
  const otherUser = !isGroup ? selectedUser?.members?.find((m: any) => m.id !== user?.id) : null;
  const isOtherTyping = !isGroup && otherUser && typingUsers.has(otherUser.id);
  const showTyping = isGroup ? typingUserIds.length > 0 : isOtherTyping;

  // Find the replied-to message content
  const getReplyInfo = (msg: any) => {
    if (msg.reply_to_info) return msg.reply_to_info;
    if (msg.reply_to) {
      const replied = messages.find(m => m.id === msg.reply_to);
      console.log("replied username: ", replied)
      if (replied) {
        return {
          message_id: replied.id,
          sender: replied.sender?.full_name || replied.sender?.email || 'Unknown',
          content: replied.content?.substring(0, 60) || '',
        };
      }
    }
    return null;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] relative h-full overflow-hidden">
      <ChatHeader onBackClick={onBackClick} />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 custom-scrollbar">
        {isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (!messages || messages.length === 0) ? (
          <div className="flex-1 flex items-center justify-center h-full min-h-[300px]">
            <NoChatHistoryPlaceholder name={selectedUser?.group_name || selectedUser?.full_name || 'this chat'} />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-1">
            {messages.map((msg, index) => {
              const isOwn = msg.sender?.id === user?.id;
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const isSameSenderAsPrev = prevMsg && prevMsg.sender?.id === msg.sender?.id;
              const showSenderName = isGroup && !isOwn && !isSameSenderAsPrev;
              const showAvatar = !isOwn && !isSameSenderAsPrev;
              const isShort = msg.content && msg.content.length < 30 && msg.message_type === 'text';
              const isHovered = hoveredMessageId === msg.id;
              const replyInfo = getReplyInfo(msg);

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"} ${!isSameSenderAsPrev ? 'mt-4' : 'mt-0.5'} group/msg relative`}
                  onMouseEnter={() => setHoveredMessageId(msg.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  {/* Avatar for other users */}
                  {!isOwn && (
                    <div className="w-8 flex-shrink-0 mr-2 self-end">
                      {showAvatar ? (
                        <div className="w-7 h-7 rounded-full overflow-hidden">
                          <img
                            src={msg.sender?.profile_pic_url || "/avatar.png"}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Reply button - positioned outside the bubble */}
                  {isOwn && isHovered && (
                    <button
                      onClick={() => setReplyTo(msg)}
                      className="self-center mr-2 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-all"
                      title="Reply"
                    >
                      <CornerUpLeft size={14} />
                    </button>
                  )}

                  <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} ${isShort ? '' : 'max-w-[85%] sm:max-w-[75%] md:max-w-[65%]'}`}>
                    {/* Sender name in group chats */}
                    {showSenderName && (
                      <span className="block text-[11px] font-semibold text-sky-400 opacity-80 mb-1 ml-1">
                        {msg.sender?.full_name || msg.sender?.username || msg.sender?.email || 'Unknown'}
                      </span>
                    )}

                    {/* Reply reference banner */}
                    {replyInfo && (
                      <div className={`flex items-center gap-1.5 mb-0.5 max-w-full ${isOwn ? 'mr-1' : 'ml-1'}`}>
                        <Reply size={11} className="text-slate-500 flex-shrink-0 rotate-180" />
                        <span className="text-[11px] text-slate-500 truncate">
                          <span className="font-medium text-slate-400">{replyInfo.sender}</span>
                          {': '}
                          {replyInfo.content}
                        </span>
                      </div>
                    )}

                    <div
                      className={`relative px-3.5 py-2.5 ${isOwn
                        ? `bg-[#1a6b4a] text-white ${!isSameSenderAsPrev ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-br-md'}`
                        : `bg-[#1e2533] text-slate-100 ${!isSameSenderAsPrev ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl rounded-bl-md'}`
                        }`}
                    >
                      {/* Image Message */}
                      {msg.message_type === "image" && msg.file_attachment && (
                        <div className="mb-2 overflow-hidden rounded-xl">
                          <img
                            src={msg.file_attachment}
                            alt="shared"
                            className="max-h-[300px] sm:max-h-[360px] w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        </div>
                      )}

                      {/* File Message */}
                      {msg.message_type === "file" && msg.file_attachment && (
                        <div className={`flex items-center gap-3 p-2.5 rounded-xl mb-2 ${isOwn ? 'bg-black/15' : 'bg-white/[0.03] border border-white/[0.04]'}`}>
                          <div className={`p-2 rounded-lg ${isOwn ? 'bg-white/10' : 'bg-sky-500/15'}`}>
                            <svg className="w-4 h-4 text-current opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium truncate">
                              {msg.file_info?.name || msg.file_attachment.split('/').pop() || 'Document'}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[10px] opacity-60 font-medium">
                                {msg.file_info?.size ? `${(msg.file_info.size / 1024).toFixed(1)} KB` : 'File'}
                              </span>
                              <a
                                href={msg.file_attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-[10px] font-semibold underline underline-offset-2 hover:opacity-80 ${isOwn ? 'text-white/80' : 'text-sky-400'}`}
                              >
                                Open
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Text Message */}
                      {msg.message_type === "text" && (
                        <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      )}

                      {/* Timestamp */}
                      <div className={`flex items-center gap-1.5 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[10px] font-medium ${isOwn ? 'text-white/40' : 'text-slate-500'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isOwn && (
                          msg.is_read ? (
                            <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12l5 5L17 6" />
                              <path d="M7 12l5 5L23 6" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reply button - positioned outside the bubble for non-own */}
                  {!isOwn && isHovered && (
                    <button
                      onClick={() => setReplyTo(msg)}
                      className="self-center ml-2 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-all"
                      title="Reply"
                    >
                      <CornerUpLeft size={14} />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator Bubble */}
            {showTyping && (
              <div className="flex justify-start mt-2">
                <div className="w-8 flex-shrink-0 mr-2 self-end" />
                <div className="bg-[#1e2533] rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="flex gap-[3px]">
                      <span className="w-[6px] h-[6px] bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-[6px] h-[6px] bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-[6px] h-[6px] bg-slate-400 rounded-full animate-bounce" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <MessageInput onTyping={sendTypingIndicator} />
    </div>
  );
}

export default ChatContainer;
