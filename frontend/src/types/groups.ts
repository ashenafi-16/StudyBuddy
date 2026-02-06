// User types
export interface UserBasic {
    id: number;
    username?: string;
    email: string;
    full_name: string;
    profile_pic_url?: string;
    bio?: string;
}

// Group types
export type GroupType = 'academic' | 'project' | 'exam_prep' | 'study_buddy';

export type MemberRole = 'admin' | 'moderator' | 'member';

export interface StudyGroup {
    id: number;
    group_name: string;
    group_description: string;
    group_type: GroupType;
    created_by: UserBasic;
    created_by_name?: string;
    member_count: number;
    max_members: number;
    is_public: boolean;
    created_at: string;
    is_member?: boolean;
    user_role?: MemberRole | null;
    profile_pic?: string;
    profile_pic_url?: string;
    invitation_link?: string;
    chat_id?: number;
}

export interface StudyGroupDetail extends StudyGroup {
    recent_messages: MessageBasic[];
    active_tasks: TaskBasic[];
}

export interface GroupMember {
    id: number;
    user: UserBasic;
    group: number;
    group_name: string;
    role: MemberRole;
    joined_at: string;
    is_active: boolean;
}

export interface GroupAnalytics {
    group_id: number;
    group_name: string;
    total_members: number;
    total_messages: number;
    total_asks: number;
    completed_tasks: number;
    active_members_this_week: number;
    completion_rate: number;
}

// Message types
export interface MessageBasic {
    id: number;
    sender: UserBasic;
    content: string;
    timestamp: string;
    message_type: 'text' | 'file' | 'image' | 'system';
}

// Task types
export interface TaskBasic {
    id: number;
    title: string;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date: string;
    assigned_to: UserBasic;
}

// Request types
export interface CreateGroupRequest {
    group_name: string;
    group_description?: string;
    group_type?: GroupType;
    max_members?: number;
    is_public?: boolean;
}

export interface UpdateGroupRequest {
    group_name?: string;
    group_description?: string;
    group_type?: GroupType;
    max_members?: number;
    is_public?: boolean;
}

export interface AddMemberRequest {
    group_id: number;
    user_email: string;
}

export interface UpdateMemberRequest {
    role?: MemberRole;
    is_active?: boolean;
}
