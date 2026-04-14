import api from './apiClient';

// ============================================
// TYPES
// ============================================

export interface StudyGroupMinimal {
    id: number;
    group_name: string;
    group_type: string;
}

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
    study_group: StudyGroupMinimal | null;
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
        study_group: StudyGroupMinimal | null;
        host: { id: number; username: string };
        participant: { id: number; username: string } | null;
    };
}

export interface CreateSessionData {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    study_group_id?: number | null;
    participant_id?: number | null;
}

// ============================================
// API FUNCTIONS
// ============================================

export const fetchCalendarEvents = async (start?: string, end?: string): Promise<CalendarEvent[]> => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);

    const response = await api.get('/sessions/calendar/', { params });
    return response.data;
};

export const fetchSessions = async (): Promise<StudySession[]> => {
    const response = await api.get('/sessions/');
    return response.data;
};

export const fetchUpcomingSessions = async (): Promise<StudySession[]> => {
    const response = await api.get('/sessions/upcoming/');
    return response.data;
};

export const createSession = async (data: CreateSessionData): Promise<StudySession> => {
    const response = await api.post('/sessions/', data);
    return response.data;
};

export const updateSession = async (id: number, data: Partial<CreateSessionData>): Promise<StudySession> => {
    const response = await api.patch(`/sessions/${id}/`, data);
    return response.data;
};

export const deleteSession = async (id: number): Promise<void> => {
    await api.delete(`/sessions/${id}/`);
};

export const cancelSession = async (id: number): Promise<void> => {
    await api.post(`/sessions/${id}/cancel/`, {});
};

export const completeSession = async (id: number): Promise<void> => {
    await api.post(`/sessions/${id}/complete/`, {});
};

export const startSession = async (id: number): Promise<StudySession> => {
    const response = await api.post(`/sessions/${id}/start/`, {});
    return response.data;
};

export const fetchMyGroups = async (): Promise<StudyGroupMinimal[]> => {
    const response = await api.get('/groups/my-groups/');
    return response.data;
};
