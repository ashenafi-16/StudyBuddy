import type { StudyGroup } from '../../types/groups';
import { getGroupTypeLabel, getGroupTypeColor } from '../../api/groupsApi';
import { Users, Lock, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GroupCardProps {
    group: StudyGroup;
    onJoin?: (groupId: number) => void;
    isJoining?: boolean;
}

export default function GroupCard({ group, onJoin, isJoining }: GroupCardProps) {
    const typeColor = getGroupTypeColor(group.group_type);
    const typeLabel = getGroupTypeLabel(group.group_type);

    return (
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-all group overflow-hidden">
            {/* Header with gradient */}
            <div className={`h-24 ${typeColor} bg-gradient-to-br from-opacity-80 to-opacity-60 relative`}>
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/30">
                            {typeLabel}
                        </span>
                        {group.is_public ? (
                            <Globe size={16} className="text-white/80" />
                        ) : (
                            <Lock size={16} className="text-white/80" />
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">
                    {group.group_name}
                </h3>

                <p className="text-slate-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {group.group_description || 'No description provided'}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                        <Users size={16} />
                        <span>{group.member_count}/{group.max_members}</span>
                    </div>
                    {group.user_role && (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${group.user_role === 'admin'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : group.user_role === 'moderator'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                            {group.user_role.charAt(0).toUpperCase() + group.user_role.slice(1)}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Link
                        to={`/groups/${group.id}`}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-center font-medium"
                    >
                        View Details
                    </Link>

                    {!group.is_member && group.is_public && onJoin && (
                        <button
                            onClick={() => onJoin(group.id)}
                            disabled={isJoining || group.member_count >= group.max_members}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium"
                        >
                            {isJoining ? 'Joining...' : group.member_count >= group.max_members ? 'Full' : 'Join'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
