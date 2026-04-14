import api from './apiClient';
import { WS_BASE, getToken } from './apiClient';

export interface PomodoroSession {
    id: number;
    group: number;
    group_name: string;
    work_duration: number;
    break_duration: number;
    long_break_duration: number;
    sessions_before_long_break: number;
    phase: 'work' | 'short_break' | 'long_break';
    state: 'idle' | 'running' | 'paused' | 'completed';
    phase_start: string | null;
    phase_duration: number;
    paused_at: string | null;
    remaining_seconds_at_pause: number | null;
    remaining_seconds: number;
    allow_member_pause: boolean;
    is_leader: boolean;
    is_creator: boolean;
    sync_mode: 'forced' | 'flexible';
    current_session_number: number;
    started_by: number | null;
    started_by_username: string | null;
    created_at: string;
    updated_at: string;
    is_personal_timer?: boolean;
    current_user_name?: string;
}

export interface PomodoroSettings {
    work_duration: number;
    break_duration: number;
    long_break_duration: number;
    sessions_before_long_break: number;
    allow_member_pause?: boolean;
    sync_mode?: 'forced' | 'flexible';
}

export const fetchPomodoroByGroup = async (groupId: number): Promise<PomodoroSession> => {
    const response = await api.get('/pomodoro/by_group/', { params: { group_id: groupId } });
    return response.data;
};

export const startTimer = async (sessionId: number): Promise<PomodoroSession> => {
    const response = await api.post(`/pomodoro/${sessionId}/start/`);
    return response.data;
};

export const pauseTimer = async (sessionId: number): Promise<PomodoroSession> => {
    const response = await api.post(`/pomodoro/${sessionId}/pause/`);
    return response.data;
};

export const resumeTimer = async (sessionId: number): Promise<PomodoroSession> => {
    const response = await api.post(`/pomodoro/${sessionId}/resume/`);
    return response.data;
};

export const resetTimer = async (sessionId: number): Promise<PomodoroSession> => {
    const response = await api.post(`/pomodoro/${sessionId}/reset/`);
    return response.data;
};

export const nextPhase = async (sessionId: number): Promise<PomodoroSession> => {
    const response = await api.post(`/pomodoro/${sessionId}/next_phase/`);
    return response.data;
};

export const updatePomodoroSettings = async (
    sessionId: number,
    settings: Partial<PomodoroSettings>
): Promise<PomodoroSession> => {
    const response = await api.patch(`/pomodoro/${sessionId}/settings/`, settings);
    return response.data;
};

// WebSocket connection helper
export const createPomodoroWebSocket = (groupId: number): WebSocket => {
    const token = getToken();
    const wsUrl = token
        ? `${WS_BASE}/ws/pomodoro/${groupId}/?token=${token}`
        : `${WS_BASE}/ws/pomodoro/${groupId}/`;
    return new WebSocket(wsUrl);
};

// Format seconds to MM:SS
export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
