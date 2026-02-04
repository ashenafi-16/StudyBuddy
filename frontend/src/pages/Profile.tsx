import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Loading, ErrorMessage } from "../components/common/LoadingError";
import {
  User, Mail, Briefcase, Camera, Edit2, Save, X,
  Shield, Users, BookOpen, Clock, Award
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

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
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
        first_name: userProfile.first_name || "",
        last_name: userProfile.last_name || "",
        bio: userProfile.bio || "",
        profile_pic_url: userProfile.profile_pic_url || "",
        email: userProfile.email || "",
        role: userProfile.role || "",
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
    return pic || `https://ui-avatars.com/api/?name=${formData.first_name}+${formData.last_name}&background=6366f1&color=fff&size=200`;
  };

  const fullName = `${formData.first_name} ${formData.last_name}`.trim() || 'User';

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2">
            <Shield size={18} />
            {success}
            <button onClick={() => setSuccess("")} className="ml-auto hover:bg-white/10 rounded-full p-1">
              <X size={16} />
            </button>
          </div>
        )}

        {error && userProfile && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
            <X size={18} />
            {error}
            <button onClick={() => setError("")} className="ml-auto hover:bg-white/10 rounded-full p-1">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden">

          {/* Cover / Header */}
          <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
            <div className="absolute inset-0 bg-black/20" />
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row gap-6 -mt-16 relative">

              {/* Avatar */}
              <div className="relative group flex-shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl ring-4 ring-[#1e293b] overflow-hidden bg-slate-700 shadow-xl">
                  <img
                    src={getProfilePicUrl(formData.profile_pic_url)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  {isEditing && (
                    <div
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl"
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

              {/* Name & Actions */}
              <div className="flex-1 pt-4 sm:pt-8">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    {isEditing ? (
                      <div className="flex gap-3 mb-3">
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          placeholder="First name"
                          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none w-32"
                        />
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          placeholder="Last name"
                          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none w-32"
                        />
                      </div>
                    ) : (
                      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                        {fullName}
                      </h1>
                    )}
                    <div className="flex items-center gap-3 text-slate-400 text-sm">
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        {formData.email}
                      </span>
                      <span className="flex items-center gap-1 capitalize">
                        <Briefcase size={14} />
                        {formData.role || "Student"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
                    >
                      <Edit2 size={18} />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all"
                      >
                        <X size={18} />
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={updating}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                      >
                        {updating ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Save size={18} />
                        )}
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 text-center">
            <Users className="mx-auto text-blue-400 mb-2" size={24} />
            <p className="text-2xl font-bold text-white">{formData.groups_joined}</p>
            <p className="text-sm text-slate-400">Groups</p>
          </div>
          <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 text-center">
            <Clock className="mx-auto text-emerald-400 mb-2" size={24} />
            <p className="text-2xl font-bold text-white">0h</p>
            <p className="text-sm text-slate-400">Study Time</p>
          </div>
          <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 text-center">
            <BookOpen className="mx-auto text-purple-400 mb-2" size={24} />
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-sm text-slate-400">Resources</p>
          </div>
          <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 text-center">
            <Award className="mx-auto text-yellow-400 mb-2" size={24} />
            <p className="text-2xl font-bold text-white">Newcomer</p>
            <p className="text-sm text-slate-400">Level</p>
          </div>
        </div>

        {/* Bio Section */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="text-blue-400" size={20} />
            About Me
          </h3>
          {isEditing ? (
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Tell us about yourself..."
            />
          ) : (
            <p className="text-slate-400 leading-relaxed">
              {formData.bio || "No bio added yet. Click Edit Profile to tell us about yourself!"}
            </p>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/groups"
            className="bg-[#1e293b] p-5 rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="text-blue-400" size={24} />
            </div>
            <div>
              <h4 className="text-white font-semibold">My Groups</h4>
              <p className="text-slate-400 text-sm">View and manage your study groups</p>
            </div>
          </Link>
          <Link
            to="/resources"
            className="bg-[#1e293b] p-5 rounded-xl border border-slate-700/50 hover:border-purple-500/50 transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <BookOpen className="text-purple-400" size={24} />
            </div>
            <div>
              <h4 className="text-white font-semibold">My Resources</h4>
              <p className="text-slate-400 text-sm">Access your uploaded files</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
