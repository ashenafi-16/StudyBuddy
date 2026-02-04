import { useState, useEffect, useRef } from 'react';
import {
    Timer, Play, Pause, RotateCcw,
    Volume2, VolumeX, Lock, SkipForward, Settings, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Loading } from '../components/common/LoadingError';
import { useAuth } from '../contexts/AuthContext';
import { usePomodoroContext } from '../contexts/PomodoroContext';
import { usePopupNotification, NotificationHelpers } from '../components/common/PopupNotification';
import { fetchGroups, type StudyGroup } from '../api/groupsApi';
import {
    fetchPomodoroByGroup,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    nextPhase,
    updatePomodoroSettings,
    formatTime,
    type PomodoroSession
} from '../api/pomodoroApi';

export default function PomodoroTimerPage() {
    const [groups, setGroups] = useState<StudyGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
    const [session, setSession] = useState<PomodoroSession | null>(null);
    const [hasJoinedLocal, setHasJoinedLocal] = useState(true);
    const [loading, setLoading] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Client-side movement state
    const [displayTime, setDisplayTime] = useState(1500);
    const [progress, setProgress] = useState(0);

    const { isPremium } = useAuth();
    const { setActiveSession } = usePomodoroContext();
    const { showNotification } = usePopupNotification();
    const tickIntervalRef = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastNotifiedPhaseRef = useRef<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // ─────────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        loadGroups();
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        return () => {
            stopTick();
            wsRef.current?.close();
        };
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            setSession(null);
            loadSession(selectedGroup.id);
            setupWebSocket(selectedGroup.id);
        }
        return () => wsRef.current?.close();
    }, [selectedGroup]);

    // Sync session state to global context for navbar indicator
    useEffect(() => {
        if (session && session.state !== 'idle') {
            setActiveSession(session, selectedGroup?.group_name || null);
        } else {
            setActiveSession(null, null);
        }
    }, [session, selectedGroup, setActiveSession]);

    // ─────────────────────────────────────────────────────────────────────────
    // WebSocket Setup
    // ─────────────────────────────────────────────────────────────────────────

    const setupWebSocket = (groupId: number) => {
        wsRef.current?.close();
        const ws = new WebSocket(`ws://127.0.0.1:8000/ws/pomodoro/${groupId}/?token=${localStorage.getItem('token')}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);

            if (msg.type === 'timer_update' || msg.type === 'timer_state') {
                setSession(msg.data);

                // Handle forced sync mode
                if (msg.sync_mode === 'forced' || msg.data?.is_leader) {
                    setHasJoinedLocal(true);
                }

                // Show popup notifications to members when leader performs actions
                // Only show if this user is NOT the one who triggered the action
                if (msg.action && msg.type === 'timer_update') {
                    const currentUsername = msg.data?.current_user_name || '';

                    // Check if action was triggered by someone else
                    if (msg.action === 'started' && msg.started_by && msg.started_by !== currentUsername) {
                        showNotification(NotificationHelpers.pomodoroStart(msg.started_by));
                    } else if (msg.action === 'paused' && msg.paused_by && msg.paused_by !== currentUsername) {
                        showNotification(NotificationHelpers.pomodoroPause(msg.paused_by));
                    } else if (msg.action === 'resumed' && msg.resumed_by && msg.resumed_by !== currentUsername) {
                        showNotification(NotificationHelpers.pomodoroResume(msg.resumed_by));
                    } else if (msg.action === 'reset' && msg.reset_by && msg.reset_by !== currentUsername) {
                        showNotification(NotificationHelpers.pomodoroReset());
                    } else if (msg.action === 'next_phase' && msg.advanced_by && msg.advanced_by !== currentUsername) {
                        showNotification({
                            type: 'info',
                            title: 'Phase Changed',
                            message: `${msg.advanced_by} skipped to next phase`,
                            duration: 3000,
                        });
                    }
                }
            } else if (msg.type === 'timer_invitation') {
                setSession(msg.data);

                // Flexible mode - show invitation for non-leaders
                if (!msg.data?.is_leader) {
                    setHasJoinedLocal(false);
                    const startedBy = msg.started_by || 'Leader';
                    showNotification(NotificationHelpers.sessionInvitation(startedBy, () => {
                        setHasJoinedLocal(true);
                    }));
                }
            } else if (msg.type === 'flexible_notification') {
                // FLEXIBLE mode: Someone started their personal timer - notify others
                const username = msg.data?.username || 'A member';
                const message = msg.data?.message || `${username} started a Pomodoro timer`;

                // Don't show notification to the user who triggered it
                const currentUsername = session?.current_user_name;
                if (username !== currentUsername) {
                    showNotification({
                        type: 'info',
                        title: '🍅 Study Session',
                        message: message,
                        duration: 5000,
                    });
                }
            } else if (msg.type === 'error') {
                showNotification({
                    type: 'error',
                    title: 'Error',
                    message: msg.message,
                    duration: 4000,
                });
            }
        };
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Timer Movement Loop
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!session) return;

        const updateMovement = () => {
            const isRunningSync = session.state === 'running' && session.phase_start && hasJoinedLocal;

            if (isRunningSync) {
                const start = new Date(session.phase_start!).getTime();
                const now = Date.now();
                const elapsed = (now - start) / 1000;
                const remaining = Math.max(0, session.phase_duration - elapsed);

                setDisplayTime(Math.ceil(remaining));
                const prog = ((session.phase_duration - remaining) / session.phase_duration) * 100;
                setProgress(Math.min(100, prog));

                if (remaining <= 0) {
                    const phaseKey = `${session.id}-${session.phase}-${session.current_session_number}`;
                    if (Math.abs(remaining) < 1 && lastNotifiedPhaseRef.current !== phaseKey) {
                        lastNotifiedPhaseRef.current = phaseKey;
                        playSound();
                        showNotification(NotificationHelpers.pomodoroComplete(session.phase));
                        loadSession(session.group);
                    }
                }
            } else if (session.state === 'paused' && hasJoinedLocal) {
                const remaining = session.remaining_seconds_at_pause || 0;
                setDisplayTime(remaining);
                const prog = ((session.phase_duration - remaining) / session.phase_duration) * 100;
                setProgress(prog);
            } else {
                let duration = session.work_duration;
                if (session.phase === 'short_break') duration = session.break_duration;
                if (session.phase === 'long_break') duration = session.long_break_duration;
                setDisplayTime(duration);
                setProgress(0);
            }
        };

        updateMovement();

        if (session.state === 'running' && hasJoinedLocal) {
            stopTick();
            tickIntervalRef.current = window.setInterval(updateMovement, 200);
        } else {
            stopTick();
        }

    }, [session, hasJoinedLocal]);

    const stopTick = () => {
        if (tickIntervalRef.current) {
            clearInterval(tickIntervalRef.current);
            tickIntervalRef.current = null;
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Data Loading
    // ─────────────────────────────────────────────────────────────────────────

    const loadGroups = async () => {
        try {
            const data = await fetchGroups();
            setGroups(data);
            if (data.length > 0) setSelectedGroup(data[0]);
        } catch (err: any) {
            console.log('No groups found:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadSession = async (groupId: number) => {
        try {
            const data = await fetchPomodoroByGroup(groupId);
            setSession(data);

            if (data.sync_mode === 'forced' || data.is_leader) {
                setHasJoinedLocal(true);
            } else if (data.state === 'running') {
                setHasJoinedLocal(false);
            }
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 403) {
                setSession(null);
                setHasJoinedLocal(false);
            }
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Actions
    // ─────────────────────────────────────────────────────────────────────────

    const handleToggleSyncMode = async () => {
        if (!session) return;
        const newMode = session.sync_mode === 'forced' ? 'flexible' : 'forced';
        try {
            const updated = await updatePomodoroSettings(session.id, { sync_mode: newMode } as any);
            setSession(updated);
            showNotification({
                type: 'success',
                title: 'Sync Mode Updated',
                message: `Changed to ${newMode === 'forced' ? 'Strict' : 'Flexible'} mode`,
                duration: 3000,
            });
        } catch (err) {
            showNotification({ type: 'error', title: 'Failed', message: 'Could not change sync mode', duration: 3000 });
        }
    };

    const playSound = () => {
        if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(console.error);
        }
    };

    const handleStart = async () => {
        if (!session) return;
        try {
            console.log("sesssion id: ", session)
            const updated = await startTimer(session.id);
            setSession(updated);
        } catch (err: any) {
            showNotification({ type: 'error', title: 'Failed to Start', message: err.response?.data?.error || 'Unknown error', duration: 4000 });
        }
    };

    const handlePause = async () => {
        if (!session) return;
        try {
            const updated = await pauseTimer(session.id);
            setSession(updated);
        } catch (err) {
            showNotification({ type: 'error', title: 'Failed to Pause', duration: 3000 });
        }
    };

    const handleResume = async () => {
        if (!session) return;
        try {
            const updated = await resumeTimer(session.id);
            setSession(updated);
        } catch (err: any) {
            showNotification({ type: 'error', title: 'Failed to Resume', message: err.response?.data?.error || '', duration: 4000 });
        }
    };

    const handleReset = async () => {
        if (!session) return;
        try {
            const updated = await resetTimer(session.id);
            setSession(updated);
        } catch (err) {
            showNotification({ type: 'error', title: 'Failed to Reset', duration: 3000 });
        }
    };

    const handleNextPhase = async () => {
        if (!session) return;
        try {
            const updated = await nextPhase(session.id);
            setSession(updated);
            showNotification({ type: 'info', title: 'Phase Skipped', message: 'Moved to next phase', duration: 3000 });
        } catch (err) {
            showNotification({ type: 'error', title: 'Failed to Skip', duration: 3000 });
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // UI Helpers
    // ─────────────────────────────────────────────────────────────────────────

    const getStatusText = () => {
        if (!session) return 'Loading...';
        if (session.state === 'paused') return '⏸️ Paused';
        switch (session.phase) {
            case 'work': return '🎯 Focus Time';
            case 'short_break': return '☕ Short Break';
            case 'long_break': return '🧘 Long Break';
            default: return 'Ready';
        }
    };

    const getStatusColor = () => {
        if (!session) return 'text-slate-400';
        if (session.state === 'paused') return 'text-orange-400';
        switch (session.phase) {
            case 'work': return 'text-blue-400';
            case 'short_break': return 'text-emerald-400';
            case 'long_break': return 'text-purple-400';
            default: return 'text-slate-400';
        }
    };

    const getPhaseGradient = () => {
        if (!session) return ['#3b82f6', '#6366f1'];
        switch (session.phase) {
            case 'work': return ['#3b82f6', '#6366f1'];
            case 'short_break': return ['#10b981', '#14b8a6'];
            case 'long_break': return ['#8b5cf6', '#a855f7'];
            default: return ['#3b82f6', '#6366f1'];
        }
    };

    if (loading) return <Loading />;

    const [gradientStart, gradientEnd] = getPhaseGradient();

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3 mb-2">
                        <Timer className="text-red-400" size={32} />
                        Pomodoro Timer
                    </h1>
                    <p className="text-slate-400">Stay focused with timed work sessions.</p>
                </div>

                {/* Sync Mode Toggle - ONLY visible to group creator */}
                {session?.is_creator && (
                    <div className="flex justify-center">
                        <div className="bg-[#1e293b] rounded-xl p-3 border border-slate-700 flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Settings size={16} className="text-slate-400" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Sync Mode</span>
                                    <span className="text-sm text-white font-medium">
                                        {session.sync_mode === 'forced' ? 'Strict (All Members)' : 'Flexible (Optional)'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={handleToggleSyncMode}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${session.sync_mode === 'forced'
                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20'
                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
                                    }`}
                            >
                                Switch to {session.sync_mode === 'forced' ? 'Flexible' : 'Strict'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Group Selector */}
                {groups.length > 0 && (
                    <div className="flex justify-center">
                        <div className="bg-[#1e293b] rounded-xl p-1 border border-slate-700 inline-flex gap-1 flex-wrap justify-center">
                            {groups.map(group => (
                                <button
                                    key={group.id}
                                    onClick={() => setSelectedGroup(group)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${selectedGroup?.id === group.id
                                        ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                        }`}
                                >
                                    <Users size={14} />
                                    {group.group_name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timer Circle */}
                <div className="relative flex flex-col items-center">
                    {!isPremium && (
                        <div className="absolute top-0 right-0 z-10">
                            <Link to="/subscription" className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20 hover:bg-amber-500/20 transition-all">
                                <Lock size={12} /> PRO
                            </Link>
                        </div>
                    )}

                    <div className="relative w-72 h-72 sm:w-80 sm:h-80">
                        {/* Join Overlay for Flexible Mode */}
                        {!hasJoinedLocal && session?.state === 'running' && (
                            <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm rounded-full flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-blue-500/30">
                                <Play className="text-blue-400 mb-4 animate-pulse" size={48} />
                                <h4 className="text-white font-bold mb-2">Study Session in Progress</h4>
                                <p className="text-slate-400 text-sm mb-4">The leader has started the timer. Ready to join?</p>
                                <button
                                    onClick={() => setHasJoinedLocal(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold text-sm transition-all"
                                >
                                    Join Now
                                </button>
                            </div>
                        )}

                        {/* Progress Ring */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="50%"
                                cy="50%"
                                r="45%"
                                fill="none"
                                stroke="#334155"
                                strokeWidth="8"
                            />
                            <circle
                                cx="50%"
                                cy="50%"
                                r="45%"
                                fill="none"
                                stroke="url(#timerGradient)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 45}%`}
                                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}%`}
                                className="transition-all duration-1000 ease-linear"
                            />
                            <defs>
                                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor={gradientStart} />
                                    <stop offset="100%" stopColor={gradientEnd} />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Timer Display */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-6xl sm:text-7xl font-bold text-white font-mono tracking-tight">
                                {formatTime(displayTime)}
                            </span>
                            <span className={`text-lg mt-2 ${getStatusColor()}`}>{getStatusText()}</span>
                            <span className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                Session {session?.current_session_number || 1}
                                {session?.is_leader ? (
                                    <span className="bg-blue-500/10 text-blue-400 text-[10px] px-1.5 py-0.5 rounded border border-blue-500/20 font-bold uppercase tracking-wider">Leader</span>
                                ) : (
                                    <span className="bg-slate-500/10 text-slate-400 text-[10px] px-1.5 py-0.5 rounded border border-slate-500/20 font-bold uppercase tracking-wider">Member</span>
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4 flex-wrap">
                    {/* 
                        Control Logic:
                        - Leader: always has full control
                        - Non-leader + Flexible mode: can control their own timer
                        - Non-leader + Strict mode: cannot control (follows leader)
                    */}
                    {(() => {
                        const isLeader = session?.is_leader;
                        const isFlexible = session?.sync_mode === 'flexible';
                        const canControl = isLeader || isFlexible;
                        const canPause = isLeader || isFlexible || session?.allow_member_pause;

                        return (
                            <>
                                {session?.state === 'idle' && (
                                    <button
                                        onClick={handleStart}
                                        disabled={!canControl}
                                        className={`flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-semibold text-lg transition-all shadow-lg shadow-blue-500/25 ${!canControl ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/40'}`}
                                        title={!canControl ? "In strict mode, only leaders can start" : ""}
                                    >
                                        <Play size={24} fill="white" />
                                        Start Focus
                                    </button>
                                )}

                                {session?.state === 'running' && (
                                    <button
                                        onClick={handlePause}
                                        disabled={!canPause}
                                        className={`flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl font-semibold text-lg transition-all shadow-lg shadow-orange-500/25 ${!canPause ? 'opacity-50 cursor-not-allowed' : 'hover:from-orange-700 hover:to-amber-700'}`}
                                        title={!canPause ? "In strict mode, only leaders can pause" : ""}
                                    >
                                        <Pause size={24} />
                                        Pause
                                    </button>
                                )}

                                {session?.state === 'paused' && (
                                    <button
                                        onClick={handleResume}
                                        disabled={!canPause}
                                        className={`flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl font-semibold text-lg transition-all shadow-lg shadow-emerald-500/25 ${!canPause ? 'opacity-50 cursor-not-allowed' : 'hover:from-emerald-700 hover:to-teal-700'}`}
                                        title={!canPause ? "In strict mode, only leaders can resume" : ""}
                                    >
                                        <Play size={24} fill="white" />
                                        Resume
                                    </button>
                                )}

                                {session?.state !== 'idle' && (
                                    <button
                                        onClick={handleNextPhase}
                                        disabled={!isLeader}
                                        className={`flex items-center gap-2 px-6 py-4 bg-slate-700 rounded-2xl font-semibold transition-all ${!isLeader ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-600'}`}
                                        title={!isLeader ? "Only leaders can skip phases" : "Skip to next phase"}
                                    >
                                        <SkipForward size={20} />
                                    </button>
                                )}

                                <button
                                    onClick={handleReset}
                                    disabled={!canControl}
                                    className={`flex items-center gap-2 px-6 py-4 bg-slate-700 rounded-2xl font-semibold transition-all ${!canControl ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-600'}`}
                                    title={!canControl ? "In strict mode, only leaders can reset" : ""}
                                >
                                    <RotateCcw size={20} />
                                    Reset
                                </button>
                            </>
                        );
                    })()}

                    <button
                        onClick={() => {
                            if (!isPremium) {
                                showNotification({ type: 'warning', title: 'Premium Required', message: 'Custom sounds require a premium subscription', duration: 4000 });
                                return;
                            }
                            setSoundEnabled(!soundEnabled);
                        }}
                        className={`p-4 rounded-2xl transition-all relative ${soundEnabled ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-800 text-slate-500'} ${!isPremium ? 'opacity-75' : ''}`}
                    >
                        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        {!isPremium && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 rounded-full p-0.5">
                                <Lock size={10} strokeWidth={3} />
                            </div>
                        )}
                    </button>
                </div>

                {/* How it works */}
                <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">How Pomodoro Works</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <span className="text-blue-400 font-bold">1</span>
                            </div>
                            <p className="text-sm text-slate-400">Focus for 25 minutes</p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <span className="text-emerald-400 font-bold">2</span>
                            </div>
                            <p className="text-sm text-slate-400">Take a 5-min break</p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <span className="text-purple-400 font-bold">3</span>
                            </div>
                            <p className="text-sm text-slate-400">Repeat 4 times</p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <span className="text-orange-400 font-bold">4</span>
                            </div>
                            <p className="text-sm text-slate-400">15-min long break</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
