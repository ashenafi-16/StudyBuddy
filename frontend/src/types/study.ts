export interface StudyActivity {
    id: number;
    date: string;
    duration_minutes: number;
}

export interface StudyStreak {
    current_streak: number;
    longest_streak: number;
}

export interface Achievement {
    achievement_name: string;
    awarded_at: string;
}

export interface DashboardData {
    streak: StudyStreak;
    achievements: Achievement[];
    total_study_minutes: number;
    recent_activity: StudyActivity[];
}
