import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuth } from "../contexts/AuthContext";
import { useWebSocket } from "../hooks/useWebSocket";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

function ChatContainer() {
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
  }, [selectedUser]);
  return (
    <>
      <ChatHeader />
      <div className="flex-1 px-6 overflow-y-auto py-8">

        {isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : messages.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => {
             
              const isOwn = msg.sender?.id === user?.id;

              return (
                <div
                  key={msg.id}
                  className={`chat ${isOwn ? "chat-end" : "chat-start"}`}
                >
                  <div
                    className={`chat-bubble relative ${isOwn
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-800 text-slate-200"
                      }`}
                  >
                    {msg.message_type === "image" && msg.file_attachment && (
                      <img
                        src={msg.file_attachment}
                        alt="shared"
                        className="rounded-lg h-48 object-cover"
                      />
                    )}

                    {msg.message_type === "file" && msg.file_attachment && (
                      <div className="flex items-start gap-3 max-w-sm">
                        {/* File Icon with Download Arrow */}
                        <div className="flex-shrink-0 w-14 h-14 bg-cyan-600/20 rounded-full flex items-center justify-center relative">
                          <svg className="w-7 h-7 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          {/* Download Arrow Overlay */}
                          <div className="absolute bottom-0 right-0 bg-cyan-600 rounded-full w-5 h-5 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </div>
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm mb-1">
                            {msg.file_info?.name || msg.file_attachment.split('/').pop() || 'Document.pdf'}
                          </p>
                          <p className="text-xs text-slate-400 mb-2">
                            {msg.file_info?.size ? `${(msg.file_info.size / 1024).toFixed(1)} KB` : 'PDF'}
                          </p>
                          <a
                            href={msg.file_attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="text-cyan-500 hover:text-cyan-400 text-sm font-medium uppercase tracking-wide"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    )}

                    {msg.message_type === "text" && (
                      <p className="mt-2">{msg.content}</p>
                    )}

                    <p className="text-xs mt-1 opacity-75">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <NoChatHistoryPlaceholder name={selectedUser?.full_name ?? "User"} />
        )}
      </div>

      <MessageInput />
    </>
  );
}

export default ChatContainer;
