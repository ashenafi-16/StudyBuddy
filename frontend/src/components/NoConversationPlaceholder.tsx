import { MessageCircleIcon, Menu } from "lucide-react";

interface NoConversationPlaceholderProps {
  onOpenSidebar?: () => void;
}

const NoConversationPlaceholder = ({ onOpenSidebar }: NoConversationPlaceholderProps) => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full text-center p-6 sm:p-8 bg-[#0b0f1a] relative overflow-hidden">
      {/* Decorative Gradient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-indigo-500/10 rounded-full blur-[80px] sm:blur-[100px]" />

      <div className="relative z-10 space-y-6 sm:space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="size-20 sm:size-24 mx-auto relative group">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-[2rem] sm:rounded-[2.5rem] rotate-12 animate-pulse group-hover:rotate-0 transition-transform duration-500" />
          <div className="absolute inset-0 bg-slate-800 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 shadow-2xl flex items-center justify-center">
            <MessageCircleIcon className="size-8 sm:size-10 text-indigo-400" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Your Study Hub</h3>
          <p className="text-slate-400 max-w-xs sm:max-w-sm mx-auto leading-relaxed font-medium text-sm sm:text-base">
            Choose a discussion from the sidebar to resume learning or start a new conversation.
          </p>
        </div>

        {/* Mobile CTA Button */}
        <button
          onClick={onOpenSidebar}
          className="md:hidden inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors active:scale-95"
        >
          <Menu size={18} />
          Open Chats
        </button>

        <div className="hidden sm:flex items-center justify-center gap-3 text-slate-600">
          <div className="h-px w-8 bg-white/5" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Ready to Collaborate</span>
          <div className="h-px w-8 bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export default NoConversationPlaceholder;
