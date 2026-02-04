import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar, Plus, Video, Clock, Users, Sparkles, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Loading, ErrorMessage } from '../components/common/LoadingError';
import { useAuth } from '../contexts/AuthContext';
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
    const { isPremium } = useAuth();

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

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                            <Calendar className="text-blue-400" size={32} />
                            Study Planner
                        </h1>
                        <p className="text-slate-400">Schedule study sessions and join video meetings with your buddies.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                if (!isPremium) {
                                    toast.error("Premium subscription required for AI Study Planning");
                                    return;
                                }
                                toast.success("AI is analyzing your schedule...");
                            }}
                            className={`flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/25 font-medium relative ${!isPremium ? 'opacity-75' : ''}`}
                        >
                            <Sparkles size={20} />
                            Generate AI Plan
                            {!isPremium && (
                                <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 rounded-full p-0.5">
                                    <Lock size={10} strokeWidth={3} />
                                </div>
                            )}
                        </button>
                        <button
                            onClick={() => { setSelectedDate(new Date()); setShowModal(true); }}
                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/25 font-medium"
                        >
                            <Plus size={20} />
                            New Session
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* Calendar */}
                    <div className="lg:col-span-3 bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
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

                    {/* Upcoming Sessions Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-5">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Clock className="text-emerald-400" size={20} />
                                Upcoming Sessions
                            </h3>

                            {upcomingSessions.length > 0 ? (
                                <div className="space-y-3">
                                    {upcomingSessions.map((session) => (
                                        <div
                                            key={session.id}
                                            className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30 hover:border-slate-600 transition-all"
                                        >
                                            <h4 className="font-semibold text-white text-sm mb-1">{session.title}</h4>
                                            <p className="text-xs text-slate-400 mb-2">{session.subject}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                                <Clock size={12} />
                                                {new Date(session.start_time).toLocaleDateString()} at{' '}
                                                {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>

                                            {session.is_active ? (
                                                <button
                                                    onClick={() => handleJoinMeeting(session.meeting_url)}
                                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-all animate-pulse"
                                                >
                                                    <Video size={14} />
                                                    Join Meeting
                                                </button>
                                            ) : (
                                                <button
                                                    disabled
                                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-slate-400 rounded-lg text-sm cursor-not-allowed"
                                                >
                                                    <Video size={14} />
                                                    Not Active Yet
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <Calendar size={40} className="mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">No upcoming sessions</p>
                                </div>
                            )}
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
