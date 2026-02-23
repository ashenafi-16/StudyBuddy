import React, { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { Paperclip, Send, X, FileText, Reply } from "lucide-react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useAuth } from "../contexts/AuthContext";

const MessageInput = () => {
  const { user } = useAuth();
  const { playRandomKeyStrokeSound } = useKeyboardSound();

  const sendMessage = useChatStore((s) => s.sendMessage);
  const sendTyping = useChatStore((s) => s.sendTyping);
  const isSoundEnabled = useChatStore((s) => s.isSoundEnabled);
  const replyToMessage = useChatStore((s) => s.replyToMessage);
  const clearReplyTo = useChatStore((s) => s.clearReplyTo);

  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim() && !file) return;
    if (!user) return;

    sendMessage({
      text: text.trim(),
      file,
      currentUser: user,
    });

    setText("");
    setImagePreview(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleTyping = (value: string) => {
    setText(value);
    sendTyping();

    if (isSoundEnabled) {
      playRandomKeyStrokeSound();
    }

    // Auto-grow textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const isImage = selectedFile.type.startsWith("image/");
    const isPDF = selectedFile.type === "application/pdf";

    if (!isImage && !isPDF) {
      toast.error("Please upload an image or PDF file");
      return;
    }

    setFile(selectedFile);

    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setImagePreview("pdf");
    }
  };

  return (
    <div className="px-4 sm:px-6 pb-4 pt-2 bg-[#0d1117] border-t border-white/[0.04]">
      {/* Reply Preview Bar */}
      {replyToMessage && (
        <div className="max-w-3xl mx-auto mb-2 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3.5 py-2.5">
            <div className="w-1 h-8 rounded-full bg-[#1a6b4a] flex-shrink-0" />
            <Reply size={14} className="text-slate-500 flex-shrink-0 rotate-180" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-[#1a6b4a]">
                {replyToMessage.sender?.full_name || replyToMessage.sender?.email || 'Unknown'}
              </p>
              <p className="text-[12px] text-slate-400 truncate">
                {replyToMessage.content || (replyToMessage.message_type === 'image' ? '📷 Photo' : '📎 File')}
              </p>
            </div>
            <button
              onClick={clearReplyTo}
              className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* File Preview */}
      {imagePreview && (
        <div className="max-w-3xl mx-auto mb-3 animate-in slide-in-from-bottom-2 duration-200">
          <div className="inline-flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-xl p-2.5 pr-4">
            <div className="relative">
              {imagePreview === "pdf" ? (
                <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <FileText size={20} className="text-red-400" />
                </div>
              ) : (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-12 h-12 rounded-lg object-cover border border-white/10"
                />
              )}
              <button
                className="absolute -top-1.5 -right-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-full w-5 h-5 flex items-center justify-center border border-white/10 transition-colors"
                onClick={() => {
                  setImagePreview(null);
                  setFile(null);
                }}
              >
                <X size={10} />
              </button>
            </div>
            {file && (
              <div className="min-w-0">
                <p className="text-[13px] text-slate-200 font-medium truncate max-w-[200px]">{file.name}</p>
                <p className="text-[11px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-end gap-2">
        {/* Input Container */}
        <div className="flex-1 flex items-end bg-white/[0.04] rounded-2xl border border-white/[0.06] focus-within:border-indigo-500/30 focus-within:bg-white/[0.05] transition-all duration-200">
          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-500 hover:text-indigo-400 transition-colors flex-shrink-0 self-end"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            placeholder="Type a message..."
            className="flex-1 bg-transparent py-3 pr-3 text-[14px] text-white placeholder-slate-500 outline-none resize-none max-h-[120px] leading-relaxed"
            rows={1}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          accept="image/*,.pdf"
          onChange={handleFileChange}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!text.trim() && !file}
          className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 flex-shrink-0 ${text.trim() || file
            ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-95"
            : "bg-white/[0.04] text-slate-600 cursor-not-allowed"
            }`}
        >
          <Send size={18} />
        </button>
      </form>

      {/* Helper Text */}
      <p className="hidden sm:block max-w-3xl mx-auto text-[10px] text-slate-600 mt-1.5 ml-1 font-medium tracking-wide">
        Press <span className="text-slate-500">Enter</span> to send · <span className="text-slate-500">Shift+Enter</span> for new line
      </p>
    </div>
  );
};

export default MessageInput;
