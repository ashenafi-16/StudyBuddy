import api from './api';
import type { StudyGroup, GroupMember } from '../types/groups';

export const groupService = {
  getGroup: async (id: string): Promise<StudyGroup> => {
    const response = await api.get(`/groups/${id}/`);
    return response.data;
  },

  joinGroup: async (id: string): Promise<GroupMember> => {
    const response = await api.post(`/groups/${id}/join/`, { group_id: id });
    return response.data;
  },

  joinViaLink: async (id: string, token: string): Promise<GroupMember> => {
    const response = await api.post(`/groups/${id}/join-via-link/${token}/`, {
      group_id: id,
      invitation_token: token
    });
    return response.data;
  },

  leaveGroup: async (id: string): Promise<any> => {
    const response = await api.post(`/groups/${id}/leave/`);
    return response.data;
  },

  getGroupMembers: async (id: string): Promise<GroupMember[]> => {
    const response = await api.get(`/groups/${id}/members/`);
    return response.data;
  },

  removeMember: async (memberId: number): Promise<void> => {
    await api.delete(`/group-members/${memberId}/`);
  },

  generateInvitationLink: async (_id: string): Promise<{ link: string }> => {
    // Since the link is a property on the group object, we might not need an explicit API call 
    // unless we want to regenerate it. For now, we assume the link is fetched with getGroup.
    // If regeneration is needed, we would add an endpoint for it.
    return { link: '' };
  }
};
