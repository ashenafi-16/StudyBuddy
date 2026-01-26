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
    <div className="p-4 border-t border-slate-700/50">
      {imagePreview && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center">
          <div className="relative">
            {imagePreview === "pdf" ? (
              <div className="w-20 h-20 rounded-lg border border-slate-700 bg-slate-800 flex flex-col items-center justify-center">
                <span className="text-xs text-slate-400">PDF</span>
              </div>
            ) : (
              <img
                src={imagePreview}
                className="w-20 h-20 rounded-lg border border-slate-700 object-cover"
              />
            )}
            <button
              className="absolute -top-2 -right-2 bg-slate-800 text-slate-200 rounded-full w-6 h-6"
              onClick={() => {
                setImagePreview(null);
                setFile(null);
              }}
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-4">
        <input
          type="text"
          value={text}
          placeholder="Type your message..."
          className="flex-1 bg-slate-800/50 rounded-lg py-2 px-4"
          onChange={(e) => handleTyping(e.target.value)}
        />

        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          accept="image/*,.pdf"
          onChange={handleImageChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-slate-800/50 px-4 rounded-lg"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        <button
          type="submit"
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg"
        >
          <SendHorizonal className="w-5 h-5" />
        </button>
      </form>
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
