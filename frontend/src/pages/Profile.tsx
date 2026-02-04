import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { Loading, ErrorMessage } from "../components/common/LoadingError";
import {
  Briefcase, Camera, Edit2, Save, X,
  Shield, Users, BookOpen, Clock, Award, Flame, Calendar, TrendingUp,
  Mail, CheckCircle, Sparkles
} from "lucide-react";
import type { DashboardData } from "../types/study";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface UserProfile {
  first_name: string;
  last_name: string;
  bio: string;
  profile_pic_url: string;
  email: string;
  role: string;
  groups_joined: number;
  date_joined?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Profile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [studyData, setStudyData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    bio: "",
    profile_pic_url: "" as string | File,
    email: "",
    role: "",
    groups_joined: 0,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found. Please log in.");

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const [profileRes, studyRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/auth/users/profile/", { headers }),
        fetch("http://127.0.0.1:8000/api/studytracker/streak_dashboard/", { headers })
      ]);

      if (!profileRes.ok) throw new Error(`Failed to fetch profile (${profileRes.status})`);
      const profileData = await profileRes.json();
      const profile = profileData.user_profile || profileData;
      setUserProfile(profile);
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        bio: profile.bio || "",
        profile_pic_url: profile.profile_pic_url || "",
        email: profile.email || "",
        role: profile.role || "",
        groups_joined: profile.groups_joined || 0,
      });

      if (studyRes.ok) {
        setStudyData(await studyRes.json());
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Form Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, profile_pic_url: e.target.files![0] }));
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (userProfile) {
      setFormData({
        first_name: userProfile.first_name || "",
        last_name: userProfile.last_name || "",
        bio: userProfile.bio || "",
        profile_pic_url: userProfile.profile_pic_url || "",
        email: userProfile.email || "",
        role: userProfile.role || "",
        groups_joined: userProfile.groups_joined || 0,
      });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found. Please log in.");

      const form = new FormData();
      form.append("first_name", formData.first_name);
      form.append("last_name", formData.last_name);
      form.append("bio", formData.bio);
      if (formData.profile_pic_url instanceof File) {
        form.append("profile_pic", formData.profile_pic_url);
      }

      const res = await fetch("http://127.0.0.1:8000/api/auth/users/update_profile/", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) throw new Error(`Update failed (${res.status})`);

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      fetchProfileData();

      // Auto-hide success message
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Computed Values
  // ─────────────────────────────────────────────────────────────────────────

  const getProfilePicUrl = (pic: string | File) => {
    if (pic instanceof File) return URL.createObjectURL(pic);
    return pic || `https://ui-avatars.com/api/?name=${formData.first_name}+${formData.last_name}&background=6366f1&color=fff&size=200`;
  };

  const fullName = `${formData.first_name} ${formData.last_name}`.trim() || 'User';

  const formatHours = (minutes: number) => {
    return (minutes / 60).toFixed(1);
  };

  // Contribution Graph Data
  const contributionData = useMemo(() => {
    const today = new Date();
    const days = [];
    const activityMap = new Map();
    studyData?.recent_activity.forEach(act => activityMap.set(act.date, act.duration_minutes));

    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const minutes = activityMap.get(dateStr) || 0;

      let level = 0;
      if (minutes > 0) level = 1;
      if (minutes >= 30) level = 2;
      if (minutes >= 60) level = 3;
      if (minutes >= 120) level = 4;

      days.push({ date: dateStr, minutes, level, dayOfWeek: d.getDay() });
    }
    return days;
  }, [studyData?.recent_activity]);

  const totalContributions = useMemo(() => {
    return contributionData.filter(d => d.level > 0).length;
  }, [contributionData]);

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return "bg-emerald-900/60";
      case 2: return "bg-emerald-700/70";
      case 3: return "bg-emerald-500";
      case 4: return "bg-emerald-400";
      default: return "bg-slate-800/50";
    }
  };

  // Month labels for contribution graph
  const monthLabels = useMemo(() => {
    const months: { label: string; offset: number }[] = [];
    let currentMonth = -1;

    contributionData.forEach((day, index) => {
      const date = new Date(day.date);
      const month = date.getMonth();
      if (month !== currentMonth) {
        currentMonth = month;
        months.push({
          label: date.toLocaleString('default', { month: 'short' }),
          offset: Math.floor(index / 7)
        });
      }
    });
    return months;
  }, [contributionData]);

  if (loading) return <Loading />;
  if (error && !userProfile) return <ErrorMessage error={error} />;

  return (
    <div className="min-h-full bg-gradient-to-b from-[#0d1117] to-[#161b22] text-[#c9d1d9]">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl flex items-center justify-between backdrop-blur-sm animate-in slide-in-from-top duration-300">
            <span className="flex items-center gap-2"><CheckCircle size={18} /> {success}</span>
            <button onClick={() => setSuccess("")} className="hover:text-white transition-colors"><X size={18} /></button>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")}><X size={18} /></button>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-2xl border border-slate-700/50 overflow-hidden mb-8">
          {/* Cover Gradient */}
          <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6 -mt-16 relative">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl border-4 border-[#0f172a] overflow-hidden bg-slate-800 shadow-2xl">
                  <img
                    src={getProfilePicUrl(formData.profile_pic_url)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <Camera className="text-white" size={28} />
                  </button>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

                {/* Verified Badge */}
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-lg p-1.5 border-2 border-[#0f172a]">
                  <Shield size={14} className="text-white" />
                </div>
              </div>

              {/* Name & Info */}
              <div className="flex-1 pt-4 sm:pt-0">
                {!isEditing ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl sm:text-3xl font-bold text-white">{fullName}</h1>
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Sparkles size={12} /> PRO
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                      <span className="flex items-center gap-1"><Briefcase size={14} /> {formData.role || "Student"}</span>
                      <span className="flex items-center gap-1"><Mail size={14} /> {formData.email}</span>
                      <span className="flex items-center gap-1"><Users size={14} /> {formData.groups_joined} groups</span>
                    </div>
                    {formData.bio && (
                      <p className="text-slate-300 mt-2 max-w-xl">{formData.bio}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 max-w-xl">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        placeholder="First Name"
                        className="bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      />
                      <input
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        placeholder="Last Name"
                        className="bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself..."
                      maxLength={200}
                      className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all h-20 resize-none"
                    />
                    <div className="text-xs text-slate-500 text-right">{formData.bio.length}/200</div>
                  </div>
                )}
              </div>

              {/* Edit Button */}
              <div className="sm:ml-auto flex gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all"
                  >
                    <Edit2 size={16} /> Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all"
                    >
                      <X size={16} /> Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={updating}
                      className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all disabled:opacity-50"
                    >
                      {updating ? (
                        <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      Save
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Clock className="text-blue-400" size={20} />}
            label="Study Hours"
            value={formatHours(studyData?.total_study_minutes || 0)}
            suffix="hrs"
            gradient="from-blue-500/20 to-blue-600/10"
            border="border-blue-500/20"
          />
          <StatCard
            icon={<Flame className="text-orange-400" size={20} />}
            label="Current Streak"
            value={studyData?.streak.current_streak || 0}
            suffix="days"
            gradient="from-orange-500/20 to-orange-600/10"
            border="border-orange-500/20"
            highlight
          />
          <StatCard
            icon={<TrendingUp className="text-purple-400" size={20} />}
            label="Longest Streak"
            value={studyData?.streak.longest_streak || 0}
            suffix="days"
            gradient="from-purple-500/20 to-purple-600/10"
            border="border-purple-500/20"
          />
          <StatCard
            icon={<Award className="text-emerald-400" size={20} />}
            label="Achievements"
            value={studyData?.achievements?.length || 0}
            suffix="earned"
            gradient="from-emerald-500/20 to-emerald-600/10"
            border="border-emerald-500/20"
          />
        </div>

        {/* Contribution Graph */}
        <div className="bg-[#0d1117] border border-slate-700/50 rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              {totalContributions} study sessions in the last year
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-slate-800/50" />
                <div className="w-3 h-3 rounded-sm bg-emerald-900/60" />
                <div className="w-3 h-3 rounded-sm bg-emerald-700/70" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                <div className="w-3 h-3 rounded-sm bg-emerald-400" />
              </div>
              <span>More</span>
            </div>
          </div>

          {/* Month Labels */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-max">
              <div className="flex gap-[3px] pl-8 mb-1">
                {monthLabels.map((month, i) => (
                  <div
                    key={i}
                    className="text-[10px] text-slate-500"
                    style={{ marginLeft: i === 0 ? 0 : `${(month.offset - (monthLabels[i - 1]?.offset || 0) - 1) * 15}px` }}
                  >
                    {month.label}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="flex gap-[3px]">
                {/* Day labels */}
                <div className="flex flex-col gap-[3px] text-[10px] text-slate-500 pr-2">
                  <div className="h-3" />
                  <div className="h-3 leading-3">Mon</div>
                  <div className="h-3" />
                  <div className="h-3 leading-3">Wed</div>
                  <div className="h-3" />
                  <div className="h-3 leading-3">Fri</div>
                  <div className="h-3" />
                </div>

                {/* Weeks */}
                {Array.from({ length: Math.ceil(contributionData.length / 7) }).map((_, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {contributionData.slice(weekIndex * 7, (weekIndex * 7) + 7).map((day, dayIndex) => (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`w-3 h-3 rounded-sm ${getLevelColor(day.level)} transition-all hover:ring-2 hover:ring-white/20 cursor-pointer relative group`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover:block whitespace-nowrap bg-slate-800 text-white text-[11px] py-1.5 px-2.5 rounded-lg shadow-xl border border-slate-700">
                          <strong>{day.minutes > 0 ? `${day.minutes} min` : 'No study'}</strong>
                          <br />
                          <span className="text-slate-400">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-[#0d1117] border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Award size={18} className="text-amber-400" />
              Achievements
            </h3>
          </div>

          <div className="divide-y divide-slate-700/50">
            {studyData?.achievements && studyData.achievements.length > 0 ? (
              studyData.achievements.map((ach, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                      <Award size={22} className="text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{ach.achievement_name}</h4>
                      <p className="text-xs text-slate-500">Earned on {new Date(ach.awarded_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <CheckCircle size={14} /> Unlocked
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Award size={32} className="text-slate-600" />
                </div>
                <h4 className="text-white font-medium mb-2">No achievements yet</h4>
                <p className="text-slate-500 text-sm">Start studying to unlock badges!</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link to="/groups" className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm transition-all">
            <Users size={16} className="text-blue-400" /> My Groups
          </Link>
          <Link to="/resources" className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm transition-all">
            <BookOpen size={16} className="text-purple-400" /> Resources
          </Link>
          <Link to="/pomodoro" className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm transition-all">
            <Clock size={16} className="text-red-400" /> Pomodoro
          </Link>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card Component
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  suffix?: string;
  gradient: string;
  border: string;
  highlight?: boolean;
}

function StatCard({ icon, label, value, suffix, gradient, border, highlight }: StatCardProps) {
  return (
    <div className={`bg-gradient-to-br ${gradient} border ${border} rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
      {highlight && (
        <div className="absolute top-2 right-2">
          <Flame size={16} className="text-orange-400 animate-pulse" />
        </div>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
        <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white">{value}</span>
        {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
      </div>
    </div>
  );
}
