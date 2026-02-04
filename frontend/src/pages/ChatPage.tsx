import React from 'react'
import BorderAnimatedContainer from "../components/common/BorderAnimatedContainer";
import { useChatStore } from '../store/useChatStore';
import ProfileHeader from '../components/ProfileHeader';
import ActiveTabSwitch from '../components/ActiveTabSwitch';
import ChatsList from '../components/ChatsList';
import ContactList from '../components/GroupList';
import ChatContainer from '../components/ChatContainer';
import NoConversationPlaceholder from '../components/NoConversationPlaceholder';



function ChatPage() {
    const { activeTab, selectedUser } = useChatStore();

    return (
        <div className="w-full h-full flex items-stretch">
            <BorderAnimatedContainer>
                <div className="flex h-full w-full">
                    {/* MAIN CONTENT AREA (NOW LEFT) */}
                    <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm">
                        {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
                    </div>

                    {/* SIDEBAR (NOW RIGHT) */}
                    <div className="w-80 bg-slate-800/50 backdrop-blur-sm flex flex-col border-l border-slate-700/50">
                        <ProfileHeader />
                        <ActiveTabSwitch />

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
                        </div>
                    </div>
                </div>
            </BorderAnimatedContainer>
        </div>

    );
}
export default ChatPage;
