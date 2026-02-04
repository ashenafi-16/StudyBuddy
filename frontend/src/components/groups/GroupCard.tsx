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
        <div className="group h-full">
            <div className="bg-[#1e293b]/30 border border-slate-800 hover:border-slate-700 transition-all duration-300 rounded-2xl overflow-hidden h-full flex flex-col">

                {/* Thin Type Indicator */}
                <div className={`h-1 ${typeColor}`} />

                <div className="p-6 flex-1 flex flex-col">
                    {/* Header: Title and Role */}
                    <div className="flex justify-between items-start mb-4 gap-4">
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                            {group.group_name}
                        </h3>
                        <div className="flex gap-2 flex-shrink-0">
                            <div className="w-6 h-6 rounded-md bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-800">
                                {group.is_public ? <Globe size={12} /> : <Lock size={12} />}
                            </div>
                        </div>
                    </div>

                    <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed flex-1">
                        {group.group_description || 'Active study community focused on collaborative growth and success.'}
                    </p>

                    {/* Meta Data */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-600">
                            <div className="flex items-center gap-1.5">
                                <Users size={14} className="text-slate-700" />
                                <span>{group.member_count} / {group.max_members}</span>
                            </div>
                            {group.user_role && (
                                <span className={`${group.user_role === 'admin' ? 'text-emerald-500/60' : 'text-blue-500/60'
                                    }`}>
                                    {group.user_role}
                                </span>
                            )}
                        </div>

                        {/* Progress Bar (Visual) */}
                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${typeColor} opacity-30 transition-all duration-1000`}
                                style={{ width: `${(group.member_count / group.max_members) * 100}%` }}
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Link
                                to={`/groups/${group.id}`}
                                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all text-center font-bold text-xs tracking-wider"
                            >
                                VIEW
                            </Link>

                            {!group.is_member && group.is_public && onJoin && (
                                <button
                                    
                                    onClick={() => {
                                        console.log("JOIN CLICKED", group.id);
                                        onJoin(group.id)
                                    }}
                                    disabled={isJoining || group.member_count >= group.max_members}
                                    className="flex-1 py-2.5 bg-white hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 rounded-lg transition-all font-bold text-xs tracking-wider"
                                >
                                    {isJoining ? '...' : 'JOIN'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
