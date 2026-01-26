import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Mail, Lock, Loader } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import BorderAnimatedContainer from "../components/common/BorderAnimatedContainer";
import toast from "react-hot-toast";

const LoginPage: React.FC = () => {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError("");

        try {
            const result = await login(formData.email, formData.password);
            if (result.success) {
                toast.success("Login successful!");
                navigate("/dashboard");
            } else {
                toast.error(result.message || "Login failed");
                setError(result.message || "Login failed");
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
            setError("An unexpected error occurred");
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center p-4 bg-slate-900">
            <div className="relative w-full max-w-6xl md:h-[800px] h-[650px]">
                <BorderAnimatedContainer>
                    <div className="w-full h-full flex flex-col md:flex-row">
                        {/* FORM COLUMN - LEFT SIDE */}
                        <div className="md:w-1/2 p-8 flex items-center justify-center md:border-r border-slate-600/30 bg-slate-900/50 backdrop-blur-sm">
                            <div className="w-full max-w-md">
                                {/* HEADING TEXT */}
                                <div className="text-center mb-8">
                                    <div className="w-12 h-12 mx-auto bg-slate-800/50 rounded-xl flex items-center justify-center mb-4">
                                        <MessageCircle className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-200 mb-2">Welcome Back</h2>
                                    <p className="text-slate-400">Login to access your account</p>
                                </div>

                                {error && (
                                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                                        {error}
                                    </div>
                                )}

                                {/* FORM */}
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* EMAIL INPUT */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                                placeholder="johndoe@gmail.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* PASSWORD INPUT */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                                placeholder="Enter your password"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* SUBMIT BUTTON */}
                                    <button
                                        className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        type="submit"
                                        disabled={isLoggingIn}
                                    >
                                        {isLoggingIn ? (
                                            <Loader className="w-5 h-5 animate-spin" />
                                        ) : (
                                            "Sign In"
                                        )}
                                    </button>
                                </form>

                                <div className="mt-6 text-center">
                                    <Link to="/signup" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                                        Don't have an account? Sign Up
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* FORM ILLUSTRATION - RIGHT SIDE */}
                            <div className="hidden md:flex md:w-1/2 h-full bg-gradient-to-bl from-slate-800/20 to-transparent">

                                <img
                                src="/login.png"
                                alt="People using mobile devices"
                                className="w-full h-full object-cover"
                                />
                              
                        </div>
                    </div>
                </BorderAnimatedContainer>
            </div>
        </div>
    );
};

export default LoginPage;
