// import React, { useEffect, useState, useCallback } from 'react';
// import { useParams } from 'react-router-dom';
// import type { Conversation, Message, TypingIndicator as TypingIndicatorType } from '../types/chat';
// import { fetchConversation, fetchMessages, sendFileMessage, sendTextMessage } from '../api/chatApi';
// import { useWebSocket } from '../hooks/useWebsocket';
// import { useAuth } from '../contexts/AuthContext';
// import ChatHeader from '../components/chat/ChatHeader';
// import MessageList from '../components/chat/MessageList';
// import MessageInput from '../components/chat/MessageInput';
// import { Loader } from 'lucide-react';

// const ChatArea: React.FC = () => {
//     const { conversationId } = useParams();
//     const { user } = useAuth();

//     // State
//     const [conversation, setConversation] = useState<Conversation | null>(null);
//     const [messages, setMessages] = useState<Message[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [replyTo, setReplyTo] = useState<Message | null>(null);
//     const [typingUsers, setTypingUsers] = useState<TypingIndicatorType[]>([]);
//     // We can lift drafts to context or layout if we want them to persist across navigation
//     // For now, we'll keep them local or use a simple ref/localStorage approach if needed.
//     // Actually, the user requested persistence.
//     // Since ChatArea unmounts when switching chats (due to key change or route change), 
//     // we need to store drafts in a parent or global store.
//     // However, the previous implementation in ChatPage used a state object.
//     // Let's use localStorage for simplicity and robustness across reloads.
//     const [draft, setDraft] = useState('');

//     // Load conversation details and messages
//     useEffect(() => {
//         const loadData = async () => {
//             if (!conversationId) return;

//             try {
//                 setLoading(true);
//                 const [convData, msgsData] = await Promise.all([
//                     fetchConversation(parseInt(conversationId)),
//                     fetchMessages(parseInt(conversationId))
//                 ]);

//                 setConversation(convData);
//                 setMessages(msgsData);

//                 // Load draft
//                 const savedDraft = localStorage.getItem(`chat_draft_${conversationId}`);
//                 setDraft(savedDraft || '');

//             } catch (err) {
//                 console.error('Failed to load chat data:', err);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         loadData();
//     }, [conversationId]);

//     // WebSocket handlers
//     const handleMessageReceived = useCallback((msg: Message) => {
//         setMessages(prev => {
//             if (prev.some(m => m.id === msg.id)) return prev;
//             return [...prev, msg];
//         });
//     }, []);

//     const handleTypingIndicator = useCallback((userId: number, isTyping: boolean) => {
//         setTypingUsers(prev => {
//             if (isTyping) {
//                 if (!prev.some(t => t.user_id === userId)) {
//                     return [...prev, { user_id: userId, user_name: 'User', conversation_id: parseInt(conversationId || '0') }];
//                 }
//                 return prev;
//             } else {
//                 return prev.filter(t => t.user_id !== userId);
//             }
//         });
//     }, [conversationId]);

//     // WebSocket connection
//     const { sendMessage: sendWebSocketMessage, sendTypingIndicator } = useWebSocket({
//         conversationId: conversationId ? parseInt(conversationId) : null,
//         onMessageReceived: handleMessageReceived,
//         onTypingIndicator: handleTypingIndicator
//     });

//     const handleDraftChange = (content: string) => {
//         setDraft(content);
//         if (conversationId) {
//             localStorage.setItem(`chat_draft_${conversationId}`, content);
//         }
//     };

//     const handleSendMessage = async (content: string, file?: File) => {
//         if (!conversation || !user || !conversationId) return;

//         try {
//             if (file) {
//                 await sendFileMessage(conversation.id, content, file, replyTo?.id);
//             } else {
//                 const sent = sendWebSocketMessage(content, user.id);
//                 if (!sent) {
//                     await sendTextMessage(conversation.id, content, replyTo?.id);
//                 }
//             }

//             // Clear draft
//             setDraft('');
//             localStorage.removeItem(`chat_draft_${conversationId}`);
//             setReplyTo(null);
//         } catch (err) {
//             console.error('Failed to send message:', err);
//             throw err;
//         }
//     };

//     const isTyping = typingUsers.some(t => t.user_id !== user?.id);

//     if (loading) {
//         return (
//             <div className="flex-1 flex items-center justify-center bg-transparent">
//                 <Loader className="animate-spin text-emerald-500" size={32} />
//             </div >
//         );
//     }

//     if (!conversation) {
//         return (
//             <div className="flex-1 flex items-center justify-center bg-[#0f172a] text-slate-400">
//                 Conversation not found
//             </div>
//         );
//     }

//     return (
//         <>
//             <ChatHeader
//                 conversation={conversation}
//                 currentUserId={user?.id}
//                 isTyping={isTyping}
//             />

//             <MessageList
//                 messages={messages}
//                 currentUserId={user?.id || 0}
//                 isTyping={isTyping}
//                 onReply={setReplyTo}
//                 onEdit={(msg) => console.log('Edit', msg)}
//                 onDelete={(id) => console.log('Delete', id)}
//                 loading={loading}
//             />

//             <MessageInput
//                 onSendMessage={handleSendMessage}
//                 onTyping={(isTyping) => sendTypingIndicator(isTyping)}
//                 replyTo={replyTo}
//                 onCancelReply={() => setReplyTo(null)}
//                 conversationId={conversation.id}
//                 initialDraft={draft}
//                 onDraftChange={handleDraftChange}
//             />
//         </>
//     );
// };

// export default ChatArea;