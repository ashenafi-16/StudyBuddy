import { useEffect, useRef } from 'react';
import { API_BASE } from '../api/apiClient';

export const useStudyTracker = (isActive: boolean) => {
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (isActive) {
            intervalRef.current = window.setInterval(sendHeartbeat, 60000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive]);

    const sendHeartbeat = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await fetch(`${API_BASE}/api/studytracker/activity/heartbeat/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Failed to send activity heartbeat:', error);
        }
    };
};
