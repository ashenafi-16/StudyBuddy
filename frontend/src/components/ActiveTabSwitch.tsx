import { MessageCircle, Users } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

const ActiveTabSwitch = () => {
  const { activeTab, setActiveTab } = useChatStore();

  return (
    <div className="px-4 pb-3">
      <div className="relative flex bg-white/[0.03] rounded-xl p-1 border border-white/[0.06]">
        {/* Sliding Indicator */}
        <div
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-indigo-600/90 rounded-lg shadow-lg shadow-indigo-500/20 transition-transform duration-300 ease-out ${activeTab === "contacts" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
            }`}
        />

        <button
          onClick={() => setActiveTab("chats")}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-colors duration-200 ${activeTab === "chats"
              ? "text-white"
              : "text-slate-400 hover:text-slate-300"
            }`}
        >
          <MessageCircle size={15} />
          <span>Direct</span>
        </button>

        <button
          onClick={() => setActiveTab("contacts")}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-colors duration-200 ${activeTab === "contacts"
              ? "text-white"
              : "text-slate-400 hover:text-slate-300"
            }`}
        >
          <Users size={15} />
          <span>Groups</span>
        </button>
      </div>
    </div>
  );
};

export default ActiveTabSwitch;
