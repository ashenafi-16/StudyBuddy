// import React, { useEffect, useState, useCallback } from 'react';
// import { Outlet, useNavigate, useLocation } from 'react-router-dom';
// import { PlusCircle, Users, Search, MessageSquare, Menu } from 'lucide-react';
// import { fetchConversations } from '../api/chatApi';
// import type { Conversation } from '../types/chat';
// import { useAuth } from '../contexts/AuthContext';
// import ConversationItem from '../components/chat/ConversationItem';
// import NewChatModal from '../components/sidebar/NewChatModal';
// import NewGroupModal from '../components/sidebar/NewGroupModal';
// import BorderAnimatedContainer from '../components/common/BorderAnimatedContainer';

// const ChatLayout: React.FC = () => {
//     const navigate = useNavigate();
//     const location = useLocation();
//     const { user } = useAuth();

//     // State
//     const [conversations, setConversations] = useState<Conversation[]>([]);
//     const [searchQuery, setSearchQuery] = useState('');
//     const [showNewChat, setShowNewChat] = useState(false);
//     const [showNewGroup, setShowNewGroup] = useState(false);
//     const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//     // Load conversations
//     const loadConversations = useCallback(async (query?: string) => {
//         try {
//             const data = await fetchConversations(query);
//             setConversations(data);
//         } catch (err) {
//             console.error('Error loading conversations:', err);
//         }
//     }, []);

//     // Initial load
//     useEffect(() => {
//         loadConversations();
//     }, [loadConversations]);

//     // Polling for conversation list updates (every 30s)
//     useEffect(() => {
//         const interval = setInterval(() => {
//             loadConversations(searchQuery);
//         }, 30000);
//         return () => clearInterval(interval);
//     }, [searchQuery, loadConversations]);

//     const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const query = e.target.value;
//         setSearchQuery(query);

//         // Debounce search
//         const timeoutId = setTimeout(() => {
//             loadConversations(query);
//         }, 300);

//         return () => clearTimeout(timeoutId);
//     };

//     const handleSelectConversation = (conversation: Conversation) => {
//         navigate(`/chat/${conversation.id}`);
//         setIsMobileMenuOpen(false); // Close mobile menu on selection
//     };

//     return (
//         <div className="flex items-center bg-[#0f172a] p-4">
//             <div className="relative w-full max-w-6xl h-[85vh] min-h-[600px]">
//                 <BorderAnimatedContainer>
//                     <div className="flex w-full h-full overflow-hidden">
//                         {/* Mobile Menu Overlay */}
//                         {isMobileMenuOpen && (
//                             <div
//                                 className="fixed inset-0 bg-black/50 z-40 md:hidden"
//                                 onClick={() => setIsMobileMenuOpen(false)}
//                             />
//                         )}

//                         {/* Sidebar */}
//                         <div className={`
//               absolute md:relative z-50 w-80 h-full bg-slate-800/50 backdrop-blur-sm border-r border-slate-700/50 flex flex-col transition-transform duration-300 ease-in-out
//               ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
//             `}>
//                             {/* Sidebar Header */}
//                             <div className="p-4 border-b border-slate-700/50">
//                                 <div className="flex items-center justify-between mb-4">
//                                     <h2 className="font-bold text-xl text-white tracking-tight flex items-center gap-2">
//                                         Messages
//                                         <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-xs rounded-full border border-cyan-500/20">
//                                             {conversations.length}
//                                         </span>
//                                     </h2>
//                                     <div className="flex space-x-1">
//                                         <button
//                                             onClick={() => setShowNewChat(true)}
//                                             className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-lg transition-colors"
//                                             title="New Chat"
//                                         >
//                                             <PlusCircle size={20} />
//                                         </button>
//                                         <button
//                                             onClick={() => setShowNewGroup(true)}
//                                             className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-lg transition-colors"
//                                             title="New Group"
//                                         >
//                                             <Users size={20} />
//                                         </button>
//                                     </div>
//                                 </div>

//                                 {/* Search Input */}
//                                 <div className="relative group">
//                                     <Search
//                                         className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors"
//                                         size={16}
//                                     />
//                                     <input
//                                         type="text"
//                                         placeholder="Search conversations..."
//                                         value={searchQuery}
//                                         onChange={handleSearch}
//                                         className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 transition-all outline-none"
//                                     />
//                                 </div>
//                             </div>

//                             {/* Conversation List */}
//                             <div className="flex-1 overflow-y-auto scrollbar-hide">
//                                 {conversations.length === 0 ? (
//                                     <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
//                                         <MessageSquare size={32} className="opacity-20" />
//                                         <p>No conversations found</p>
//                                     </div>
//                                 ) : (
//                                     <div className="p-2 space-y-1">
//                                         {conversations.map(conv => (
//                                             <ConversationItem
//                                                 key={conv.id}
//                                                 conversation={conv}
//                                                 currentUserId={user?.id}
//                                                 isActive={location.pathname === `/chat/${conv.id}`}
//                                                 onClick={() => handleSelectConversation(conv)}
//                                             />
//                                         ))}
//                                     </div>
//                                 )}
//                             </div>

//                             {/* User Profile / Settings (Bottom of Sidebar) */}
//                             <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
//                                 <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-700/50 p-2 rounded-lg transition-colors" onClick={() => navigate('/profile')}>
//                                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
//                                         {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
//                                     </div>
//                                     <div className="flex-1 min-w-0">
//                                         <p className="text-sm font-medium text-white truncate">{user?.full_name || user?.username}</p>
//                                         <p className="text-xs text-cyan-400">Online</p>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Main Content Area */}
//                         <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm relative w-full">
//                             {/* Mobile Header (Visible only on mobile when on main page or chat) */}
//                             <div className="md:hidden h-14 border-b border-slate-700/50 flex items-center px-4 bg-slate-800/50 justify-between">
//                                 <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-400">
//                                     <Menu size={24} />
//                                 </button>
//                                 <span className="font-bold text-white">StudyBuddy</span>
//                                 <div className="w-6" /> {/* Spacer */}
//                             </div>

//                             <Outlet />
//                         </div>
//                     </div>
//                 </BorderAnimatedContainer>
//             </div>

//             {/* Modals */}
//             <NewChatModal
//                 isOpen={showNewChat}
//                 onClose={() => setShowNewChat(false)}
//                 onCreate={() => {
//                     loadConversations();
//                     setShowNewChat(false);
//                 }}
//             />
//             <NewGroupModal
//                 isOpen={showNewGroup}
//                 onClose={() => setShowNewGroup(false)}
//                 onCreate={() => {
//                     loadConversations();
//                     setShowNewGroup(false);
//                 }}
//             />
//         </div>
//     );
// };

// export default ChatLayout;