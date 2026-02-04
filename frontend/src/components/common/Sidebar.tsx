// import React from "react";
import { Home, Calendar, Users, MessageSquare, FolderOpen, Timer, LogOut, Star } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isPremium, subscriptions } = useAuth();
  const primarySubscription = subscriptions[0];

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard", premium: true },
    { icon: Users, label: "Study Groups", path: "/groups", premium: true },
    { icon: Calendar, label: "Study Planner", path: "/planner", premium: true },
    { icon: FolderOpen, label: "Resources", path: "/resources", premium: true },
    { icon: Timer, label: "Pomodoro Timer", path: "/pomodoro", premium: true },
    { icon: MessageSquare, label: "Messages", path: "/chat", premium: true },
    { icon: Star, label: "Subscription", path: "/subscription", premium: false },
  ];

  const visibleNavItems = navItems.filter(item => !item.premium || isPremium);

  return (
    <aside className="w-64 h-full bg-[#1e293b] border-r border-slate-700 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Study<span className="text-emerald-400">Buddy</span>
            </h1>
            {isPremium && primarySubscription && (
              <div className="mt-1">
                <span className="text-[10px] font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-900 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                  {primarySubscription.plan.name.replace(' Plan', '')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {visibleNavItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 group ${isActive(item.path)
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"
              }`}
          >
            <item.icon
              size={20}
              className={`transition-colors ${isActive(item.path) ? "text-emerald-400" : "group-hover:text-white"}`}
            />
            <span className="font-medium">{item.label}</span>
            {isActive(item.path) && (
              <div className="ml-auto w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            )}
          </button>
        ))}
      </nav>

      {/* User Section / Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
        >
          <LogOut size={20} className="group-hover:text-red-400" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}