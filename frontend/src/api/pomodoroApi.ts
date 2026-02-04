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
    remaining_seconds: number;
    formatted_time: string;
    state: 'idle' | 'running' | 'paused' | 'break' | 'completed';
    current_session_number: number;
    started_by: number | null;
    started_by_username: string | null;
    started_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface PomodoroSettings {
    work_duration: number;
    break_duration: number;
    long_break_duration: number;
    sessions_before_long_break: number;
}

export interface TimerState {
    remaining_seconds: number;
    formatted_time: string;
    state: 'idle' | 'running' | 'paused' | 'break' | 'completed';
    current_session: number;
    work_duration: number;
    break_duration: number;
    started_by: string | null;
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
    return new WebSocket(`${WS_BASE}/ws/pomodoro/${groupId}/`);
};

// Format seconds to MM:SS
export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Parse MM:SS to seconds
export const parseTime = (timeString: string): number => {
    const [mins, secs] = timeString.split(':').map(Number);
    return mins * 60 + secs;
};
