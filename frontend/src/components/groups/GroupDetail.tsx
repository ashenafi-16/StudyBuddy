import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Users, MessageSquare, BarChart3, LogOut,
    Calendar, CheckCircle, Clock, ArrowLeft
} from 'lucide-react';
import {
    fetchGroupDetail,
    leaveGroup,
    joinGroup,
    canManageGroup,
    getGroupTypeLabel,
    getGroupTypeColor
} from '../../api/groupsApi';
import type { StudyGroupDetail } from '../../types/groups';
import { Loading, ErrorMessage } from '../common/LoadingError';

export default function GroupDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [group, setGroup] = useState<StudyGroupDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (id) {
            loadGroup();
        }
    }, [id]);

    const loadGroup = async () => {
        try {
            setLoading(true);
            const data = await fetchGroupDetail(Number(id));
            setGroup(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load group');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!group) return;

        try {
            setActionLoading(true);
            await joinGroup(group.id);
            await loadGroup(); // Reload to update membership
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to join group');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeave = async () => {
        if (!group) return;

        if (!confirm('Are you sure you want to leave this group?')) return;

        try {
            setActionLoading(true);
            await leaveGroup(group.id);
            navigate('/groups');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to leave group');
            setActionLoading(false);
        }
    };

    if (loading) return <Loading />;
    if (error) return <ErrorMessage error={error} />;
    if (!group) return <ErrorMessage error="Group not found" />;

    const typeColor = getGroupTypeColor(group.group_type);
    const typeLabel = getGroupTypeLabel(group.group_type);
    const canManage = canManageGroup(group);

    return (
        <div className="min-h-screen bg-[#0f172a] text-white">
            {/* Header */}
            <div className={`${typeColor} bg-gradient-to-br relative`}>
                <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-transparent" />
                <div className="relative max-w-7xl mx-auto px-6 py-12">
                    <Link
                        to="/groups"
                        className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Groups</span>
                    </Link>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/30">
                                    {typeLabel}
                                </span>
                                {group.user_role && (
                                    <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                                        {group.user_role.charAt(0).toUpperCase() + group.user_role.slice(1)}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-4xl font-bold mb-3">{group.group_name}</h1>
                            <p className="text-white/80 text-lg max-w-2xl">
                                {group.group_description || 'No description provided'}
                            </p>
                            <div className="flex items-center gap-4 mt-4 text-white/80">
                                <div className="flex items-center gap-2">
                                    <Users size={20} />
                                    <span>{group.member_count}/{group.max_members} members</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={20} />
                                    <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            {group.is_member ? (
                                <>
                                    <Link
                                        to={`/groups/${group.id}/members`}
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all border border-white/30 flex items-center gap-2"
                                    >
                                        <Users size={20} />
                                        <span>Members</span>
                                    </Link>
                                    {canManage && (
                                        <Link
                                            to={`/groups/${group.id}/analytics`}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all border border-white/30 flex items-center gap-2"
                                        >
                                            <BarChart3 size={20} />
                                            <span>Analytics</span>
                                        </Link>
                                    )}
                                    <button
                                        onClick={handleLeave}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm rounded-lg transition-all border border-red-400/30 flex items-center gap-2"
                                    >
                                        <LogOut size={20} />
                                        <span>Leave</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleJoin}
                                    disabled={actionLoading || !group.is_public || group.member_count >= group.max_members}
                                    className="px-6 py-3 bg-white text-blue-600 hover:bg-white/90 disabled:bg-white/50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
                                >
                                    {actionLoading ? 'Joining...' : group.member_count >= group.max_members ? 'Group Full' : 'Join Group'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Recent Messages */}
                        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <MessageSquare className="text-blue-400" size={24} />
                                    Recent Messages
                                </h2>
                                <Link
                                    to="/chat"
                                    className="text-sm text-blue-400 hover:text-blue-300"
                                >
                                    View All
                                </Link>
                            </div>
                            {group.recent_messages.length > 0 ? (
                                <div className="space-y-3">
                                    {group.recent_messages.map((msg) => (
                                        <div key={msg.id} className="p-3 bg-slate-800/50 rounded-lg">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-sm">{msg.sender.full_name}</span>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <p className="text-slate-300 text-sm">{msg.content}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-center py-8">No messages yet</p>
                            )}
                        </div>

                        {/* Active Tasks */}
                        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <CheckCircle className="text-emerald-400" size={24} />
                                    Active Tasks
                                </h2>
                            </div>
                            {group.active_tasks.length > 0 ? (
                                <div className="space-y-3">
                                    {group.active_tasks.map((task) => (
                                        <div key={task.id} className="p-4 bg-slate-800/50 rounded-lg border-l-4 border-blue-500">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold mb-1">{task.title}</h3>
                                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={14} />
                                                            Due {new Date(task.due_date).toLocaleDateString()}
                                                        </span>
                                                        <span>Assigned to {task.assigned_to.full_name}</span>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                                                        task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                                            task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-center py-8">No active tasks</p>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Group Info */}
                        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
                            <h3 className="font-bold mb-4">Group Information</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-slate-400">Created by</span>
                                    <p className="font-semibold">{group.created_by.full_name}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Type</span>
                                    <p className="font-semibold">{typeLabel}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Privacy</span>
                                    <p className="font-semibold">{group.is_public ? 'Public' : 'Private'}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Members</span>
                                    <p className="font-semibold">{group.member_count} / {group.max_members}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
