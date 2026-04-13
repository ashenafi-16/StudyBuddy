import { useState, useEffect } from 'react';
import { Search, Plus, Users as UsersIcon } from 'lucide-react';
import { fetchGroups, joinGroup } from '../../api/groupsApi';
import type { StudyGroup } from '../../types/groups';
import GroupCard from './GroupCard';
import { Loading, ErrorMessage } from '../common/LoadingError';
import toast from 'react-hot-toast';

interface GroupsListProps {
    onCreateClick: () => void;
}

export default function GroupsList({ onCreateClick }: GroupsListProps) {
    const [groups, setGroups] = useState<StudyGroup[]>([]);
    const [filteredGroups, setFilteredGroups] = useState<StudyGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'my' | 'public'>('all');
    const [joiningId, setJoiningId] = useState<number | null>(null);

    useEffect(() => {
        loadGroups();
    }, []);

    useEffect(() => {
        filterGroups();
    }, [groups, filterType, searchQuery]);

    const loadGroups = async () => {
        try {
            setLoading(true);
            const data = await fetchGroups();
            setGroups(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load groups');
        } finally {
            setLoading(false);
        }
    };

    const filterGroups = () => {
        let filtered = [...groups];

        // Apply filter type
        if (filterType === 'my') {
            filtered = filtered.filter(g => g.is_member);
        } else if (filterType === 'public') {
            filtered = filtered.filter(g => g.is_public);
        }

        // Apply search
        if (searchQuery.trim()) {
            filtered = filtered.filter(g =>
                g.group_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                g.group_description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredGroups(filtered);
    };

    const handleJoin = async (groupId: number) => {
        try {
            setJoiningId(groupId);
            await joinGroup(groupId);
            toast.success("Joined successfully");
            await loadGroups(); // Reload to update membership status
        } catch (err: any) {
            toast.error('Failed to join group');
        } finally {
            setJoiningId(null);
        }
    };

    if (loading) return <Loading />;
    if (error) return <ErrorMessage error={error} />;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Section - Minimalist */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">
                        Study Groups
                    </h1>
                    <p className="text-slate-500 text-base">
                        Collaborative learning spaces for students.
                    </p>
                </div>
                <button
                    onClick={onCreateClick}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-900 hover:bg-slate-200 transition-all rounded-lg font-bold text-sm shadow-sm"
                >
                    <Plus size={18} strokeWidth={3} />
                    <span>Create Group</span>
                </button>
            </div>

            {/* Filter and Search Bar - Sleek Minimalist */}
            <div className="flex flex-col lg:flex-row items-stretch gap-4">
                {/* Simplified Search */}
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#0f172a] border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-all text-sm font-medium"
                    />
                </div>

                {/* Segmented Control Filters */}
                <div className="flex p-1.5 bg-[#0f172a] border border-slate-800 rounded-xl gap-1">
                    {(['all', 'my', 'public'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${filterType === type
                                    ? 'bg-slate-800 text-white border border-slate-700'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {type === 'all' && 'All'}
                            {type === 'my' && 'My'}
                            {type === 'public' && 'Public'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Groups Grid */}
            {filteredGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGroups.map((group) => (
                        <GroupCard
                            key={group.id}
                            group={group}
                            onJoin={handleJoin}
                            isJoining={joiningId === group.id}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-[#1e293b] rounded-2xl border border-slate-700/50">
                    <UsersIcon size={48} className="mx-auto mb-4 text-slate-600" />
                    <h3 className="text-xl font-semibold text-white mb-2">No groups found</h3>
                    <p className="text-slate-400 mb-4">
                        {searchQuery
                            ? 'Try adjusting your search or filters'
                            : filterType === 'my'
                                ? "You haven't joined any groups yet"
                                : 'No groups available'}
                    </p>
                    {filterType !== 'my' && (
                        <button
                            onClick={onCreateClick}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                        >
                            Create First Group
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
