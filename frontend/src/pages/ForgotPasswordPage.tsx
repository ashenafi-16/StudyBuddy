import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Mail, Loader, ArrowLeft, CheckCircle } from "lucide-react";
import BorderAnimatedContainer from "../components/common/BorderAnimatedContainer";
import toast from "react-hot-toast";
import { authAPI } from "../services/api";

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            await authAPI.requestPasswordReset(email);
            setIsSuccess(true);
            toast.success("Reset link sent if account exists");
        } catch (err: any) {
            // Even on error, show success message for security
            setIsSuccess(true);
            toast.success("Reset link sent if account exists");
        } finally {
            setIsSubmitting(false);
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
                                        {isSuccess ? (
                                            <CheckCircle className="w-6 h-6 text-green-400" />
                                        ) : (
                                            <MessageCircle className="w-6 h-6 text-cyan-400" />
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-200 mb-2">
                                        {isSuccess ? "Check Your Email" : "Forgot Password?"}
                                    </h2>
                                    <p className="text-slate-400">
                                        {isSuccess
                                            ? "If an account exists with this email, you'll receive a password reset link shortly."
                                            : "Enter your email and we'll send you a reset link"}
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                                        {error}
                                    </div>
                                )}

                                {!isSuccess ? (
                                    /* FORM */
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* EMAIL INPUT */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                                    placeholder="johndoe@gmail.com"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* SUBMIT BUTTON */}
                                        <button
                                            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            type="submit"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <Loader className="w-5 h-5 animate-spin" />
                                            ) : (
                                                "Send Reset Link"
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    /* SUCCESS MESSAGE */
                                    <div className="text-center">
                                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                            <p className="text-green-400 text-sm">
                                                Please check your inbox and spam folder. The link will expire in 24 hours.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsSuccess(false);
                                                setEmail("");
                                            }}
                                            className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                                        >
                                            Try a different email
                                        </button>
                                    </div>
                                )}

                                <div className="mt-6 text-center">
                                    <Link to="/login" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm inline-flex items-center gap-2">
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to Login
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* FORM ILLUSTRATION - RIGHT SIDE */}
                        <div className="hidden md:flex md:w-1/2 h-full bg-gradient-to-bl from-slate-800/20 to-transparent items-center justify-center">
                            <div className="text-center p-8">
                                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                                    <Mail className="w-16 h-16 text-cyan-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-200 mb-2">Password Recovery</h3>
                                <p className="text-slate-400 text-sm max-w-xs">
                                    We'll send you a secure link to reset your password. Check your email after submitting.
                                </p>
                            </div>
                        </div>
                    </div>
                </BorderAnimatedContainer>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
