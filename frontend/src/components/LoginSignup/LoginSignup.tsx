import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Mail, Lock, Shield, Eye, EyeOff, GraduationCap, BookOpen, User, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [formData, setFormData] = useState({ email: "", password: "", role: "student", username: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (activeTab === "login") {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.email, formData.password, formData.role, formData.username);
      }

      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.message || "Authentication failed");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const renderRoleIcon = () => {
    switch (formData.role) {
      case 'admin':
        return <Shield className="text-emerald-400" size={20} />;
      case "student":
        return <GraduationCap className="text-emerald-400" size={20} />;
      case "tutor":
        return <BookOpen className="text-emerald-400" size={20} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px]" />

      <div className="w-full max-w-md mx-4 relative z-10">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="p-8 pb-0 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-500 mb-6 shadow-lg shadow-emerald-500/20">
              <Sparkles className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
              {activeTab === "login" ? "Welcome Back" : "Join Community"}
            </h2>
            <p className="text-slate-400 text-sm">
              {activeTab === "login"
                ? "Enter your credentials to access your account"
                : "Start your learning journey with us today"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex p-2 mx-8 mt-8 bg-black/20 rounded-xl">
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === "login"
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : "text-slate-400 hover:text-white"
                }`}
              onClick={() => { setActiveTab("login"); setError(null); }}
            >
              Login
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === "signup"
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : "text-slate-400 hover:text-white"
                }`}
              onClick={() => { setActiveTab("signup"); setError(null); }}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {activeTab === "signup" && (
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" size={20} />
                <input
                  name="username"
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl 
                             focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 
                             text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" size={20} />
              <input
                name="email"
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl 
                           focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 
                           text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" size={20} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full h-12 pl-12 pr-12 bg-white/5 border border-white/10 rounded-xl 
                           focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 
                           text-white placeholder-slate-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 
                           hover:text-white transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {activeTab === "signup" && (
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  {renderRoleIcon()}
                </div>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl 
                             focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 
                             text-white outline-none appearance-none transition-all cursor-pointer"
                >
                  <option value="student" className="bg-slate-800">Student</option>
                  <option value="tutor" className="bg-slate-800">Tutor</option>
                  <option value="admin" className="bg-slate-800">Admin</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l border-white/10 pl-4">
                  <ArrowRight size={16} className="text-slate-400 rotate-90" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-4 bg-gradient-to-r from-emerald-500 to-emerald-600 
                         hover:from-emerald-400 hover:to-emerald-500
                         rounded-xl font-semibold text-white shadow-lg shadow-emerald-500/25
                         active:scale-[0.98] transition-all duration-200 
                         disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {activeTab === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}