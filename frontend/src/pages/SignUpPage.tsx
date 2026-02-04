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