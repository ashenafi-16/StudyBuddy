import React, { useState } from 'react'
import BorderAnimatedContainer from "../components/common/BorderAnimatedContainer";
import { useChatStore } from '../store/useChatStore';
import ProfileHeader from '../components/ProfileHeader';
import ActiveTabSwitch from '../components/ActiveTabSwitch';
import ChatsList from '../components/ChatsList';
import ContactList from '../components/GroupList';
import ChatContainer from '../components/ChatContainer';
import NoConversationPlaceholder from '../components/NoConversationPlaceholder';
import { Menu, X } from 'lucide-react';

function ChatPage() {
    const { activeTab, selectedUser } = useChatStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Close sidebar when a user is selected (on mobile)
    const handleUserSelect = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="w-full h-full flex items-stretch">
            <BorderAnimatedContainer>
                <div className="flex h-full w-full relative">

                    {/* MOBILE OVERLAY */}
                    {isSidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}

                    {/* MAIN CONTENT AREA (Chat or Placeholder) */}
                    <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm min-w-0">
                        {/* Mobile Header (only when no chat selected) */}
                        {!selectedUser && (
                            <div className="md:hidden flex items-center justify-between h-16 px-4 border-b border-white/5 bg-[#0b0f1a]">
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                                >
                                    <Menu size={24} />
                                </button>
                                <span className="text-lg font-bold text-white">Messages</span>
                                <div className="w-10" /> {/* Spacer */}
                            </div>
                        )}

                        {selectedUser ? (
                            <ChatContainer onBackClick={() => setIsSidebarOpen(true)} />
                        ) : (
                            <NoConversationPlaceholder onOpenSidebar={() => setIsSidebarOpen(true)} />
                        )}
                    </div>

                    {/* SIDEBAR (Slides in on mobile, fixed on desktop) */}
                    <div className={`
                        fixed md:relative inset-y-0 right-0 z-50
                        w-[85vw] max-w-[320px] md:w-80
                        bg-slate-800/95 md:bg-slate-800/50 backdrop-blur-xl
                        flex flex-col border-l border-slate-700/50
                        transform transition-transform duration-300 ease-out
                        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                    `}>
                        {/* Mobile Close Button */}
                        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5">
                            <span className="font-bold text-white">Conversations</span>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="hidden md:block">
                            <ProfileHeader />
                        </div>
                        <ActiveTabSwitch />

                        <div className="flex-1 overflow-y-auto p-4 space-y-2" onClick={handleUserSelect}>
                            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
                        </div>

                        {/* Mobile Profile Section */}
                        <div className="md:hidden p-4 border-t border-white/5">
                            <ProfileHeader compact />
                        </div>
                    </div>
                </div>
            </BorderAnimatedContainer>
        </div>
    );
}

export default ChatPage;
