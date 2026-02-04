import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';
const WS_BASE = 'ws://127.0.0.1:8000';

export interface PomodoroSession {
    id: number;
    group: number;
    group_name: string;
    work_duration: number;
    break_duration: number;
    long_break_duration: number;
    sessions_before_long_break: number;

    // The Moment
    phase: 'work' | 'short_break' | 'long_break';
    state: 'idle' | 'running' | 'paused' | 'completed';
    phase_start: string | null;     // ISO Date string
    phase_duration: number;         // Seconds

    // Pause state
    paused_at: string | null;
    remaining_seconds_at_pause: number | null;

    remaining_seconds: number;      // Server calculated snapshot
    allow_member_pause: boolean;
    is_leader: boolean;
    is_creator: boolean;
    sync_mode: 'forced' | 'flexible';

    current_session_number: number;
    started_by: number | null;
    started_by_username: string | null;
    created_at: string;
    updated_at: string;

    // FLEXIBLE mode fields
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

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchPomodoroByGroup = async (groupId: number): Promise<PomodoroSession> => {
    const response = await axios.get(`${API_BASE}/pomodoro/by_group/`, {
        headers: getAuthHeader(),
        params: { group_id: groupId }
    });
    return response.data;
};

// Actions
export const startTimer = async (sessionId: number): Promise<PomodoroSession> => {
    const response = await axios.post(`${API_BASE}/pomodoro/${sessionId}/start/`, {}, { headers: getAuthHeader() });
    return response.data;
};

export const pauseTimer = async (sessionId: number): Promise<PomodoroSession> => {
    const response = await axios.post(`${API_BASE}/pomodoro/${sessionId}/pause/`, {}, { headers: getAuthHeader() });
    return response.data;
};

export const resumeTimer = async (sessionId: number): Promise<PomodoroSession> => {
    const response = await axios.post(`${API_BASE}/pomodoro/${sessionId}/resume/`, {}, { headers: getAuthHeader() });
    return response.data;
};

export const resetTimer = async (sessionId: number): Promise<PomodoroSession> => {
    const response = await axios.post(`${API_BASE}/pomodoro/${sessionId}/reset/`, {}, { headers: getAuthHeader() });
    return response.data;
};

export const nextPhase = async (sessionId: number): Promise<PomodoroSession> => {
    const response = await axios.post(`${API_BASE}/pomodoro/${sessionId}/next_phase/`, {}, { headers: getAuthHeader() });
    return response.data;
};

export const updatePomodoroSettings = async (
    sessionId: number,
    settings: Partial<PomodoroSettings>
): Promise<PomodoroSession> => {
    const response = await axios.patch(
        `${API_BASE}/pomodoro/${sessionId}/settings/`,
        settings,
        { headers: getAuthHeader() }
    );
    return response.data;
};

// WebSocket connection helper
export const createPomodoroWebSocket = (groupId: number): WebSocket => {
    const token = localStorage.getItem('token');
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
