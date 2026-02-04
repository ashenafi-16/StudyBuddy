import React, { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { ImageIcon, SendHorizonal, XIcon, Paperclip } from "lucide-react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useAuth } from "../contexts/AuthContext";

const MessageInput = () => {
  const { user } = useAuth();
  const { playRandomKeyStrokeSound } = useKeyboardSound();

  const sendMessage = useChatStore((s) => s.sendMessage);
  const sendTyping = useChatStore((s) => s.sendTyping);
  const isSoundEnabled = useChatStore((s) => s.isSoundEnabled);

  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  };

  const handleTyping = (value: string) => {
    setText(value);
    sendTyping();

    if (isSoundEnabled) {
      playRandomKeyStrokeSound();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="p-3 sm:p-6 bg-[#0b0f1a] border-t border-white/5 sticky bottom-0">
      {/* File Preview */}
      {imagePreview && (
        <div className="max-w-4xl mx-auto mb-3 sm:mb-4 flex items-center animate-in slide-in-from-bottom-2 duration-300">
          <div className="relative group">
            {imagePreview === "pdf" ? (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 flex flex-col items-center justify-center gap-1">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <span className="text-[8px] sm:text-[10px] font-bold text-indigo-400">PDF</span>
                </div>
              </div>
            ) : (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl border-2 border-white/10 object-cover shadow-2xl"
              />
            )}
            <button
              className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-slate-900 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center border border-white/10 shadow-lg hover:bg-red-500 transition-colors"
              onClick={() => {
                setImagePreview(null);
                setFile(null);
              }}
            >
              <XIcon size={12} />
            </button>
          </div>

          {file && (
            <div className="ml-3 text-xs sm:text-sm text-slate-400 truncate max-w-[150px] sm:max-w-none">
              <p className="truncate font-medium">{file.name}</p>
              <p className="text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          )}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-2 sm:gap-3">
        {/* Text Input Container */}
        <div className="flex-1 relative group bg-white/5 rounded-xl sm:rounded-2xl border border-white/5 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all duration-300">
          <input
            type="text"
            value={text}
            placeholder="Type a message..."
            className="w-full bg-transparent py-3 sm:py-4 pl-4 sm:pl-6 pr-12 sm:pr-14 text-[14px] sm:text-[15px] text-white placeholder-slate-500 outline-none"
            onChange={(e) => handleTyping(e.target.value)}
          />

          {/* Attachment Button (inside input) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-slate-500 hover:text-indigo-400 hover:bg-white/5 transition-all duration-200 active:scale-95"
            title="Attach Media"
          >
            <Paperclip size={18} className="sm:hidden" />
            <ImageIcon size={20} className="hidden sm:block" />
          </button>
        </div>

        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          accept="image/*,.pdf"
          onChange={handleImageChange}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!text.trim() && !file}
          className={`flex items-center justify-center size-11 sm:size-[52px] rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 active:scale-95 ${text.trim() || file
            ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20"
            : "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50"
            }`}
        >
          <SendHorizonal size={18} className="sm:hidden" />
          <SendHorizonal size={22} className="hidden sm:block" />
        </button>
      </form>

      {/* Helper Text (hidden on mobile) */}
      <p className="hidden sm:block max-w-4xl mx-auto text-[10px] text-slate-600 mt-2 ml-1 uppercase font-bold tracking-widest opacity-50">
        Press <span className="text-slate-400">Enter</span> to send
      </p>
    </div>
  );
};

export default MessageInput;
