import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader } from "lucide-react";
import toast from "react-hot-toast";

const GoogleCallbackPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loadProfile } = useAuth();
    const [error, setError] = useState("");
    const processedRef = useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            if (processedRef.current) return;
            processedRef.current = true;

            const accessToken = searchParams.get("access");
            const refreshToken = searchParams.get("refresh");

            if (!accessToken || !refreshToken) {
                setError("No tokens received from Google login.");
                toast.error("Google login failed. Please try again.");
                setTimeout(() => navigate("/login"), 3000);
                return;
            }

            try {
                // Store tokens
                localStorage.setItem("token", accessToken);
                localStorage.setItem("refresh_token", refreshToken);

                // Update auth context by loading profile
                await loadProfile();

                toast.success("Successfully logged in with Google!");
                navigate("/");

            } catch (err) {
                console.error("Error processing Google login:", err);
                toast.error("Failed to process login.");
                navigate("/login");
            }
        };

        handleCallback();
    }, [searchParams, navigate, loadProfile]);

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-red-400 text-center">
                    <p>{error}</p>
                    <p className="text-sm mt-2">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
            <Loader className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-slate-200">Processing Login...</h2>
            <p className="text-slate-400 mt-2">Please wait while we set up your account.</p>
        </div>
    );
};

export default GoogleCallbackPage;
