import { useEffect, useRef } from 'react';

export const useStudyTracker = (isActive: boolean) => {
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (isActive) {
            // Start the heartbeat
            intervalRef.current = window.setInterval(sendHeartbeat, 60000); // Every 60 seconds
        } else {
            // Stop the heartbeat
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

            await fetch('http://127.0.0.1:8000/api/studytracker/activity/heartbeat/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Heartbeat sent');
        } catch (error) {
            console.error('Failed to send activity heartbeat:', error);
        }
    };
};
