import {useState, useRef, ChangeEvent} from "react";
import {useChatStore} from "../store/useChatStore";
import { useAuth } from "../contexts/AuthContext";
import { LogOutIcon, Volume1Icon, VolumeOffIcon } from "lucide-react";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3")
const ProfileHeader = () => {
  const {isSoundEnabled, toggleSound} = useChatStore();
  const [selectedImg , setSelectedImg] = useState<string | null>(null);
  const {user, logout , updateProfile} = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    
    if(!file) return
    const reader = new FileReader()
    reader.onloadend = async () => {
      // if (typeof reader.result !== "string") return
      const base64Image = reader.result as string;
      setSelectedImg(base64Image)

      const formData = new FormData();
      formData.append("profile_pic", file);
      await updateProfile(formData);
    };
    
    reader.readAsDataURL(file)
  }

  return (
    <div className="p-6 border-b border-slate-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* AVATAR */}
          
          <div className="avatar avatar-online">
            
            <button className="size-14 rounded-full overflow-hidden relative group"
              onClick={() => fileInputRef.current?.click() }>
              <img src={user?.profile_pic_url || "/avatar.png" }
              alt="User Image"
              className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs">Change</span>
              </div>
            </button>
            <input type="file" 
            accept="images/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
            />

          </div>
          {/* USERNAME & ONLINE TEXT */}
          <div className="">
            <h3 className="text-slate-200 font-medium text-base max-w-[180px] truncate">
              {user?.full_name || user?.username}
            </h3>
            <p className="text-slate-400 text-xs">Online</p>
          </div>

        </div>
        {/* BUTTONS */}
        <div className="flex gap-4 items-center">
          {/* LOGOUT BTN */}
          <button
          className="text-slate-400 hover:text-slate-200 transition-colors"
          onClick={logout} 
          >
            <LogOutIcon className="size-5" />
            
          </button>
          {/* SOUND TOGGLE BTN */}
          <button
          className="text-slate-400 hover:text-slate-200 transition-colors"
          onClick={() => {
            // play click sound before toggling
            mouseClickSound.currentTime = 0; // reset to start
            mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
            toggleSound();
          }}
          >
            
            {isSoundEnabled? (
            <Volume1Icon className="size-5" />
           ) : (
            <VolumeOffIcon className="size-5" />
           )}
          </button>
        </div>


      </div>
      
    </div>
  )
}

export default ProfileHeader
