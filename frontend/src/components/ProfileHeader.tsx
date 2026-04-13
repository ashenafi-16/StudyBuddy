import { useState, useRef, ChangeEvent } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, Volume2, VolumeX } from "lucide-react";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

interface ProfileHeaderProps {
  compact?: boolean;
}

const ProfileHeader = ({ compact = false }: ProfileHeaderProps) => {
  const { isSoundEnabled, toggleSound } = useChatStore();
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const { user, logout, updateProfile } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      setSelectedImg(base64Image);
      const formData = new FormData();
      formData.append("profile_pic", file);
      await updateProfile(formData);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      {/* Profile */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/[0.06] flex-shrink-0 group"
          onClick={() => fileInputRef.current?.click()}
        >
          <img
            src={selectedImg || user?.profile_pic_url || "/avatar.png"}
            alt="User"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <span className="text-white text-[8px] font-bold">EDIT</span>
          </div>
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
        />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-200 truncate max-w-[140px]">
            {user?.full_name || user?.username}
          </p>
          <p className="text-[11px] text-emerald-400/70 font-medium">Online</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          className={`p-2 rounded-lg transition-colors ${isSoundEnabled
              ? 'text-indigo-400 hover:bg-indigo-500/10'
              : 'text-slate-500 hover:bg-white/5 hover:text-slate-400'
            }`}
          onClick={() => {
            mouseClickSound.currentTime = 0;
            mouseClickSound.play().catch(() => { });
            toggleSound();
          }}
          title={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        <button
          className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          onClick={logout}
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
};

export default ProfileHeader;
