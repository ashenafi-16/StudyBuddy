import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Mail, Lock, Loader, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import BorderAnimatedContainer from "../components/common/BorderAnimatedContainer";
import toast from "react-hot-toast";

const SignUpPage: React.FC = () => {
    const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
    const { register } = useAuth();
    const navigate = useNavigate();
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSigningUp(true);
        setError("");

        try {
            const username = formData.fullName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000);

            const result = await register(formData.email, formData.password, "student", username);
            if (result.success) {
                toast.success("Account created successfully!")
                navigate("/");
            } else {
                toast.error(result.message || "Registration failed");
                setError(result.message || "Registration failed");
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
            setError("An unexpected error occurred");
        } finally {
            setIsSigningUp(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center p-4 bg-slate-900">
            <div className="relative w-full max-w-6xl md:h-[800px] h-[650px]">
                <BorderAnimatedContainer>
                    <div className="w-full h-full flex flex-col md:flex-row relative">
                        {/* FORM COLUMN - LEFT SIDE */}
                        <div className="md:w-1/2 p-8 flex items-center justify-center md:border-r border-slate-600/30 bg-slate-900/50 backdrop-blur-sm">
                            <div className="w-full max-w-md">
                                {/* HEADING TEXT */}
                                <div className="text-center mb-8">
                                    <div className="w-12 h-12 mx-auto bg-slate-800/50 rounded-xl flex items-center justify-center mb-4">
                                        <MessageCircle className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-200 mb-2">Create Account</h2>
                                    <p className="text-slate-400">Sign up for a new account</p>
                                </div>

                                {error && (
                                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                                        {error}
                                    </div>
                                )}

                                {/* FORM */}
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* FULL NAME */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                            <input
                                                type="text"
                                                value={formData.fullName}
                                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                                placeholder="John Doe"
                                                required
                                            />
                                        </div>
                                    </div>

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
                                        disabled={isSigningUp}
                                    >
                                        {isSigningUp ? (
                                            <Loader className="w-5 h-5 animate-spin" />
                                        ) : (
                                            "Create Account"
                                        )}
                                    </button>
                                </form>

                                <div className="mt-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-slate-700"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-slate-900/50 text-slate-500">Or continue with</span>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <a
                                            href="http://127.0.0.1:8000/accounts/google/login/"
                                            className="w-full flex items-center justify-center gap-3 py-2.5 bg-white text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    fill="#4285F4"
                                                />
                                                <path
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    fill="#34A853"
                                                />
                                                <path
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                    fill="#FBBC05"
                                                />
                                                <path
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                    fill="#EA4335"
                                                />
                                            </svg>
                                            Continue with Google
                                        </a>
                                    </div>
                                </div>

                                <div className="mt-6 text-center">
                                    <Link to="/" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                                        Already have an account? Login
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* FORM ILLUSTRATION - RIGHT SIDE */}
                        <div className="hidden md:flex md:w-1/2 h-full relative overflow-hidden">
                            {/* Main background image */}
                            <img
                                src="/signup.png"
                                alt="People using mobile devices"
                                className="w-full h-full object-cover"
                            />

                            {/* OVERLAY GRADIENTS ON ALL SIDES */}

                            {/* Left side gradient - blending with form */}
                            <div className="absolute left-0 top-0 bottom-0 w-32 z-10 
                                bg-gradient-to-r from-slate-800 via-slate-900/40 to-transparent">
                                {/* Subtle inner gradient for smoother transition */}
                                {/* <div className="absolute left-0 top-0 bottom-0 w-16
                                    bg-gradient-to-r from-slate-900 to-slate-900/0"></div> */}
                            </div>

                            {/* Right side gradient */}
                            <div className="absolute right-0 top-0 bottom-0 w-24 z-10 
                                bg-gradient-to-l from-slate-600 via-slate-700/30 to-transparent">
                                <div className="absolute right-0 top-0 bottom-0 w-12
                                    bg-gradient-to-l from-slate-900 to-slate-900/0"></div>
                            </div>





                            {/* Subtle overall vignette effect */}
                            <div className="absolute inset-0 z-5 
                                bg-gradient-radial from-transparent via-transparent to-slate-900/20"></div>

                            {/* Optional: Cyan tint overlay to match theme */}
                            <div className="absolute inset-0 z-0 
                                bg-gradient-to-br from-cyan-900/5 via-transparent to-slate-900/10 mix-blend-overlay"></div>
                        </div>
                    </div>
                </BorderAnimatedContainer>
            </div>
        </div>
    );
};

export default SignUpPage;