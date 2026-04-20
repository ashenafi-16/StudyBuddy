import { useState, useEffect, useCallback, useRef } from 'react'
import { useChatStore } from '../store/useChatStore';
import ProfileHeader from '../components/ProfileHeader';
import ActiveTabSwitch from '../components/ActiveTabSwitch';
import ChatsList from '../components/ChatsList';
import ContactList from '../components/GroupList';
import ChatContainer from '../components/ChatContainer';
import NoConversationPlaceholder from '../components/NoConversationPlaceholder';
import { Menu, X, Search } from 'lucide-react';
import api from '../services/api';

function ChatPage() {
    const { activeTab, selectedUser, setSelectedUser } = useChatStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleUserSelect = () => {
        setIsSidebarOpen(false);
    };

    // Debounced backend search
    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        try {
            if (activeTab === 'chats') {
                // Search users by username
                const res = await api.get(`/auth/users/search/?q=${encodeURIComponent(query)}`);
                setSearchResults(res.data || []);
            } else {
                // Search groups by group name
                const res = await api.get(`/groups/search/?q=${encodeURIComponent(query)}`);
                setSearchResults(res.data || []);
            }
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [activeTab]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => performSearch(searchQuery), 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchQuery, performSearch]);

    // Clear search results when switching tabs
    useEffect(() => {
        setSearchQuery('');
        setSearchResults([]);
    }, [activeTab]);

    const handleStartChat = async (userId: number) => {
        try {
            const res = await api.post('/conversations/start_individual/', { recipient_id: userId });
            if (res.data) {
                setSelectedUser(res.data);
                setSearchQuery('');
                setSearchResults([]);
                setIsSidebarOpen(false);
            }
        } catch (e) {
            console.error('Failed to start chat:', e);
        }
    };

    const handleSelectGroupFromSearch = async (group: any) => {
        try {
            // Create or get conversation for this group
            const res = await api.post('/conversations/create_group_conversation/', { group_id: group.id });
            if (res.data) {
                setSelectedUser(res.data);
                setSearchQuery('');
                setSearchResults([]);
                setIsSidebarOpen(false);
            }
        } catch (e) {
            console.error('Failed to open group chat:', e);
        }
    };

    return (
        <div className="w-full h-full flex items-stretch">
            <div className="relative w-full h-full overflow-hidden bg-[#0a0e1a]">
                <div className="flex h-full w-full relative">

                    {/* MOBILE OVERLAY */}
                    {isSidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}

                    {/* ─── SIDEBAR (Left side) ─── */}
                    <div className={`
                        fixed md:relative inset-y-0 left-0 z-50
                        w-[85vw] max-w-[340px] md:w-[340px]
                        bg-[#0a0e1a]/98 md:bg-[#0a0e1a]/80 backdrop-blur-2xl
                        flex flex-col border-r border-white/[0.06]
                        transform transition-transform duration-300 ease-out
                        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    `}>
                        {/* Sidebar Header */}
                        <div className="p-5 pb-3">
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-[22px] font-extrabold text-white tracking-tight">
                                    Messages
                                </h1>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Search Bar */}
                            <div className="relative group">
                                <Search
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-200"
                                    size={16}
                                />
                                <input
                                    type="text"
                                    placeholder={activeTab === 'chats' ? 'Search users by username...' : 'Search groups by name...'}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.06] focus:border-indigo-500/40 focus:bg-white/[0.06] rounded-xl text-sm text-slate-200 placeholder-slate-500 transition-all duration-200 outline-none focus:ring-1 focus:ring-indigo-500/20"
                                />
                            </div>
                        </div>

                        {/* Tab Switch */}
                        <ActiveTabSwitch />

                        {/* Conversations / Search Results */}
                        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar" onClick={handleUserSelect}>
                            {searchQuery.trim() ? (
                                <div className="space-y-1">
                                    {isSearching && (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                        </div>
                                    )}
                                    {!isSearching && searchResults.length === 0 && searchQuery.trim() && (
                                        <div className="text-center py-8 text-slate-500 text-sm">
                                            No results found
                                        </div>
                                    )}
                                    {!isSearching && searchResults.map((result: any) => (
                                        <button
                                            key={result.id}
                                            className="w-full group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 bg-transparent hover:bg-white/[0.03] border border-transparent"
                                            onClick={() => {
                                                if (activeTab === 'chats') {
                                                    handleStartChat(result.id);
                                                } else {
                                                    handleSelectGroupFromSearch(result);
                                                }
                                            }}
                                        >
                                            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/[0.06] flex-shrink-0">
                                                {activeTab === 'chats' ? (
                                                    <img
                                                        src={result.profile_pic_url || '/avatar.png'}
                                                        alt={result.full_name || result.username}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : result.profile_pic_url ? (
                                                    <img
                                                        src={result.profile_pic_url}
                                                        alt={result.group_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                                                        <span className="text-white font-bold text-sm">
                                                            {(result.group_name || 'G').charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 text-left min-w-0">
                                                <h4 className="text-[13.5px] font-semibold text-slate-200 group-hover:text-white truncate">
                                                    {activeTab === 'chats'
                                                        ? (result.full_name || result.username || result.email)
                                                        : result.group_name
                                                    }
                                                </h4>
                                                <p className="text-[12px] text-slate-500 truncate">
                                                    {activeTab === 'chats'
                                                        ? `@${result.username || ''}`
                                                        : `${result.member_count || 0} members · ${result.group_type || ''}`
                                                    }
                                                </p>
                                            </div>
                                            <span className="text-[11px] text-indigo-400 font-medium flex-shrink-0">
                                                {activeTab === 'chats' ? 'Chat' : 'Open'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                activeTab === "chats" ? <ChatsList searchQuery={searchQuery} /> : <ContactList searchQuery={searchQuery} />
                            )}
                        </div>

                        {/* Profile Footer */}
                        <div className="border-t border-white/[0.06] bg-[#080c16]/60">
                            <ProfileHeader />
                        </div>
                    </div>

                    {/* ─── MAIN CONTENT AREA ─── */}
                    <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
                        {/* Mobile Header (only when no chat selected) */}
                        {!selectedUser && (
                            <div className="md:hidden flex items-center justify-between h-14 px-4 border-b border-white/[0.06] bg-[#0a0e1a]">
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <Menu size={22} />
                                </button>
                                <span className="text-base font-bold text-white">Messages</span>
                                <div className="w-10" />
                            </div>
                        )}

                        {selectedUser ? (
                            <ChatContainer onBackClick={() => setIsSidebarOpen(true)} />
                        ) : (
                            <NoConversationPlaceholder onOpenSidebar={() => setIsSidebarOpen(true)} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatPage;
