import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Video, Play, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    createSession,
    updateSession,
    deleteSession,
    cancelSession,
    startSession,
    fetchMyGroups,
    type CalendarEvent,
    type CreateSessionData,
    type StudyGroupMinimal
} from '../../api/plannerApi';
import { useAuth } from '../../contexts/AuthContext';

interface SessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedDate: Date | null;
    existingEvent: CalendarEvent | null;
}

export default function SessionModal({
    isOpen,
    onClose,
    onSuccess,
    selectedDate,
    existingEvent
}: SessionModalProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [studyGroupId, setStudyGroupId] = useState<number | null>(null);
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState<StudyGroupMinimal[]>([]);
    const [groupsLoading, setGroupsLoading] = useState(true);

    const isEditMode = !!existingEvent;
    const isHost = existingEvent?.extendedProps?.host?.id === user?.id;
    const status = existingEvent?.extendedProps?.status;

    useEffect(() => {
        loadGroups();
    }, []);

    useEffect(() => {
        if (existingEvent) {
            setTitle(existingEvent.title);
            setStudyGroupId(existingEvent.extendedProps.study_group?.id ?? null);
            setDescription(existingEvent.extendedProps.description || '');
            setStartTime(formatDateTimeLocal(existingEvent.start));
            setEndTime(formatDateTimeLocal(existingEvent.end));
        } else if (selectedDate) {
            const date = selectedDate.toISOString().split('T')[0];
            setStartTime(`${date}T09:00`);
            setEndTime(`${date}T10:00`);
        }
    }, [existingEvent, selectedDate]);

    const loadGroups = async () => {
        try {
            setGroupsLoading(true);
            const myGroups = await fetchMyGroups();
            setGroups(myGroups);
        } catch (err) {
            console.error('Failed to load groups:', err);
        } finally {
            setGroupsLoading(false);
        }
    };

    const formatDateTimeLocal = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toISOString().slice(0, 16);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !startTime || !endTime) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);

            const sessionData: CreateSessionData = {
                title: title.trim(),
                description: description.trim(),
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString(),
                study_group_id: studyGroupId
            };

            if (isEditMode) {
                await updateSession(parseInt(existingEvent!.id), sessionData);
                toast.success('Session updated successfully!');
            } else {
                await createSession(sessionData);
                toast.success('Session created successfully!');
            }

            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to save session');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!existingEvent) return;

        if (!confirm('Are you sure you want to delete this session?')) return;

        try {
            setLoading(true);
            await deleteSession(parseInt(existingEvent.id));
            toast.success('Session deleted successfully!');
            onSuccess();
        } catch (err: any) {
            toast.error('Failed to delete session');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!existingEvent) return;

        try {
            setLoading(true);
            await cancelSession(parseInt(existingEvent.id));
            toast.success('Session cancelled!');
            onSuccess();
        } catch (err: any) {
            toast.error('Failed to cancel session');
        } finally {
            setLoading(false);
        }
    };

    const handleStartMeeting = async () => {
        if (!existingEvent) return;

        try {
            setLoading(true);
            const updatedSession = await startSession(parseInt(existingEvent.id));
            toast.success('Meeting started!');
            // Open the Jitsi meeting in a new tab with user's display name
            const displayName = user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.username || 'Student';
            const meetingUrl = updatedSession.meeting_url.includes('#')
                ? `${updatedSession.meeting_url}&userInfo.displayName=${encodeURIComponent(displayName)}`
                : `${updatedSession.meeting_url}#userInfo.displayName=${encodeURIComponent(displayName)}`;
            window.open(meetingUrl, '_blank');
            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to start meeting');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinMeeting = () => {
        if (existingEvent?.extendedProps.meeting_url) {
            const displayName = user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.username || 'Student';
            const baseUrl = existingEvent.extendedProps.meeting_url;
            const meetingUrl = baseUrl.includes('#')
                ? `${baseUrl}&userInfo.displayName=${encodeURIComponent(displayName)}`
                : `${baseUrl}#userInfo.displayName=${encodeURIComponent(displayName)}`;
            window.open(meetingUrl, '_blank');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 w-full max-w-lg shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="text-blue-400" size={24} />
                        {isEditMode ? 'Session Details' : 'New Study Session'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="text-slate-400" size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Session Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Chemistry Study Session"
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                            required
                        />
                    </div>

                    {/* Study Group Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <Users size={14} className="inline mr-1" />
                            Study Group
                        </label>
                        {groupsLoading ? (
                            <div className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-500 text-sm">
                                Loading groups...
                            </div>
                        ) : (
                            <select
                                value={studyGroupId || ''}
                                onChange={(e) => setStudyGroupId(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                            >
                                <option value="">Select a study group (optional)</option>
                                {groups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.group_name}
                                    </option>
                                ))}
                            </select>
                        )}
                        {groups.length === 0 && !groupsLoading && (
                            <p className="text-xs text-slate-500 mt-1">
                                You haven't joined any groups yet. Create or join a group first.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What topics will you cover?"
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                <Clock size={14} className="inline mr-1" />
                                Start Time *
                            </label>
                            <input
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                <Clock size={14} className="inline mr-1" />
                                End Time *
                            </label>
                            <input
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* Meeting Controls (for existing events) */}
                    {isEditMode && status === 'scheduled' && isHost && (
                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                            <p className="text-blue-400 text-sm mb-3 font-medium">📅 Session is scheduled</p>
                            <button
                                type="button"
                                onClick={handleStartMeeting}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                            >
                                <Play size={18} />
                                Start Meeting
                            </button>
                        </div>
                    )}

                    {isEditMode && status === 'in_progress' && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                            <p className="text-emerald-400 text-sm mb-3 font-medium flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                Meeting is live!
                            </p>
                            <button
                                type="button"
                                onClick={handleJoinMeeting}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all"
                            >
                                <Video size={18} />
                                Join Video Meeting
                            </button>
                        </div>
                    )}

                    {isEditMode && existingEvent?.extendedProps.is_active && status !== 'in_progress' && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                            <p className="text-emerald-400 text-sm mb-3 font-medium">🟢 Session is active!</p>
                            <button
                                type="button"
                                onClick={handleJoinMeeting}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all"
                            >
                                <Video size={18} />
                                Join Video Meeting
                            </button>
                        </div>
                    )}

                    {isEditMode && status === 'completed' && (
                        <div className="p-4 bg-slate-500/10 border border-slate-500/30 rounded-xl">
                            <p className="text-slate-400 text-sm font-medium">✅ This session has been completed</p>
                        </div>
                    )}

                    {isEditMode && status === 'cancelled' && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                            <p className="text-red-400 text-sm font-medium">❌ This session was cancelled</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        {isEditMode && status === 'scheduled' && isHost && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="flex-1 px-4 py-3 bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 rounded-xl font-medium transition-all"
                                    disabled={loading}
                                >
                                    Cancel Session
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="px-4 py-3 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-xl font-medium transition-all"
                                    disabled={loading}
                                >
                                    Delete
                                </button>
                            </>
                        )}
                        {(!isEditMode || (status === 'scheduled' && isHost)) && (
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : isEditMode ? 'Update Session' : 'Create Session'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
