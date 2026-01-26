import React, { useEffect, useState, useRef } from "react";
import { Loading, ErrorMessage } from "../components/common/LoadingError";
import {
  User, Mail, Briefcase, Calendar, Camera, Edit2, Save, X,
  MapPin, Link as LinkIcon, Shield, Activity
} from "lucide-react";

export default function Profile() {
  const [userProfile, setUserProfile] = useState<any>(null);
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

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found. Please log in.");

      const res = await fetch("http://127.0.0.1:8000/api/auth/users/profile/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Failed to fetch profile (${res.status})`);
      const data = await res.json();

      const profile = data.user_profile || data;
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, profile_pic_url: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const data = await res.json();

      setUserProfile(data);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);

      // Refresh profile data to ensure everything is in sync
      fetchProfile();
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (userProfile) {
      setFormData({
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        bio: userProfile.bio || "",
        profile_pic_url: userProfile.profile_pic_url || "",
        email: userProfile.email,
        role: userProfile.role,
        groups_joined: userProfile.groups_joined || 0,
      });
    }
    setError("");
    setSuccess("");
  };

  if (loading) return <Loading />;
  if (error && !userProfile) return <ErrorMessage error={error} />;

  const getProfilePicUrl = (pic: string | File) => {
    if (pic instanceof File) return URL.createObjectURL(pic);
    return pic || `https://ui-avatars.com/api/?name=${formData.first_name}+${formData.last_name}&background=random`;
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 pb-20">
      {/* Success Message Toast */}
      {success && (
        <div className="fixed top-24 right-4 z-50 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg animate-fade-in-down flex items-center gap-2">
          <Shield size={20} />
          {success}
          <button onClick={() => setSuccess("")} className="ml-2 hover:bg-white/20 rounded-full p-1">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header / Cover */}
      <div className="h-60 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        <div className="bg-[#1e293b] rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden backdrop-blur-sm">

          {/* Profile Header Section */}
          <div className="p-6 sm:p-8 border-b border-slate-700/50">
            <div className="flex flex-col sm:flex-row gap-6 items-start">

              {/* Profile Picture */}
              <div className="relative group">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl ring-4 ring-[#1e293b] overflow-hidden bg-slate-800 shadow-lg">
                  <img
                    src={getProfilePicUrl(formData.profile_pic_url)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  {isEditing && (
                    <div
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="text-white w-8 h-8" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              {/* Basic Info & Actions */}
              <div className="flex-1 pt-2 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-1">
                      {formData.first_name} {formData.last_name}
                    </h1>
                    <div className="flex items-center gap-2 text-slate-400 mb-4">
                      <Shield size={16} className="text-emerald-400" />
                      <span className="capitalize">{formData.role || "Student"}</span>
                      <span className="w-1 h-1 bg-slate-600 rounded-full mx-1"></span>
                      <MapPin size={16} />
                      <span>Add Location</span>
                    </div>
                  </div>

                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20 font-medium"
                    >
                      <Edit2 size={18} />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                      >
                        <X size={18} />
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={updating}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-lg shadow-emerald-500/20 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updating ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Save size={18} />
                        )}
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <div className="text-slate-400 text-xs mb-1">Groups Joined</div>
                    <div className="text-xl font-bold text-white">{formData.groups_joined}</div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <div className="text-slate-400 text-xs mb-1">Study Hours</div>
                    <div className="text-xl font-bold text-white">0</div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <div className="text-slate-400 text-xs mb-1">Resources</div>
                    <div className="text-xl font-bold text-white">0</div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <div className="text-slate-400 text-xs mb-1">Reputation</div>
                    <div className="text-xl font-bold text-white">Newcomer</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Personal Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Bio Section */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="text-blue-400" size={20} />
                  About Me
                </h3>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-slate-400 leading-relaxed">
                    {formData.bio || "No bio added yet. Click edit to tell us about yourself!"}
                  </p>
                )}
              </section>

              {/* Details Form (Edit Mode) or View */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="text-purple-400" size={20} />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">First Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <div className="text-white font-medium">{formData.first_name}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">Last Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <div className="text-white font-medium">{formData.last_name}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">Email Address</label>
                    <div className="flex items-center gap-2 text-white font-medium opacity-70 cursor-not-allowed">
                      <Mail size={16} />
                      {formData.email}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">Role</label>
                    <div className="flex items-center gap-2 text-white font-medium capitalize">
                      <Briefcase size={16} />
                      {formData.role || "Student"}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Sidebar Info */}
            <div className="space-y-6">
              <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <LinkIcon size={18} className="text-emerald-400" />
                  Social Links
                </h4>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors text-sm">
                    <div className="w-8 h-8 rounded-full bg-[#0077b5]/20 flex items-center justify-center text-[#0077b5]">
                      in
                    </div>
                    Add LinkedIn
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors text-sm">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Add GitHub
                  </button>
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Calendar size={18} className="text-orange-400" />
                  Joined
                </h4>
                <p className="text-slate-400 text-sm">
                  Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
