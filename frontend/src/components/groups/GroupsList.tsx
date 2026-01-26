import { useState, useEffect } from 'react';
import { Search, Plus, Users as UsersIcon } from 'lucide-react';
import { fetchGroups, joinGroup } from '../../api/groupsApi';
import type { StudyGroup } from '../../types/groups';
import GroupCard from './GroupCard';
import { Loading, ErrorMessage } from '../common/LoadingError';

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
            await loadGroups(); // Reload to update membership status
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to join group');
        } finally {
            setJoiningId(null);
        }
    };

    if (loading) return <Loading />;
    if (error) return <ErrorMessage error={error} />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Study Groups</h1>
                    <p className="text-slate-400">Discover and join study groups</p>
                </div>
                <button
                    onClick={onCreateClick}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20"
                >
                    <Plus size={20} />
                    <span>Create Group</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-4 py-3 rounded-xl font-medium transition-all ${filterType === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#1e293b] text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        All Groups
                    </button>
                    <button
                        onClick={() => setFilterType('my')}
                        className={`px-4 py-3 rounded-xl font-medium transition-all ${filterType === 'my'
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#1e293b] text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        My Groups
                    </button>
                    <button
                        onClick={() => setFilterType('public')}
                        className={`px-4 py-3 rounded-xl font-medium transition-all ${filterType === 'public'
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#1e293b] text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        Public
                    </button>
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
