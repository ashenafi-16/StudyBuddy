import { MessageCircleIcon } from "lucide-react";

const NoConversationPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-[#0b0f1a] relative overflow-hidden">
      {/* Decorative Gradient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px]" />

      <div className="relative z-10 space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="size-24 mx-auto relative group">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-[2.5rem] rotate-12 animate-pulse group-hover:rotate-0 transition-transform duration-500" />
          <div className="absolute inset-0 bg-slate-800 rounded-[2rem] border border-white/5 shadow-2xl flex items-center justify-center">
            <MessageCircleIcon className="size-10 text-indigo-400" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-3xl font-bold text-white tracking-tight">Your Study Hub</h3>
          <p className="text-slate-400 max-w-sm mx-auto leading-relaxed font-medium">
            Choose a discussion from the sidebar to resume learning or start a new conversation with your peers.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 text-slate-600">
          <div className="h-px w-8 bg-white/5" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Ready to Collaborate</span>
          <div className="h-px w-8 bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export default NoConversationPlaceholder;
