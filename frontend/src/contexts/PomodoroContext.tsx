import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { type PomodoroSession } from '../api/pomodoroApi';

interface PomodoroContextType {
    activeSession: PomodoroSession | null;
    activeGroupName: string | null;
    displayTime: number;
    setActiveSession: (session: PomodoroSession | null, groupName?: string | null) => void;
}

const PomodoroContext = createContext<PomodoroContextType | null>(null);

export function PomodoroProvider({ children }: { children: ReactNode }) {
    const [activeSession, setActiveSessionState] = useState<PomodoroSession | null>(null);
    const [activeGroupName, setActiveGroupName] = useState<string | null>(null);
    const [displayTime, setDisplayTime] = useState(0);
    const tickIntervalRef = useRef<number | null>(null);

    const setActiveSession = (session: PomodoroSession | null, groupName?: string | null) => {
        setActiveSessionState(session);
        if (groupName !== undefined) {
            setActiveGroupName(groupName);
        }
    };

    // Timer countdown logic
    useEffect(() => {
        if (!activeSession) {
            setDisplayTime(0);
            if (tickIntervalRef.current) {
                clearInterval(tickIntervalRef.current);
                tickIntervalRef.current = null;
            }
            return;
        }

        const updateTime = () => {
            if (activeSession.state === 'running' && activeSession.phase_start) {
                const start = new Date(activeSession.phase_start).getTime();
                const now = Date.now();
                const elapsed = (now - start) / 1000;
                const remaining = Math.max(0, activeSession.phase_duration - elapsed);
                setDisplayTime(Math.ceil(remaining));
            } else if (activeSession.state === 'paused') {
                setDisplayTime(activeSession.remaining_seconds_at_pause || 0);
            } else {
                // Idle - show phase duration
                let duration = activeSession.work_duration;
                if (activeSession.phase === 'short_break') duration = activeSession.break_duration;
                if (activeSession.phase === 'long_break') duration = activeSession.long_break_duration;
                setDisplayTime(duration);
            }
        };

        updateTime();

        if (activeSession.state === 'running') {
            if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
            tickIntervalRef.current = window.setInterval(updateTime, 1000);
        } else {
            if (tickIntervalRef.current) {
                clearInterval(tickIntervalRef.current);
                tickIntervalRef.current = null;
            }
        }

        return () => {
            if (tickIntervalRef.current) {
                clearInterval(tickIntervalRef.current);
                tickIntervalRef.current = null;
            }
        };
    }, [activeSession]);

    return (
        <PomodoroContext.Provider value={{
            activeSession,
            activeGroupName,
            displayTime,
            setActiveSession
        }}>
            {children}
        </PomodoroContext.Provider>
    );
}

export function usePomodoroContext() {
    const context = useContext(PomodoroContext);
    if (!context) {
        throw new Error('usePomodoroContext must be used within a PomodoroProvider');
    }
    return context;
}
