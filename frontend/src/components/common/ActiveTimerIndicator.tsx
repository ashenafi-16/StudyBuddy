import { useNavigate } from 'react-router-dom';
import { Timer, Play } from 'lucide-react';
import { usePomodoroContext } from '../../contexts/PomodoroContext';
import { formatTime } from '../../api/pomodoroApi';

/**
 * ActiveTimerIndicator - Compact timer indicator for the navbar
 * Shows active Pomodoro timer with countdown and group name
 * Clicking navigates to the Pomodoro page
 */
export default function ActiveTimerIndicator() {
    const navigate = useNavigate();
    const { activeSession, activeGroupName, displayTime } = usePomodoroContext();

    // Don't show if no active session or if timer is idle
    if (!activeSession || activeSession.state === 'idle') {
        return null;
    }

    const isRunning = activeSession.state === 'running';
    const isPaused = activeSession.state === 'paused';

    const getPhaseLabel = () => {
        switch (activeSession.phase) {
            case 'work': return '🎯 Focus';
            case 'short_break': return '☕ Break';
            case 'long_break': return '🧘 Long Break';
            default: return 'Timer';
        }
    };

    const getPhaseColors = () => {
        switch (activeSession.phase) {
            case 'work':
                return {
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-500/30',
                    text: 'text-blue-400',
                    glow: 'shadow-blue-500/20',
                };
            case 'short_break':
                return {
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500/30',
                    text: 'text-emerald-400',
                    glow: 'shadow-emerald-500/20',
                };
            case 'long_break':
                return {
                    bg: 'bg-purple-500/10',
                    border: 'border-purple-500/30',
                    text: 'text-purple-400',
                    glow: 'shadow-purple-500/20',
                };
            default:
                return {
                    bg: 'bg-slate-500/10',
                    border: 'border-slate-500/30',
                    text: 'text-slate-400',
                    glow: 'shadow-slate-500/20',
                };
        }
    };

    const colors = getPhaseColors();

    return (
        <button
            onClick={() => navigate('/pomodoro')}
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full
                ${colors.bg} ${colors.border} border
                hover:scale-105 transition-all duration-200
                shadow-lg ${colors.glow}
            `}
            title={`Active timer in ${activeGroupName || 'group'}`}
        >
            {/* Timer Icon with animation */}
            <div className={`relative ${isRunning ? 'animate-pulse' : ''}`}>
                {isRunning ? (
                    <Timer size={16} className={colors.text} />
                ) : (
                    <Play size={16} className="text-orange-400" />
                )}
            </div>

            {/* Timer Display */}
            <span className={`font-mono font-bold text-sm ${colors.text}`}>
                {formatTime(displayTime)}
            </span>

            {/* Phase Label */}
            <span className="text-xs text-slate-400 hidden sm:inline">
                {getPhaseLabel()}
            </span>

            {/* Group Name */}
            {activeGroupName && (
                <span className="text-xs text-slate-500 hidden md:inline border-l border-slate-600 pl-2 ml-1">
                    {activeGroupName.length > 12 ? `${activeGroupName.slice(0, 12)}...` : activeGroupName}
                </span>
            )}

            {/* Paused indicator */}
            {isPaused && (
                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">
                    Paused
                </span>
            )}
        </button>
    );
}
