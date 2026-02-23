import { useState, useEffect, useRef } from 'react';
import { X, LogOut, UserPlus, Shield, Crown, Users, Loader2, Edit3, Check, Camera } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

interface GroupDetailPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

interface MemberInfo {
    id: number;
    user: {
        id: number;
        full_name: string;
        username: string;
        email: string;
        profile_pic_url?: string;
    };
    role: string;
    is_active: boolean;
}

interface GroupInfo {
    id: number;
    group_name: string;
    group_description?: string;
    group_type?: string;
    is_public?: boolean;
    member_count?: number;
    max_members?: number;
    profile_pic_url?: string;
    user_role?: string;
    is_member?: boolean;
    created_by?: { id: number; full_name: string };
    created_by_name?: string;
}

function GroupDetailPanel({ isOpen, onClose }: GroupDetailPanelProps) {
    const { selectedUser, setSelectedUser } = useChatStore();
    const { user } = useAuth();

    const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
    const [members, setMembers] = useState<MemberInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState('');

    // Add member state
    const [showAddMember, setShowAddMember] = useState(false);
    const [addEmail, setAddEmail] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Determine group ID from conversation
    useEffect(() => {
        if (isOpen && selectedUser?.group_name) {
            fetchGroupDetails();
        }
    }, [isOpen, selectedUser]);

    const fetchGroupDetails = async () => {
        if (!selectedUser) return;
        setIsLoading(true);
        try {
            // Try to get group details using the conversation's group reference
            // The conversation might have a group_id or we can search by group_name
            const convId = selectedUser.id;

            // First get conversations to find the group_id
            const convRes = await api.get(`/conversations/${convId}/`);
            const gId = convRes.data?.group;

            if (gId) {
                const [groupRes, membersRes] = await Promise.all([
                    api.get(`/groups/${gId}/`),
                    api.get(`/groups/${gId}/members/`)
                ]);
                setGroupInfo(groupRes.data);
                setMembers(membersRes.data || []);
                setNewName(groupRes.data.group_name || '');
            }
        } catch (err) {
            console.error('Failed to fetch group details:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLeaveGroup = async () => {
        if (!groupInfo) return;
        const confirmed = window.confirm('Are you sure you want to leave this group?');
        if (!confirmed) return;

        try {
            await api.post(`/groups/${groupInfo.id}/leave/`);
            toast.success('Left the group');
            setSelectedUser(null);
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to leave group');
        }
    };

    const handleUpdateName = async () => {
        if (!groupInfo || !newName.trim()) return;
        try {
            await api.patch(`/groups/${groupInfo.id}/`, { group_name: newName.trim() });
            toast.success('Group name updated');
            setIsEditing(false);
            fetchGroupDetails();

            // Update store to reflect name change in chat header/list
            if (selectedUser) {
                setSelectedUser({
                    ...selectedUser,
                    group_name: newName.trim()
                });
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to update name');
        }
    };

    const handleProfilePicClick = () => {
        fileInputRef.current?.click();
    };

    const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !groupInfo) return;

        const formData = new FormData();
        formData.append('profile_pic', file);

        setIsUpdatingPhoto(true);
        try {
            const res = await api.patch(`/groups/${groupInfo.id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Group photo updated');

            const updatedGroup = res.data;
            setGroupInfo(updatedGroup);

            // Update store to reflect photo change in chat header/list
            if (selectedUser) {
                setSelectedUser({
                    ...selectedUser,
                    group_profile_pic: updatedGroup.profile_pic_url
                });
            }
        } catch (err: any) {
            toast.error('Failed to update group photo');
            console.error(err);
        } finally {
            setIsUpdatingPhoto(false);
        }
    };

    const handleAddMember = async () => {
        if (!groupInfo || !addEmail.trim()) return;
        setIsAdding(true);
        try {
            await api.post(`/group-members/`, {
                user_email: addEmail.trim(),
                group_id: groupInfo.id
            });
            toast.success('Member added');
            setAddEmail('');
            setShowAddMember(false);
            fetchGroupDetails();
        } catch (err: any) {
        
            const data = err.response?.data;

            let msg = data?.detail || data?.error;
            if (!msg) {
                const firstValue = Object.values(data || {})[0];
                msg = Array.isArray(firstValue) ? firstValue[0] : firstValue;
            }
            toast.error(msg || "Something went wrong");
        } finally {
            setIsAdding(false);
        }
    };

    const isAdmin = groupInfo?.user_role === 'admin';
    const isModerator = groupInfo?.user_role === 'moderator';
    const canManage = isAdmin || isModerator;
    const canAddMembers = groupInfo?.is_public ? true : canManage;

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                        <Crown size={10} /> Admin
                    </span>
                );
            case 'moderator':
                return (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-full">
                        <Shield size={10} /> Mod
                    </span>
                );
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

            {/* Panel */}
            <div className="fixed right-0 top-0 w-full max-w-sm h-full bg-[#0d1117] border-l border-white/[0.06] z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                {/* Panel Header */}
                <div className="flex items-center justify-between h-16 px-5 border-b border-white/[0.06] flex-shrink-0">
                    <h2 className="text-[15px] font-bold text-white">Group Info</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 size={24} className="text-indigo-500 animate-spin" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="flex flex-col items-center p-6 border-b border-white/[0.06]">
                            <div className="relative group/avatar mb-4">
                                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white/[0.03] shadow-2xl">
                                    {isUpdatingPhoto ? (
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                            <Loader2 size={24} className="text-indigo-500 animate-spin" />
                                        </div>
                                    ) : groupInfo?.profile_pic_url ? (
                                        <img src={groupInfo.profile_pic_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                                            <span className="text-3xl font-bold text-white">
                                                {(groupInfo?.group_name || selectedUser?.group_name || 'G').charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {canManage && (
                                    <>
                                        <button
                                            onClick={handleProfilePicClick}
                                            disabled={isUpdatingPhoto}
                                            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                                        >
                                            <Camera size={24} className="text-white" />
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleProfilePicChange}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </>
                                )}
                            </div>

                            {/* Name with edit */}
                            {isEditing ? (
                                <div className="flex items-center gap-2 w-full max-w-[250px]">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500/40"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                                    />
                                    <button
                                        onClick={handleUpdateName}
                                        className="p-1.5 rounded-lg bg-[#1a6b4a] text-white hover:bg-[#1f7d56] transition-colors"
                                    >
                                        <Check size={14} />
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-white">
                                        {groupInfo?.group_name || selectedUser?.group_name}
                                    </h3>
                                    {canManage && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                                        >
                                            <Edit3 size={13} />
                                        </button>
                                    )}
                                </div>
                            )}

                            <p className="text-[12px] text-slate-500 mt-1">
                                {groupInfo?.group_type || ''} · {groupInfo?.member_count || selectedUser?.total_members || 0} members
                                {groupInfo?.max_members ? ` / ${groupInfo.max_members} max` : ''}
                            </p>

                            {groupInfo?.group_description && (
                                <p className="text-[13px] text-slate-400 mt-3 text-center leading-relaxed max-w-[280px]">
                                    {groupInfo.group_description}
                                </p>
                            )}

                            <div className="flex items-center gap-1.5 mt-2">
                                <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${groupInfo?.is_public ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                    {groupInfo?.is_public ? 'Public' : 'Private'}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-b border-white/[0.06] space-y-2">
                            {/* Add Member */}
                            {canAddMembers && (
                                <div>
                                    <button
                                        onClick={() => setShowAddMember(!showAddMember)}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.03] transition-colors text-[13px] font-medium"
                                    >
                                        <UserPlus size={16} className="text-indigo-400" />
                                        Add Member
                                    </button>
                                    {showAddMember && (
                                        <div className="mt-2 px-4 space-y-2">
                                            <input
                                                type="email"
                                                value={addEmail}
                                                onChange={(e) => setAddEmail(e.target.value)}
                                                placeholder="Enter user email..."
                                                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-slate-500 outline-none focus:border-indigo-500/40"
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                                            />
                                            <button
                                                onClick={handleAddMember}
                                                disabled={isAdding || !addEmail.trim()}
                                                className="w-full py-2 rounded-lg bg-indigo-600 text-white text-[13px] font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                            >
                                                {isAdding ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                                                {isAdding ? 'Adding...' : 'Add'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Leave Group */}
                            <button
                                onClick={handleLeaveGroup}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/[0.06] transition-colors text-[13px] font-medium"
                            >
                                <LogOut size={16} />
                                Leave Group
                            </button>
                        </div>

                        {/* Members List */}
                        <div className="p-4">
                            <h4 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                                <Users size={13} />
                                Members ({members.length})
                            </h4>

                            <div className="space-y-1">
                                {members.filter(m => m.is_active).map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/[0.06] flex-shrink-0">
                                            <img
                                                src={member.user.profile_pic_url || '/avatar.png'}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] font-medium text-slate-200 truncate">
                                                    {member.user.full_name || member.user.username}
                                                </span>
                                                {member.user.id === user?.id && (
                                                    <span className="text-[10px] text-slate-500 font-medium">You</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-500 truncate">@{member.user.username}</p>
                                        </div>
                                        {getRoleBadge(member.role)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default GroupDetailPanel;
