import api from './api';
import type {
    StudyGroup,
    StudyGroupDetail,
    GroupMember,
    GroupAnalytics,
    CreateGroupRequest,
    UpdateGroupRequest,
    AddMemberRequest,
    UpdateMemberRequest
} from '../types/groups';

// Re-export types for convenience
export type { StudyGroup, StudyGroupDetail, GroupMember, GroupAnalytics };

// ============================================
// GROUPS ENDPOINTS
// ============================================

/**
 * Fetch all groups (public + user's private groups)
 */
export const fetchGroups = async (): Promise<StudyGroup[]> => {
    const response = await api.get('/groups/');
    return response.data;
};

/**
 * Fetch a single group by ID with detailed information
 */
export const fetchGroupDetail = async (id: number): Promise<StudyGroupDetail> => {
    const response = await api.get(`/groups/${id}/`);
    return response.data;
};

/**
 * Create a new study group
 */
export const createGroup = async (data: CreateGroupRequest): Promise<StudyGroup> => {
    const response = await api.post('/groups/', data);
    return response.data;
};

/**
 * Update an existing group
 */
export const updateGroup = async (id: number, data: UpdateGroupRequest): Promise<StudyGroup> => {
    const response = await api.patch(`/groups/${id}/`, data);
    return response.data;
};

/**
 * Delete a group
 */
export const deleteGroup = async (id: number): Promise<void> => {
    await api.delete(`/groups/${id}/`);
};

/**
 * Search groups by name
 */
export const searchGroups = async (query: string): Promise<StudyGroup[]> => {
    const response = await api.get('/groups/search/', {
        params: { q: query }
    });
    return response.data;
};

// ============================================
// GROUP ACTIONS
// ============================================

/**
 * Join a public group
 */
export const joinGroup = async (groupId: number): Promise<GroupMember> => {
    const response = await api.post(`/groups/${groupId}/join/`);
    return response.data;
};

/**
 * Leave a group
 */
export const leaveGroup = async (groupId: number): Promise<{ message: string }> => {
    const response = await api.post(`/groups/${groupId}/leave/`);
    return response.data;
};

/**
 * Get all members of a group
 */
export const fetchGroupMembers = async (groupId: number): Promise<GroupMember[]> => {
    const response = await api.get(`/groups/${groupId}/members/`);
    return response.data;
};

/**
 * Get group analytics
 */
export const fetchGroupAnalytics = async (groupId: number): Promise<GroupAnalytics> => {
    const response = await api.get(`/groups/${groupId}/analytics/`);
    return response.data;
};

// ============================================
// MEMBER MANAGEMENT
// ============================================

/**
 * Add a member to a group (admin/moderator only)
 */
export const addGroupMember = async (data: AddMemberRequest): Promise<GroupMember> => {
    const response = await api.post('/group-members/', data);
    return response.data;
};

/**
 * Update a member's role or status (admin/moderator only)
 */
export const updateGroupMember = async (
    memberId: number,
    data: UpdateMemberRequest
): Promise<GroupMember> => {
    const response = await api.patch(`/group-members/${memberId}/`, data);
    return response.data;
};

/**
 * Remove a member from a group (admin/moderator only)
 */
export const removeGroupMember = async (memberId: number): Promise<void> => {
    await api.delete(`/group-members/${memberId}/`);
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if user is admin or moderator of a group
 */
export const canManageGroup = (group: StudyGroup | StudyGroupDetail): boolean => {
    return group.user_role === 'admin' || group.user_role === 'moderator';
};

/**
 * Check if user is admin of a group
 */
export const isGroupAdmin = (group: StudyGroup | StudyGroupDetail): boolean => {
    return group.user_role === 'admin';
};

/**
 * Get group type display name
 */
export const getGroupTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
        academic: 'Academic',
        project: 'Project',
        exam_prep: 'Exam Preparation',
        study_buddy: 'Study Buddy'
    };
    return labels[type] || type;
};

/**
 * Get group type color
 */
export const getGroupTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
        academic: 'bg-blue-500',
        project: 'bg-purple-500',
        exam_prep: 'bg-orange-500',
        study_buddy: 'bg-emerald-500'
    };
    return colors[type] || 'bg-gray-500';
};
