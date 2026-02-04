// src/Components/common/Navbar.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from "../notifications/NotificationDropdown";
import { useAuth } from "../../contexts/AuthContext";
import ActiveTimerIndicator from './ActiveTimerIndicator';

interface NavbarProps {
  user_profile?: {
    full_name: String;
    profile_pic_url?: string;
  };
}

const Navbar: React.FC<NavbarProps> = ({ user_profile }) => {
  const navigate = useNavigate();
  const { isPremium, user } = useAuth();
  const safeUserProfile = {
    full_name: user?.full_name || user?.first_name || "",
    profile_pic_url: user?.profile_pic_url || undefined,
  };

  const { full_name, profile_pic_url } = safeUserProfile;

  // Get initials for avatar
  const getInitials = () => {
    return `${full_name?.charAt(0) || 'U'}`.toUpperCase();
  };

  const handleProfileClick = () => {
    if (isPremium) {
      navigate("/profile");
    } else {
      navigate("/subscription");
    }
  }
  return (
    <nav className="bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-700 px-6 py-4 shadow-sm">
      <div className="flex justify-between items-center">
        {/* Logo/Brand + Active Timer */}
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Study<span className="text-emerald-400">Buddy</span>
          </h1>

          {/* Active Timer Indicator - Shows when a Pomodoro timer is running */}
          <ActiveTimerIndicator />
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <NotificationDropdown />
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden md:block">
              <p className="font-semibold text-white text-sm">
                {full_name || "Welcome Back!"}
              </p>
              <p className="text-xs text-emerald-400">
                {isPremium ? "Pro Member" : ""}
              </p>
            </div>

            <div
              onClick={handleProfileClick}
              className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm hover:scale-105 transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-500/20 border-2 border-[#1e293b] relative"
            >
              {profile_pic_url ? (
                <img
                  src={profile_pic_url}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                getInitials()
              )}
              {/* Online Indicator */}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#1e293b]"></div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;