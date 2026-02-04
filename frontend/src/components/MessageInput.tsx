import React, { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { ImageIcon, SendHorizonal, XIcon } from "lucide-react";
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
    <div className="p-6 bg-[#0b0f1a] border-t border-white/5">
      {imagePreview && (
        <div className="max-w-4xl mx-auto mb-4 flex items-center animate-in slide-in-from-bottom-2 duration-300">
          <div className="relative group">
            {imagePreview === "pdf" ? (
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-indigo-400">PDF</span>
                </div>
              </div>
            ) : (
              <img
                src={imagePreview}
                className="w-20 h-20 rounded-2xl border-2 border-white/10 object-cover shadow-2xl"
              />
            )}
            <button
              className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full w-6 h-6 flex items-center justify-center border border-white/10 shadow-lg hover:bg-indigo-500 transition-colors"
              onClick={() => {
                setImagePreview(null);
                setFile(null);
              }}
            >
              <XIcon size={14} />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-3">
        <div className="flex-1 relative group bg-white/5 rounded-2xl border border-white/5 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all duration-300">
          <input
            type="text"
            value={text}
            placeholder="Type a message..."
            className="w-full bg-transparent py-4 pl-6 pr-14 text-[15px] text-white placeholder-slate-500 outline-none"
            onChange={(e) => handleTyping(e.target.value)}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl text-slate-500 hover:text-indigo-400 hover:bg-white/5 transition-all duration-200"
            title="Attach Media"
          >
            <ImageIcon size={20} />
          </button>
        </div>

        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          accept="image/*,.pdf"
          onChange={handleImageChange}
        />

        <button
          type="submit"
          disabled={!text.trim() && !file}
          className={`flex items-center justify-center size-[52px] rounded-2xl shadow-lg transition-all duration-300 ${text.trim() || file
            ? "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 shadow-indigo-500/20"
            : "bg-slate-800 text-slate-600 cursor-not-allowed scale-95 opacity-50"
            }`}
        >
          <SendHorizonal size={22} />
        </button>
      </form>
      <p className="max-w-4xl mx-auto text-[10px] text-slate-600 mt-2 ml-1 uppercase font-bold tracking-widest opacity-50">
        Press <span className="text-slate-400">Enter</span> to send
      </p>
    </div>
  );
};

export default MessageInput;


// import React, { useRef, useState } from "react";
// import { useChatStore } from "../store/useChatStore";
// import toast from "react-hot-toast";
// import { ImageIcon, SendHorizonal, XIcon } from "lucide-react";
// import useKeyboardSound from "../hooks/useKeyboardSound";
// import { useAuth } from "../contexts/AuthContext";

// const MessageInput = () => {
//   const { sendMessage, isSoundEnabled } = useChatStore();
//   const { playRandomKeyStrokeSound } = useKeyboardSound();
//   const {user} = useAuth();

//   const [text, setText] = useState("");
//   const [imagePreview, setImagePreview] = useState<string | null>(null);
//   const [file, setFile] = useState<File | null>(null); // ✅ store actual File

//   const fileInputRef = useRef<HTMLInputElement | null>(null);

//   const handleSend = (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!text.trim() && !file) return;

//     sendMessage({
//       text: text.trim(),
//       file: file,
//       currentUser: user
//     });

//     setText("");
//     setImagePreview(null);
//     setFile(null);

//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const selectedFile = e.target.files?.[0];
//     if (!selectedFile) return;

//     // Accept both images and PDFs
//     const isImage = selectedFile.type.startsWith("image/");
//     const isPDF = selectedFile.type === "application/pdf";

//     if (!isImage && !isPDF) {
//       toast.error("Please upload an image or PDF file");
//       return;
//     }

//     setFile(selectedFile);

//     // Preview only for images (base64), not sent to backend
//     if (isImage) {
//       const reader = new FileReader();
//       reader.onloadend = () => setImagePreview(reader.result as string);
//       reader.readAsDataURL(selectedFile);
//     } else {
//       // For PDFs, show filename as preview
//       setImagePreview("pdf");
//     }
//   };

//   return (
//     <div className="p-4 border-t border-slate-700/50">

//       {imagePreview && (
//         <div className="max-w-3xl mx-auto mb-3 flex items-center">
//           <div className="relative">
//             {imagePreview === "pdf" ? (
//               <div className="w-20 h-20 rounded-lg border border-slate-700 bg-slate-800 flex flex-col items-center justify-center">
//                 <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
//                   <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
//                 </svg>
//                 <span className="text-xs text-slate-400 mt-1">PDF</span>
//               </div>
//             ) : (
//               <img
//                 src={imagePreview}
//                 className="w-20 h-20 rounded-lg border border-slate-700 object-cover"
//               />
//             )}
//             <button
//               className="absolute -top-2 -right-2 bg-slate-800 text-slate-200 rounded-full w-6 h-6 flex items-center justify-center"
//               onClick={() => {
//                 setImagePreview(null);
//                 setFile(null);
//               }}
//             >
//               <XIcon className="w-4 h-4" />
//             </button>
//           </div>
//           {file && (
//             <div className="ml-3 text-sm text-slate-300">
//               <p className="font-medium">{file.name}</p>
//               <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
//             </div>
//           )}
//         </div>
//       )}

//       <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-4">
//         <input
//           type="text"
//           value={text}
//           placeholder="Type your message..."
//           className="flex-1 bg-slate-800/50 rounded-lg py-2 px-4"
//           onChange={(e) => {
//             setText(e.target.value);
//             if (isSoundEnabled) playRandomKeyStrokeSound();
//           }}
//         />

//         <input
//           type="file"
//           className="hidden"
//           ref={fileInputRef}
//           accept="image/*,.pdf"
//           onChange={handleImageChange}
//         />

//         <button
//           type="button"
//           onClick={() => fileInputRef.current?.click()}
//           className="bg-slate-800/50 text-slate-400 hover:text-slate-200 px-4 rounded-lg"
//         >
//           <ImageIcon className="w-5 h-5" />
//         </button>

//         <button
//           type="submit"
//           className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
//         >
//           <SendHorizonal className="w-5 h-5" />
//         </button>
//       </form>
//     </div>
//   );
// };

// export default MessageInput;
