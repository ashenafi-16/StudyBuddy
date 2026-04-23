import React from "react";
import { MessageCircleIcon, Search } from "lucide-react";

interface NoChatsFoundProps {
  message?: string;
  onFindContact?: () => void;
}

const NoChatsFound: React.FC<NoChatsFoundProps> = ({ message = "No conversations yet", onFindContact }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
      <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center">
        <MessageCircleIcon className="w-8 h-8 text-cyan-400" />
      </div>
      <div>
        <h4 className="text-slate-200 font-medium mb-1">{message}</h4>
        <p className="text-slate-400 text-sm px-6">
          Search for a user by username to start a new conversation
        </p>
      </div>
      <button
        onClick={onFindContact}
        className="px-4 py-2 text-sm text-cyan-400 bg-cyan-500/10 rounded-lg hover:bg-cyan-500/20 transition-colors flex items-center gap-2"
      >
        <Search size={14} />
        Find contacts
      </button>
    </div>
  );
};

export default NoChatsFound;
