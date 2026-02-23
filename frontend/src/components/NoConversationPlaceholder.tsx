import { MessageCircle, Menu } from "lucide-react";

interface NoConversationPlaceholderProps {
  onOpenSidebar?: () => void;
}

const NoConversationPlaceholder = ({ onOpenSidebar }: NoConversationPlaceholderProps) => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full text-center p-6 bg-[#0d1117] relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/[0.04] rounded-full blur-[100px]" />

      <div className="relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-500">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto relative">
          <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl rotate-6" />
          <div className="absolute inset-0 bg-[#161b22] rounded-2xl border border-white/[0.06] flex items-center justify-center">
            <MessageCircle className="w-9 h-9 text-indigo-400/60" strokeWidth={1.5} />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white tracking-tight">Start a conversation</h3>
          <p className="text-slate-500 max-w-[280px] mx-auto text-[14px] leading-relaxed">
            Select a chat from the sidebar to start messaging your study buddies.
          </p>
        </div>

        {/* Mobile CTA */}
        <button
          onClick={onOpenSidebar}
          className="md:hidden inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[14px] font-semibold rounded-xl transition-colors active:scale-95"
        >
          <Menu size={16} />
          Open Chats
        </button>
      </div>
    </div>
  );
};

export default NoConversationPlaceholder;
