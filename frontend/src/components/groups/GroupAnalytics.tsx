import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, TrendingUp, MessageSquare, CheckCircle, Activity } from 'lucide-react';
import { fetchGroupAnalytics } from '../../api/groupsApi';
import type { GroupAnalytics } from '../../types/groups';
import { Loading, ErrorMessage } from '../common/LoadingError';

export default function GroupAnalyticsComponent() {
    const { id } = useParams<{ id: string }>();
    const [analytics, setAnalytics] = useState<GroupAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            loadAnalytics();
        }
    }, [id]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const data = await fetchGroupAnalytics(Number(id));
            setAnalytics(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading />;
    if (error) return <ErrorMessage error={error} />;
    if (!analytics) return <ErrorMessage error="Analytics not found" />;

    const StatCard = ({ icon: Icon, label, value, color }: any) => (
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-all">
            <div className="flex items-center gap-4">
                <div className={`p-4 rounded-xl ${color} bg-opacity-10`}>
                    <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
                </div>
                <div>
                    <p className="text-slate-400 text-sm mb-1">{label}</p>
                    <p className="text-3xl font-bold text-white">{value}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">{analytics.group_name} Analytics</h1>
                <p className="text-slate-400">Group performance and activity metrics</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Users}
                    label="Total Members"
                    value={analytics.total_members}
                    color="bg-blue-500"
                />
                <StatCard
                    icon={MessageSquare}
                    label="Total Messages"
                    value={analytics.total_messages}
                    color="bg-emerald-500"
                />
                <StatCard
                    icon={CheckCircle}
                    label="Tasks Completed"
                    value={analytics.completed_tasks}
                    color="bg-purple-500"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Completion Rate"
                    value={`${analytics.completion_rate}%`}
                    color="bg-orange-500"
                />
            </div>

            {/* Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Members */}
                <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50">
                    <div className="flex items-center gap-3 mb-6">
                        <Activity className="text-blue-400" size={24} />
                        <h2 className="text-xl font-bold text-white">Activity This Week</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Active Members</span>
                            <span className="text-2xl font-bold text-white">
                                {analytics.active_members_this_week} / {analytics.total_members}
                            </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-3 rounded-full transition-all"
                                style={{
                                    width: `${(analytics.active_members_this_week / analytics.total_members) * 100}%`
                                }}
                            />
                        </div>
                        <p className="text-sm text-slate-500">
                            {Math.round((analytics.active_members_this_week / analytics.total_members) * 100)}% of members active
                        </p>
                    </div>
                </div>

                {/* Task Statistics */}
                <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50">
                    <div className="flex items-center gap-3 mb-6">
                        <CheckCircle className="text-emerald-400" size={24} />
                        <h2 className="text-xl font-bold text-white">Task Statistics</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Total Tasks</span>
                            <span className="text-2xl font-bold text-white">{analytics.total_asks}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Completed</span>
                            <span className="text-xl font-bold text-emerald-400">{analytics.completed_tasks}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Pending</span>
                            <span className="text-xl font-bold text-orange-400">
                                {analytics.total_asks - analytics.completed_tasks}
                            </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-3 mt-4">
                            <div
                                className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full transition-all"
                                style={{ width: `${analytics.completion_rate}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Engagement Overview */}
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-3 mb-6">
                    <MessageSquare className="text-purple-400" size={24} />
                    <h2 className="text-xl font-bold text-white">Engagement Overview</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-400 text-sm mb-2">Messages per Member</p>
                        <p className="text-2xl font-bold text-white">
                            {analytics.total_members > 0
                                ? Math.round(analytics.total_messages / analytics.total_members)
                                : 0}
                        </p>
                    </div>
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-400 text-sm mb-2">Tasks per Member</p>
                        <p className="text-2xl font-bold text-white">
                            {analytics.total_members > 0
                                ? Math.round(analytics.total_asks / analytics.total_members)
                                : 0}
                        </p>
                    </div>
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-400 text-sm mb-2">Activity Rate</p>
                        <p className="text-2xl font-bold text-white">
                            {analytics.total_members > 0
                                ? Math.round((analytics.active_members_this_week / analytics.total_members) * 100)
                                : 0}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
