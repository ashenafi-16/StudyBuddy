import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Loader, ArrowLeft, CheckCircle, Eye, EyeOff, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../services/api";

const ChangePasswordPage: React.FC = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        old_password: "",
        new_password: "",
        confirm_password: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false,
    });

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
            if (formData.old_password && formData.new_password === formData.old_password) {
                errors.push("New password must be different from current password");
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
            await authAPI.changePassword(
                formData.old_password,
                formData.new_password,
                formData.confirm_password
            );
            setIsSuccess(true);
            toast.success("Password changed successfully!");

            // Redirect to profile after 2 seconds
            setTimeout(() => {
                navigate("/profile");
            }, 2000);
        } catch (err: any) {
            const errorMessage = err.response?.data?.old_password?.[0] ||
                err.response?.data?.new_password?.[0] ||
                err.response?.data?.confirm_password?.[0] ||
                err.response?.data?.detail ||
                "Failed to change password";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <div className="min-h-screen bg-slate-900 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                {/* Back Button */}
                <Link
                    to="/profile"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Profile
                </Link>

                {/* Main Card */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-700/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                                {isSuccess ? (
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                ) : (
                                    <Shield className="w-6 h-6 text-cyan-400" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-200">
                                    {isSuccess ? "Password Changed!" : "Change Password"}
                                </h1>
                                <p className="text-slate-400 text-sm">
                                    {isSuccess
                                        ? "Your password has been updated successfully"
                                        : "Update your account password"
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {error && (
                            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {!isSuccess ? (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* CURRENT PASSWORD */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type={showPasswords.old ? "text" : "password"}
                                            value={formData.old_password}
                                            onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
                                            className="w-full pl-10 pr-12 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                            placeholder="Enter current password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('old')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors"
                                        >
                                            {showPasswords.old ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* NEW PASSWORD */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type={showPasswords.new ? "text" : "password"}
                                            value={formData.new_password}
                                            onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                                            className="w-full pl-10 pr-12 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                            placeholder="Enter new password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('new')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors"
                                        >
                                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* CONFIRM NEW PASSWORD */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type={showPasswords.confirm ? "text" : "password"}
                                            value={formData.confirm_password}
                                            onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                                            className="w-full pl-10 pr-12 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                            placeholder="Confirm new password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('confirm')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors"
                                        >
                                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
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

                                {/* PASSWORD REQUIREMENTS */}
                                <div className="p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg">
                                    <p className="text-xs text-slate-500 mb-2">Password requirements:</p>
                                    <ul className="text-xs text-slate-400 space-y-1">
                                        <li className={formData.new_password.length >= 8 ? "text-green-400" : ""}>
                                            • At least 8 characters
                                        </li>
                                        <li className={/[A-Z]/.test(formData.new_password) ? "text-green-400" : ""}>
                                            • One uppercase letter
                                        </li>
                                        <li className={/[0-9]/.test(formData.new_password) ? "text-green-400" : ""}>
                                            • One number
                                        </li>
                                    </ul>
                                </div>

                                {/* SUBMIT BUTTON */}
                                <button
                                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    type="submit"
                                    disabled={isSubmitting || validationErrors.length > 0 || !formData.old_password}
                                >
                                    {isSubmitting ? (
                                        <Loader className="w-5 h-5 animate-spin" />
                                    ) : (
                                        "Change Password"
                                    )}
                                </button>
                            </form>
                        ) : (
                            /* SUCCESS MESSAGE */
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-green-400" />
                                </div>
                                <p className="text-slate-400 mb-4">
                                    Redirecting to your profile...
                                </p>
                                <Link
                                    to="/profile"
                                    className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                                >
                                    Go to Profile Now
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordPage;
