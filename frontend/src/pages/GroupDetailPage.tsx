import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { groupService } from '../services/group.service';
import type { StudyGroup, GroupMember } from '../types/groups';
import PageLoader from '../components/common/PageLoader';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import {
    Users,
    BarChart2,
    Share2,
    LogOut,
    UserPlus,
    Calendar,
    Lock,
    Globe,
    UserMinus,
    MessageCircle,
    X,
    Crown,
    Shield,
    Eye
} from 'lucide-react';

const GroupDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [group, setGroup] = useState<StudyGroup | null>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);

    const fetchGroupData = async () => {
        if (!id) return;
        try {
            const groupData = await groupService.getGroup(id);
            setGroup(groupData);

            // Only fetch members if user is a member
            if (groupData.is_member) {
                const membersData = await groupService.getGroupMembers(id);
                setMembers(membersData);
            }

        } catch (error) {
            console.error("Failed to fetch group:", error);
            toast.error("Failed to load group details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroupData();
    }, [id]);

    const handleJoin = async () => {
        if (!group) return;
        setActionLoading(true);
        try {
            await groupService.joinGroup(group.id.toString());
            toast.success("Successfully joined the group!");
            await fetchGroupData();
        } catch (error: any) {
            console.error("Join error:", error);
            const msg = error.response?.data?.error || "Failed to join group.";
            toast.error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeave = async () => {
        if (!group) return;
        if (!window.confirm("Are you sure you want to leave this group?")) return;

        setActionLoading(true);
        try {
            await groupService.leaveGroup(group.id.toString());
            toast.success("Left the group.");
            await fetchGroupData();
        } catch (error: any) {
            console.error("Leave error:", error);
            const msg = error.response?.data?.error || "Failed to leave group.";
            toast.error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveMember = async (memberId: number, memberName: string) => {
        if (!window.confirm(`Are you sure you want to remove ${memberName} from the group?`)) return;

        setActionLoading(true);
        try {
            await groupService.removeMember(memberId);
            toast.success(`${memberName} removed from group.`);
            await fetchGroupData();
        } catch (error: any) {
            console.error("Remove error:", error);
            const msg = error.response?.data?.error || "Failed to remove member.";
            toast.error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const copyInviteLink = () => {
        if (group?.invitation_link) {
            navigator.clipboard.writeText(group.invitation_link);
            toast.success("Invitation link copied to clipboard!");
        }
    };

    if (loading) return <PageLoader />;
    if (!group) return <div className="text-center p-10 text-white">Group not found</div>;

    const isAdmin = group.user_role === 'admin' || group.user_role === 'moderator' || group.created_by.id === currentUser?.id;
    const isCreator = group.created_by.id === currentUser?.id;

    // Member Card Component for Modal
    const MemberCard = ({ member }: { member: GroupMember }) => {
        const isMemberCreator = member.user.id === group.created_by.id;
        const isSelf = member.user.id === currentUser?.id;
        const canRemove = isAdmin && !isMemberCreator && !isSelf;

        return (
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/30 group">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-indigo-300 font-bold text-lg border border-indigo-500/30 overflow-hidden">
                            {member.user.profile_pic_url ? (
                                <img src={member.user.profile_pic_url} alt={member.user.username || member.user.full_name} className="w-full h-full object-cover" />
                            ) : (member.user.username || member.user.full_name || '?').charAt(0).toUpperCase()}
                        </div>
                        {isMemberCreator && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center border-2 border-gray-800">
                                <Crown size={10} className="text-gray-900" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{member.user.username || member.user.full_name}</p>
                            {isSelf && (
                                <span className="text-xs text-gray-400">(You)</span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400">Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${member.role === 'admin'
                        ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 border border-red-500/30'
                        : member.role === 'moderator'
                            ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                        {member.role === 'admin' && <Shield size={12} />}
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                    {canRemove && (
                        <button
                            onClick={() => handleRemoveMember(member.id, member.user.username || member.user.full_name || 'Member')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-all flex items-center gap-1.5 text-sm border border-transparent hover:border-red-500/30"
                            title="Remove Member"
                        >
                            <UserMinus size={14} />
                            Remove
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // Members Modal
    const MembersModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMembersModal(false)} />
            <div className="relative w-full max-w-2xl max-h-[85vh] bg-gray-800 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
                {/* Modal Header */}
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700/50 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                            <Users className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Group Members</h2>
                            <p className="text-sm text-gray-400">{members.length} members in this group</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowMembersModal(false)}
                        className="p-2 hover:bg-gray-700 rounded-xl transition-colors"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[65vh] space-y-3">
                    {members.length > 0 ? (
                        members.map((member) => (
                            <MemberCard key={member.id} member={member} />
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No members found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Members Modal */}
            {showMembersModal && <MembersModal />}

            {/* Header Section */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Group Avatar */}
                    <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-xl shadow-indigo-500/20 ring-4 ring-indigo-500/20">
                        {group.profile_pic_url ? (
                            <img src={group.profile_pic_url} alt={group.group_name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                            <Users className="w-12 h-12 text-white" />
                        )}
                    </div>

                    {/* Group Info */}
                    <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">{group.group_name}</h1>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${group.is_public
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                {group.is_public ? <><Globe size={12} /> Public</> : <><Lock size={12} /> Private</>}
                            </span>
                            <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-indigo-500/20 capitalize">
                                {group.group_type.replace('_', ' ')}
                            </span>
                            {isCreator && (
                                <span className="bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-yellow-500/20 flex items-center gap-1.5">
                                    <Crown size={12} /> Creator
                                </span>
                            )}
                        </div>

                        <p className="text-gray-300 text-lg leading-relaxed max-w-3xl">
                            {group.group_description || "No description provided."}
                        </p>

                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
                            <span className="flex items-center gap-2 bg-gray-700/30 px-3 py-1.5 rounded-lg">
                                <Users className="w-4 h-4 text-indigo-400" />
                                <span className="font-medium text-white">{group.member_count}</span> / {group.max_members} members
                            </span>
                            <span className="flex items-center gap-2 bg-gray-700/30 px-3 py-1.5 rounded-lg">
                                <Calendar className="w-4 h-4 text-indigo-400" />
                                Created {new Date(group.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 w-full lg:w-auto">
                        {group.is_member ? (
                            <>
                                <button
                                    onClick={() => navigate(`/chat?conversationId=${group.chat_id}`)}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40"
                                >
                                    <MessageCircle size={20} />
                                    Group Chat
                                </button>
                                <Link
                                    to={`/groups/${group.id}/analytics`}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-medium transition-all border border-gray-600/50 hover:border-gray-500"
                                >
                                    <BarChart2 size={18} />
                                    Analytics
                                </Link>
                                <button
                                    onClick={handleLeave}
                                    disabled={actionLoading}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl font-medium transition-all disabled:opacity-50 border border-red-500/20 hover:border-red-500/40"
                                >
                                    <LogOut size={18} />
                                    Leave Group
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleJoin}
                                disabled={actionLoading || (group.member_count >= group.max_members)}
                                className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-lg transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <UserPlus size={22} />
                                {group.member_count >= group.max_members ? 'Group Full' : 'Join Group'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Members Section - Only for joined users */}
                    {group.is_member ? (
                        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Group Members</h2>
                                        <p className="text-sm text-gray-400">{members.length} people in this group</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowMembersModal(true)}
                                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 text-indigo-300 rounded-xl font-medium transition-all border border-indigo-500/30 hover:border-indigo-500/50"
                                >
                                    <Eye size={18} />
                                    See Members
                                </button>
                            </div>

                            {/* Preview of first 3 members */}
                            <div className="mt-4 flex items-center gap-2">
                                <div className="flex -space-x-3">
                                    {members.slice(0, 5).map((member) => (
                                        <div
                                            key={member.id}
                                            className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm border-2 border-gray-800 overflow-hidden"
                                            title={member.user.username || member.user.full_name}
                                        >
                                            {member.user.profile_pic_url ? (
                                                <img src={member.user.profile_pic_url} alt="" className="w-full h-full object-cover" />
                                            ) : (member.user.username || member.user.full_name || '?').charAt(0).toUpperCase()}
                                        </div>
                                    ))}
                                    {members.length > 5 && (
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-xs font-bold border-2 border-gray-800">
                                            +{members.length - 5}
                                        </div>
                                    )}
                                </div>
                                <span className="text-gray-400 text-sm ml-2">
                                    {members.length > 5
                                        ? `and ${members.length - 5} more members`
                                        : members.length === 1
                                            ? 'member'
                                            : ''}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gray-700/50 flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-gray-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Members Hidden</h3>
                            <p className="text-gray-400 mb-4">Join this group to see all members and participate in discussions.</p>
                            <button
                                onClick={handleJoin}
                                disabled={actionLoading || (group.member_count >= group.max_members)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
                            >
                                <UserPlus size={18} />
                                Join to View Members
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Creator Card */}
                    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Crown className="w-5 h-5 text-yellow-400" />
                            Group Creator
                        </h3>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border border-yellow-500/10">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center text-yellow-300 font-bold text-xl border border-yellow-500/30">
                                {group.created_by_name?.charAt(0).toUpperCase() || group.created_by.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                                <p className="text-white font-semibold text-lg">{group.created_by_name || group.created_by.username || group.created_by.full_name}</p>
                                <p className="text-sm text-yellow-400/70">Group Admin</p>
                            </div>
                        </div>
                    </div>

                    {/* Invitation Card - Only for members */}
                    {group.is_member && group.invitation_link && (
                        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
                            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-indigo-400" />
                                Invite Others
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">Share this link to invite others to join the group.</p>
                            <button
                                onClick={copyInviteLink}
                                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 text-indigo-300 rounded-xl text-sm font-semibold transition-all border border-indigo-500/30 hover:border-indigo-500/50 flex items-center justify-center gap-2"
                            >
                                <Share2 size={16} />
                                Copy Invitation Link
                            </button>
                        </div>
                    )}

                    {/* Quick Stats */}
                    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Members</span>
                                <span className="text-white font-semibold">{group.member_count} / {group.max_members}</span>
                            </div>
                            <div className="w-full bg-gray-700/50 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${(group.member_count / group.max_members) * 100}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Visibility</span>
                                <span className={`font-semibold ${group.is_public ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {group.is_public ? 'Public' : 'Private'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Your Role</span>
                                <span className={`font-semibold ${group.user_role === 'admin' ? 'text-red-400' :
                                    group.user_role === 'moderator' ? 'text-orange-400' :
                                        group.user_role ? 'text-blue-400' : 'text-gray-500'
                                    }`}>
                                    {group.user_role ? group.user_role.charAt(0).toUpperCase() + group.user_role.slice(1) : 'Not a member'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupDetailPage;
