import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    createSession,
    updateSession,
    deleteSession,
    cancelSession,
    type CalendarEvent,
    type CreateSessionData
} from '../../api/plannerApi';

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
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [loading, setLoading] = useState(false);

    const isEditMode = !!existingEvent;

    useEffect(() => {
        if (existingEvent) {
            setTitle(existingEvent.title);
            setSubject(existingEvent.extendedProps.subject);
            setDescription(existingEvent.extendedProps.description || '');
            setStartTime(formatDateTimeLocal(existingEvent.start));
            setEndTime(formatDateTimeLocal(existingEvent.end));
        } else if (selectedDate) {
            const date = selectedDate.toISOString().split('T')[0];
            setStartTime(`${date}T09:00`);
            setEndTime(`${date}T10:00`);
        }
    }, [existingEvent, selectedDate]);

    const formatDateTimeLocal = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toISOString().slice(0, 16);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !subject.trim() || !startTime || !endTime) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);

            const sessionData: CreateSessionData = {
                title: title.trim(),
                subject: subject.trim(),
                description: description.trim(),
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString()
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

    const handleJoinMeeting = () => {
        if (existingEvent?.extendedProps.meeting_url) {
            window.open(existingEvent.extendedProps.meeting_url, '_blank');
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
                        {isEditMode ? 'Edit Session' : 'New Study Session'}
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

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Subject *
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g., Organic Chemistry"
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                            required
                        />
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

                    {/* Meeting Info (for existing events) */}
                    {isEditMode && existingEvent?.extendedProps.is_active && (
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

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        {isEditMode && (
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
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : isEditMode ? 'Update Session' : 'Create Session'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
