import React from 'react'
import { useChatStore } from '../store/useChatStore'

const ActiveTabSwitch = () => {
  const { activeTab, setActiveTab } = useChatStore();

  return (
    <div className="w-full px-3 mt-2">
      <div className="tabs w-full bg-transparent">
        
        <button
          onClick={() => setActiveTab("chats")}
          className={`tab flex-1 text-center ${
            activeTab === "chats"
              ? "bg-cyan-500/20 text-cyan-400"
              : "text-slate-400"
          }`}
        >
          Individual Chats
        </button>

        <button
          onClick={() => setActiveTab("contacts")}
          className={`tab flex-1 text-center ${
            activeTab === "contacts"
              ? "bg-cyan-500/20 text-cyan-400"
              : "text-slate-400"
          }`}
        >
          Groups
        </button>

      </div>
    </div>
  );
};

export default ActiveTabSwitch;
