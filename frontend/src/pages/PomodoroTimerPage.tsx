import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Timer, Play, Pause, RotateCcw,
    Volume2, VolumeX, Users, Coffee, BookOpen, Settings, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Loading, ErrorMessage } from '../components/common/LoadingError';
import { useAuth } from '../contexts/AuthContext';
import { fetchGroups, type StudyGroup } from '../api/groupsApi';
import { formatTime } from '../api/pomodoroApi';

export default function PomodoroTimerPage() {
    const [groups, setGroups] = useState<StudyGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const { isPremium } = useAuth();

    // Timer state
    const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused' | 'break'>(() => {
        const saved = localStorage.getItem('pomodoro_state');
        return saved ? (JSON.parse(saved).timerState as any) : 'idle';
    });
    const [remainingSeconds, setRemainingSeconds] = useState(() => {
        const saved = localStorage.getItem('pomodoro_state');
        if (saved) {
            const { remainingSeconds, lastUpdated, timerState } = JSON.parse(saved);
            if (timerState === 'running' || timerState === 'break') {
                const elapsedSinceLastUpdate = Math.floor((Date.now() - lastUpdated) / 1000);
                return Math.max(0, remainingSeconds - elapsedSinceLastUpdate);
            }
            return remainingSeconds;
        }
        return 1500; // 25 minutes
    });
    const [currentSession, setCurrentSession] = useState(() => {
        const saved = localStorage.getItem('pomodoro_state');
        return saved ? JSON.parse(saved).currentSession : 1;
    });
    const [workDuration] = useState(1500); // 25 minutes
    const [breakDuration] = useState(300); // 5 minutes
    const [longBreakDuration] = useState(900); // 15 minutes

    const tickIntervalRef = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Load groups on mount
    useEffect(() => {
        loadGroups();
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

        // If timer was running, restart the interval immediately if it ended during refresh
        if (remainingSeconds === 0 && (timerState === 'running' || timerState === 'break')) {
            // The tick logic in the useEffect for timerState will handle transition
        }

        return () => {
            if (tickIntervalRef.current) {
                clearInterval(tickIntervalRef.current);
            }
        };
    }, []);

    // Persist state to localStorage
    useEffect(() => {
        if (timerState !== 'idle' || remainingSeconds !== workDuration || currentSession !== 1) {
            localStorage.setItem('pomodoro_state', JSON.stringify({
                timerState,
                remainingSeconds,
                currentSession,
                lastUpdated: Date.now()
            }));
        }
    }, [timerState, remainingSeconds, currentSession, workDuration]);

    const loadGroups = async () => {
        try {
            const data = await fetchGroups();
            setGroups(data);
            if (data.length > 0) {
                setSelectedGroup(data[0]);
            }
        } catch (err: any) {
            // Don't show error if no groups - timer works without groups
            console.log('No groups found:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const playSound = useCallback(() => {
        if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(console.error);
        }
    }, [soundEnabled]);

    const startTick = useCallback(() => {
        if (tickIntervalRef.current) return;

        tickIntervalRef.current = window.setInterval(() => {
            setRemainingSeconds(prev => {
                if (prev <= 1) {
                    // Timer completed
                    if (tickIntervalRef.current) {
                        clearInterval(tickIntervalRef.current);
                        tickIntervalRef.current = null;
                    }

                    // Handle session completion
                    setTimerState(currentState => {
                        if (currentState === 'running') {
                            playSound();
                            toast.success('🎉 Work session complete! Time for a break!', { duration: 5000 });
                            // Start break
                            const isLongBreak = currentSession % 4 === 0;
                            setRemainingSeconds(isLongBreak ? longBreakDuration : breakDuration);
                            return 'break';
                        } else if (currentState === 'break') {
                            playSound();
                            toast.success('☕ Break over! Ready for the next session?', { duration: 5000 });
                            setCurrentSession(prev => prev + 1);
                            setRemainingSeconds(workDuration);
                            return 'idle';
                        }
                        return currentState;
                    });

                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [playSound, currentSession, workDuration, breakDuration, longBreakDuration]);

    const stopTick = useCallback(() => {
        if (tickIntervalRef.current) {
            clearInterval(tickIntervalRef.current);
            tickIntervalRef.current = null;
        }
    }, []);

    // Effect to manage timer based on state
    useEffect(() => {
        if (timerState === 'running' || timerState === 'break') {
            startTick();
        } else {
            stopTick();
        }

        return () => stopTick();
    }, [timerState, startTick, stopTick]);

    const handleStart = () => {
        setTimerState('running');
        toast.success('🎯 Focus session started!');
    };

    const handlePause = () => {
        setTimerState('paused');
    };

    const handleResume = () => {
        setTimerState(prev => prev === 'paused' ? 'running' : prev);
    };

    const handleReset = () => {
        stopTick();
        setTimerState('idle');
        setRemainingSeconds(workDuration);
        setCurrentSession(1);
        localStorage.removeItem('pomodoro_state');
    };

    const handleSkipBreak = () => {
        if (!isPremium) {
            toast.error("Premium subscription required to skip breaks");
            return;
        }
        stopTick();
        setTimerState('idle');
        setRemainingSeconds(workDuration);
        setCurrentSession(prev => prev + 1);
    };

    const getStatusText = () => {
        switch (timerState) {
            case 'running':
                return '🎯 Focus Time';
            case 'break':
                return '☕ Break Time';
            case 'paused':
                return '⏸️ Paused';
            default:
                return '⏳ Ready to Start';
        }
    };

    const getStatusColor = () => {
        switch (timerState) {
            case 'running':
                return 'text-blue-400';
            case 'break':
                return 'text-emerald-400';
            case 'paused':
                return 'text-orange-400';
            default:
                return 'text-slate-400';
        }
    };

    const totalDuration = timerState === 'break' ? breakDuration : workDuration;
    const progress = ((totalDuration - remainingSeconds) / totalDuration) * 100;

    if (loading) return <Loading />;
    if (error) return <ErrorMessage error={error} />;

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

                {/* Group Selector (optional) */}
                {groups.length > 0 && (
                    <div className="flex justify-center">
                        <div className="bg-[#1e293b] rounded-xl p-1 border border-slate-700 inline-flex gap-1 flex-wrap justify-center">
                            {groups.map(group => (
                                <button
                                    key={group.id}
                                    onClick={() => setSelectedGroup(group)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedGroup?.id === group.id
                                        ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                        }`}
                                >
                                    {group.group_name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timer Display */}
                <div className="relative flex flex-col items-center">
                    {!isPremium && (
                        <div className="absolute top-0 right-0 z-10">
                            <Link to="/subscription" className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20 hover:bg-amber-500/20 transition-all">
                                <Lock size={12} /> PRO
                            </Link>
                        </div>
                    )}
                    <div className="relative w-72 h-72 sm:w-80 sm:h-80">
                        {/* Background circle */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="50%"
                                cy="50%"
                                r="45%"
                                fill="none"
                                stroke="#334155"
                                strokeWidth="8"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="50%"
                                cy="50%"
                                r="45%"
                                fill="none"
                                stroke="url(#gradient)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 45}%`}
                                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}%`}
                                className="transition-all duration-1000"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor={timerState === 'break' ? '#10b981' : '#3b82f6'} />
                                    <stop offset="100%" stopColor={timerState === 'break' ? '#14b8a6' : '#6366f1'} />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Timer text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-6xl sm:text-7xl font-bold text-white font-mono tracking-tight">
                                {formatTime(remainingSeconds)}
                            </span>
                            <span className={`text-lg mt-2 ${getStatusColor()}`}>{getStatusText()}</span>
                            <span className="text-sm text-slate-500 mt-1">
                                Session {currentSession} of 4
                            </span>
                        </div>
                    </div>

                    {/* Selected group indicator */}
                    {selectedGroup && (
                        <div className="mt-4 px-4 py-2 bg-slate-800/50 rounded-full text-sm text-slate-400">
                            Studying with <span className="text-white font-medium">{selectedGroup.group_name}</span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4 flex-wrap">
                    {timerState === 'idle' && (
                        <button
                            onClick={handleStart}
                            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold text-lg transition-all shadow-lg shadow-blue-500/25"
                        >
                            <Play size={24} fill="white" />
                            Start Focus
                        </button>
                    )}

                    {timerState === 'running' && (
                        <button
                            onClick={handlePause}
                            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-2xl font-semibold text-lg transition-all shadow-lg shadow-orange-500/25"
                        >
                            <Pause size={24} />
                            Pause
                        </button>
                    )}

                    {timerState === 'break' && (
                        <>
                            <button
                                onClick={handlePause}
                                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-2xl font-semibold text-lg transition-all shadow-lg shadow-orange-500/25"
                            >
                                <Pause size={24} />
                                Pause
                            </button>
                            <button
                                onClick={handleSkipBreak}
                                className="flex items-center gap-2 px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-semibold transition-all"
                            >
                                Skip Break
                            </button>
                        </>
                    )}

                    {timerState === 'paused' && (
                        <button
                            onClick={handleResume}
                            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-semibold text-lg transition-all shadow-lg shadow-emerald-500/25"
                        >
                            <Play size={24} fill="white" />
                            Resume
                        </button>
                    )}

                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-semibold transition-all"
                    >
                        <RotateCcw size={20} />
                        Reset
                    </button>

                    <button
                        onClick={() => {
                            if (!isPremium) {
                                toast.error("Premium subscription required for custom sounds");
                                return;
                            }
                            setSoundEnabled(!soundEnabled);
                        }}
                        className={`p-4 rounded-2xl transition-all relative ${soundEnabled
                            ? 'bg-slate-700 text-white hover:bg-slate-600'
                            : 'bg-slate-800 text-slate-500'
                            } ${!isPremium ? 'opacity-75' : ''}`}
                        title={soundEnabled ? 'Sound enabled' : 'Sound disabled'}
                    >
                        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        {!isPremium && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 rounded-full p-0.5">
                                <Lock size={10} strokeWidth={3} />
                            </div>
                        )}
                    </button>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-5 text-center">
                        <BookOpen className="mx-auto text-blue-400 mb-3" size={28} />
                        <h3 className="text-white font-semibold mb-1">Work Duration</h3>
                        <p className="text-2xl font-bold text-blue-400">
                            {Math.floor(workDuration / 60)} min
                        </p>
                    </div>

                    <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-5 text-center">
                        <Coffee className="mx-auto text-emerald-400 mb-3" size={28} />
                        <h3 className="text-white font-semibold mb-1">Break Duration</h3>
                        <p className="text-2xl font-bold text-emerald-400">
                            {Math.floor(breakDuration / 60)} min
                        </p>
                    </div>

                    <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-5 text-center">
                        <Users className="mx-auto text-purple-400 mb-3" size={28} />
                        <h3 className="text-white font-semibold mb-1">Study Group</h3>
                        <p className="text-lg font-semibold text-purple-400 truncate">
                            {selectedGroup?.group_name || 'Solo Study'}
                        </p>
                    </div>
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
