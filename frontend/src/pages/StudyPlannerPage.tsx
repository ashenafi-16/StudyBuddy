import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar, Plus, Video, Clock, Users, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Loading, ErrorMessage } from '../components/common/LoadingError';
import SessionModal from '../components/planner/SessionModal';
import '../styles/fullcalendar.css';

import {
    fetchCalendarEvents,
    fetchUpcomingSessions,
    type CalendarEvent,
    type StudySession
} from '../api/plannerApi';

export default function StudyPlannerPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [upcomingSessions, setUpcomingSessions] = useState<StudySession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [showUpcoming, setShowUpcoming] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [calendarEvents, upcoming] = await Promise.all([
                fetchCalendarEvents(),
                fetchUpcomingSessions()
            ]);
            setEvents(calendarEvents);
            setUpcomingSessions(upcoming);
        } catch (err: any) {
            setError(err.message || 'Failed to load sessions');
        } finally {
            setLoading(false);
        }
    };

    const handleDateClick = (info: any) => {
        setSelectedDate(new Date(info.dateStr));
        setSelectedEvent(null);
        setShowModal(true);
    };

    const handleEventClick = (info: any) => {
        const event = events.find(e => e.id === info.event.id);
        if (event) {
            setSelectedEvent(event);
            setShowModal(true);
        }
    };

    const handleJoinMeeting = (meetingUrl: string) => {
        window.open(meetingUrl, '_blank');
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedDate(null);
        setSelectedEvent(null);
    };

    const handleSessionCreated = () => {
        handleModalClose();
        loadData();
    };

    if (loading) return <Loading />;
    if (error) return <ErrorMessage error={error} />;

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            in_progress: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            completed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
            cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
        return styles[status] || styles.scheduled;
    };

    return (
        <div className="p-3 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 mb-1 sm:mb-2">
                            <Calendar className="text-blue-400" size={28} />
                            Study Planner
                        </h1>
                        <p className="text-slate-400 text-sm sm:text-base">Schedule study sessions and join video meetings with your buddies.</p>
                    </div>
                    <button
                        onClick={() => { setSelectedDate(new Date()); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/25 font-medium text-sm sm:text-base w-full sm:w-auto justify-center"
                    >
                        <Plus size={20} />
                        New Session
                    </button>
                </div>

                {/* Mobile: Collapsible Upcoming Sessions */}
                <div className="lg:hidden">
                    <button
                        onClick={() => setShowUpcoming(!showUpcoming)}
                        className="w-full flex items-center justify-between bg-[#1e293b] rounded-xl border border-slate-700/50 p-4"
                    >
                        <span className="flex items-center gap-2 text-white font-semibold text-sm">
                            <Clock className="text-emerald-400" size={18} />
                            Upcoming Sessions
                            {upcomingSessions.length > 0 && (
                                <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">{upcomingSessions.length}</span>
                            )}
                        </span>
                        {showUpcoming ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </button>
                    {showUpcoming && (
                        <div className="mt-2 space-y-2">
                            {renderSessionsList(upcomingSessions, handleJoinMeeting, getStatusBadge)}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">

                    {/* Calendar */}
                    <div className="lg:col-span-3 bg-[#1e293b] rounded-2xl border border-slate-700/50 p-3 sm:p-6">
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay'
                            }}
                            events={events}
                            dateClick={handleDateClick}
                            eventClick={handleEventClick}
                            height="auto"
                            eventDisplay="block"
                            dayMaxEvents={3}
                            nowIndicator={true}
                            selectable={true}
                            eventClassNames="cursor-pointer"
                        />
                    </div>

                    {/* Desktop Sidebar */}
                    <div className="hidden lg:block lg:col-span-1 space-y-4">
                        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-5">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Clock className="text-emerald-400" size={20} />
                                Upcoming Sessions
                            </h3>
                            {renderSessionsList(upcomingSessions, handleJoinMeeting, getStatusBadge)}
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-5">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Users className="text-purple-400" size={20} />
                                Quick Stats
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">This Week</span>
                                    <span className="text-white font-semibold">{upcomingSessions.length} sessions</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">Total Hours</span>
                                    <span className="text-white font-semibold">
                                        {Math.round(upcomingSessions.reduce((acc, s) => {
                                            const start = new Date(s.start_time).getTime();
                                            const end = new Date(s.end_time).getTime();
                                            return acc + (end - start) / (1000 * 60 * 60);
                                        }, 0))}h
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Session Modal */}
            {showModal && (
                <SessionModal
                    isOpen={showModal}
                    onClose={handleModalClose}
                    onSuccess={handleSessionCreated}
                    selectedDate={selectedDate}
                    existingEvent={selectedEvent}
                />
            )}
        </div>
    );
}

// Extracted session list render to reuse between mobile and desktop
function renderSessionsList(
    sessions: StudySession[],
    handleJoinMeeting: (url: string) => void,
    getStatusBadge: (status: string) => string
) {
    if (sessions.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                <Calendar size={36} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">No upcoming sessions</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {sessions.map((session) => (
                <div
                    key={session.id}
                    className={`p-3 sm:p-4 bg-slate-800/50 rounded-xl border transition-all ${session.status === 'in_progress'
                        ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                        : 'border-slate-700/30 hover:border-slate-600'
                        }`}
                >
                    <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-white text-sm">{session.title}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getStatusBadge(session.status)}`}>
                            {session.status.replace('_', ' ')}
                        </span>
                    </div>
                    {session.study_group && (
                        <p className="text-xs text-blue-400 mb-1 flex items-center gap-1">
                            <Users size={10} />
                            {session.study_group.group_name}
                        </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                        <Clock size={12} />
                        {new Date(session.start_time).toLocaleDateString()} at{' '}
                        {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {/* Always show the join button if meeting URL exists */}
                    {session.meeting_url ? (
                        <button
                            onClick={() => handleJoinMeeting(session.meeting_url)}
                            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                session.status === 'in_progress' || session.is_active
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                            }`}
                        >
                            {session.status === 'in_progress' || session.is_active ? (
                                <><Video size={14} /> Join Meeting</>
                            ) : (
                                <><ExternalLink size={14} /> Open Meeting Room</>
                            )}
                        </button>
                    ) : (
                        <button
                            disabled
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-slate-400 rounded-lg text-sm cursor-not-allowed"
                        >
                            <Video size={14} />
                            No Meeting Link
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
