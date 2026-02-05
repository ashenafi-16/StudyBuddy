import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MessageCircle, Lock, Loader, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import BorderAnimatedContainer from "../components/common/BorderAnimatedContainer";
import toast from "react-hot-toast";
import { authAPI } from "../services/api";

const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const uid = searchParams.get("uid") || "";
    const token = searchParams.get("token") || "";

    const [formData, setFormData] = useState({
        new_password: "",
        confirm_password: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Check for missing params
    const isMissingParams = !uid || !token;

    // Password validation
    useEffect(() => {
        const errors: string[] = [];
        if (formData.new_password) {
            if (formData.new_password.length < 8) {
                errors.push("Password must be at least 8 characters");
            }
            if (!/[A-Z]/.test(formData.new_password)) {
                errors.push("Include at least one uppercase letter");
            }
            if (!/[0-9]/.test(formData.new_password)) {
                errors.push("Include at least one number");
            }
        }
        if (formData.confirm_password && formData.new_password !== formData.confirm_password) {
            errors.push("Passwords do not match");
        }
        setValidationErrors(errors);
    }, [formData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (validationErrors.length > 0) {
            toast.error("Please fix validation errors");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            await authAPI.confirmPasswordReset(
                uid,
                token,
                formData.new_password,
                formData.confirm_password
            );
            setIsSuccess(true);
            toast.success("Password reset successfully!");

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err: any) {
            const errorMessage = err.response?.data?.token?.[0] ||
                err.response?.data?.new_password?.[0] ||
                err.response?.data?.confirm_password?.[0] ||
                "Failed to reset password. The link may have expired.";
            setError(errorMessage);
            toast.error(errorMessage);
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
                                        ) : isMissingParams ? (
                                            <AlertCircle className="w-6 h-6 text-red-400" />
                                        ) : (
                                            <MessageCircle className="w-6 h-6 text-cyan-400" />
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-200 mb-2">
                                        {isSuccess ? "Password Reset!" : isMissingParams ? "Invalid Link" : "Reset Your Password"}
                                    </h2>
                                    <p className="text-slate-400">
                                        {isSuccess
                                            ? "Your password has been successfully reset. Redirecting to login..."
                                            : isMissingParams
                                                ? "This password reset link is invalid or has expired."
                                                : "Enter your new password below"}
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                                        {error}
                                    </div>
                                )}

                                {isMissingParams ? (
                                    /* MISSING PARAMS ERROR */
                                    <div className="text-center">
                                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                            <p className="text-red-400 text-sm">
                                                Please request a new password reset link.
                                            </p>
                                        </div>
                                        <Link
                                            to="/forgot-password"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition-all"
                                        >
                                            Request New Link
                                        </Link>
                                    </div>
                                ) : !isSuccess ? (
                                    /* FORM */
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* NEW PASSWORD INPUT */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1.5">New Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                <input
                                                    type="password"
                                                    value={formData.new_password}
                                                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                                    placeholder="Enter new password"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* CONFIRM PASSWORD INPUT */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Confirm Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                <input
                                                    type="password"
                                                    value={formData.confirm_password}
                                                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                                    placeholder="Confirm new password"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* VALIDATION ERRORS */}
                                        {validationErrors.length > 0 && (
                                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                                <ul className="text-yellow-400 text-xs space-y-1">
                                                    {validationErrors.map((err, idx) => (
                                                        <li key={idx}>• {err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* SUBMIT BUTTON */}
                                        <button
                                            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            type="submit"
                                            disabled={isSubmitting || validationErrors.length > 0}
                                        >
                                            {isSubmitting ? (
                                                <Loader className="w-5 h-5 animate-spin" />
                                            ) : (
                                                "Reset Password"
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    /* SUCCESS MESSAGE */
                                    <div className="text-center">
                                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                            <p className="text-green-400 text-sm">
                                                You will be redirected to login in a few seconds...
                                            </p>
                                        </div>
                                        <Link
                                            to="/login"
                                            className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                                        >
                                            Go to Login Now
                                        </Link>
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
                                    <Lock className="w-16 h-16 text-cyan-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-200 mb-2">Secure Password Reset</h3>
                                <p className="text-slate-400 text-sm max-w-xs">
                                    Choose a strong password with at least 8 characters, including uppercase letters and numbers.
                                </p>
                            </div>
                        </div>
                    </div>
                </BorderAnimatedContainer>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
