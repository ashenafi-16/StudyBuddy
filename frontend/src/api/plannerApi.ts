import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';

export interface StudySession {
    id: number;
    title: string;
    subject: string;
    description: string;
    start_time: string;
    end_time: string;
    host: {
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        profile_pic_url: string | null;
    };
    participant: {
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        profile_pic_url: string | null;
    } | null;
    meeting_id: string;
    meeting_url: string;
    is_active: boolean;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    created_at: string;
    updated_at: string;
}

export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    backgroundColor: string;
    borderColor: string;
    extendedProps: {
        subject: string;
        description: string;
        meeting_url: string;
        is_active: boolean;
        status: string;
        host: { id: number; username: string };
        participant: { id: number; username: string } | null;
    };
}

export interface CreateSessionData {
    title: string;
    subject: string;
    description?: string;
    start_time: string;
    end_time: string;
    participant_id?: number | null;
}

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchCalendarEvents = async (start?: string, end?: string): Promise<CalendarEvent[]> => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);

    const response = await axios.get(`${API_BASE}/sessions/calendar/`, {
        headers: getAuthHeader(),
        params
    });
    return response.data;
};

export const fetchSessions = async (): Promise<StudySession[]> => {
    const response = await axios.get(`${API_BASE}/sessions/`, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const fetchUpcomingSessions = async (): Promise<StudySession[]> => {
    const response = await axios.get(`${API_BASE}/sessions/upcoming/`, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const createSession = async (data: CreateSessionData): Promise<StudySession> => {
    const response = await axios.post(`${API_BASE}/sessions/`, data, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const updateSession = async (id: number, data: Partial<CreateSessionData>): Promise<StudySession> => {
    const response = await axios.patch(`${API_BASE}/sessions/${id}/`, data, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const deleteSession = async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE}/sessions/${id}/`, {
        headers: getAuthHeader()
    });
};

export const cancelSession = async (id: number): Promise<void> => {
    await axios.post(`${API_BASE}/sessions/${id}/cancel/`, {}, {
        headers: getAuthHeader()
    });
};

export const completeSession = async (id: number): Promise<void> => {
    await axios.post(`${API_BASE}/sessions/${id}/complete/`, {}, {
        headers: getAuthHeader()
    });
};
