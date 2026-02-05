import { useState, useEffect } from "react";
import { Check, Star, Shield, Zap, AlertCircle, Loader2 } from "lucide-react";
import { fetchSubscriptionPlans, fetchMySubscription, subscribeToPlan, verifyPayment, type SubscriptionPlan, type UserSubscription } from "../api/subscriptionApi";
import { Loading } from "../components/common/LoadingError";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function SubscriptionPage() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const { loadProfile, subscriptions } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadData();

        // Check for payment verification from URL
        const params = new URLSearchParams(window.location.search);
        const txRef = params.get('tx_ref');
        if (txRef) {
            handleVerification(txRef);
        }
    }, []);

    const loadData = async () => {
        try {
            const [plansData] = await Promise.all([
                fetchSubscriptionPlans(),
                loadProfile() // Get latest multi-subs from global context
            ]);
            setPlans(plansData);
        } catch (error) {
            console.error("Failed to load subscription data", error);
            toast.error("Failed to load subscription plans");
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async (txRef: string) => {
        try {
            setLoading(true);
            await verifyPayment(txRef);
            toast.success("Subscription activated successfully!");

            // Reload global profile/subscription state
            await loadProfile();

            // Remove query params
            window.history.replaceState({}, document.title, window.location.pathname);

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Payment verification failed");
            setLoading(false);
        }
    };

    const handleSubscribe = async (plan: SubscriptionPlan) => {
        try {
            setProcessingId(plan.id);
            const response = await subscribeToPlan(plan.id);

            // Redirect to Chapa checkout
            if (response.checkout_url) {
                window.location.href = response.checkout_url;
            } else {
                toast.error("Failed to initialize payment");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to start subscription");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                        Unlock Your Full Potential with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Premium</span>
                    </h1>
                    <p className="text-lg text-slate-400">
                        Get unlimited access to advanced study tools, AI-powered recommendations, and exclusive resources.
                    </p>
                </div>

                {/* Current Subscriptions Status */}
                {subscriptions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {subscriptions.map(sub => (
                            <div key={sub.id} className="bg-gradient-to-r from-emerald-900/40 to-cyan-900/40 border border-emerald-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Active Subscription</h3>
                                        <p className="text-emerald-400 text-sm">
                                            {sub.plan.name} • Starts {new Date(sub.start_date!).toLocaleDateString()} • Ends {new Date(sub.end_date!).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <span className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg text-xs">
                                    ACTIVE
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
                    {plans.map((plan) => {
                        const matchingSub = subscriptions.find(sub => sub.plan.id === plan.id);
                        const isCurrentPlan = !!matchingSub;

                        return (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl p-8 transition-all duration-300 flex flex-col h-full ${isCurrentPlan
                                    ? 'bg-slate-800/80 border-2 border-emerald-500 shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/10'
                                    : plan.is_popular
                                        ? 'bg-slate-800/80 border-2 border-cyan-500 transform lg:-translate-y-4 shadow-xl shadow-cyan-500/20'
                                        : 'bg-slate-800/40 border border-slate-700 hover:border-slate-600'
                                    }`}
                            >
                                {plan.is_popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                                        <Star size={14} fill="currentColor" /> MOST POPULAR
                                    </div>
                                )}

                                <div className="space-y-6 flex flex-col h-full">
                                    <div className="flex-1 space-y-6">
                                        <h3 className="text-xl font-semibold text-slate-200">{plan.name}</h3>
                                        <div className="mt-4 flex items-baseline text-white">
                                            <span className="text-4xl font-bold tracking-tight">
                                                {plan.price} {plan.currency}
                                            </span>
                                            <span className="ml-1 text-slate-400 font-medium">
                                                /{plan.duration_days} days
                                            </span>
                                        </div>
                                        <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                                            {plan.description}
                                        </p>
                                    </div>

                                    <div className="h-px bg-slate-700/50" />

                                    <ul className="space-y-4">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <div className="mt-1 w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center flex-shrink-0">
                                                    <Check size={12} className="text-emerald-400" strokeWidth={3} />
                                                </div>
                                                <span className="text-sm text-slate-300">
                                                    {typeof feature === 'string' ? feature : JSON.stringify(feature)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleSubscribe(plan)}
                                        disabled={processingId !== null || isCurrentPlan}
                                        className={`w-full py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isCurrentPlan
                                            ? 'bg-slate-700 text-slate-400 cursor-default'
                                            : plan.is_popular
                                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                                                : 'bg-white text-slate-900 hover:bg-slate-200'
                                            }`}
                                    >
                                        {processingId === plan.id ? (
                                            <Loader2 className="animate-spin" size={20} />
                                        ) : isCurrentPlan ? (
                                            "Current Plan"
                                        ) : (
                                            <>
                                                Get {plan.name} <Zap size={18} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ or Trust Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center pt-8 border-t border-slate-700/50">
                    <div className="space-y-2">
                        <div className="w-10 h-10 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-3">
                            <Shield size={20} />
                        </div>
                        <h4 className="text-white font-medium">Secure Payment</h4>
                        <p className="text-sm text-slate-400">Transactions processed securely via Chapa</p>
                    </div>
                    <div className="space-y-2">
                        <div className="w-10 h-10 mx-auto bg-purple-500/10 rounded-full flex items-center justify-center text-purple-400 mb-3">
                            <Zap size={20} />
                        </div>
                        <h4 className="text-white font-medium">Instant Access</h4>
                        <p className="text-sm text-slate-400">Features unlocked immediately after payment</p>
                    </div>
                    <div className="space-y-2">
                        <div className="w-10 h-10 mx-auto bg-orange-500/10 rounded-full flex items-center justify-center text-orange-400 mb-3">
                            <AlertCircle size={20} />
                        </div>
                        <h4 className="text-white font-medium">Cancel Anytime</h4>
                        <p className="text-sm text-slate-400">No hidden fees or long-term commitments</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
