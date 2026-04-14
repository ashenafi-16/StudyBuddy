import api from './apiClient';

export interface StudyFile {
    id: number;
    owner: string;
    file_url: string;
    filename: string;
    file_type: 'pdf' | 'image' | 'document' | 'presentation' | 'spreadsheet' | 'other';
    file_size: number;
    file_size_display: string;
    description: string;
    group: number | null;
    group_name: string | null;
    uploaded_at: string;
    updated_at: string;
}

export interface StudyFileList {
    id: number;
    filename: string;
    file_type: string;
    file_url: string;
    file_size_display: string;
    owner: string;
    group: number | null;
    group_name: string | null;
    uploaded_at: string;
}

export const fetchFiles = async (): Promise<StudyFileList[]> => {
    const response = await api.get('/files/');
    return response.data;
};

export const fetchMyFiles = async (): Promise<StudyFileList[]> => {
    const response = await api.get('/files/', { params: { mine: true } });
    return response.data;
};

export const fetchGroupFiles = async (groupId: number): Promise<StudyFileList[]> => {
    const response = await api.get(`/files/group/${groupId}/`);
    return response.data;
};

export const fetchFilesByType = async (type: string): Promise<StudyFileList[]> => {
    const response = await api.get('/files/by_type/', { params: { type } });
    return response.data;
};

export const fetchFileDetails = async (id: number): Promise<StudyFile> => {
    const response = await api.get(`/files/${id}/`);
    return response.data;
};

export const uploadFile = async (
    file: File,
    groupId: number,
    description?: string
): Promise<StudyFile> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('group', String(groupId));
    if (description) formData.append('description', description);

    const response = await api.post('/files/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const deleteFile = async (id: number): Promise<void> => {
    await api.delete(`/files/${id}/`);
};

// Helper function to get file icon based on type
export const getFileIcon = (fileType: string): string => {
    const icons: Record<string, string> = {
        pdf: '📄',
        image: '🖼️',
        document: '📝',
        presentation: '📊',
        spreadsheet: '📈',
        other: '📁'
    };
    return icons[fileType] || '📁';
};

// Helper function to get file color based on type
export const getFileColor = (fileType: string): string => {
    const colors: Record<string, string> = {
        pdf: 'text-red-400',
        image: 'text-green-400',
        document: 'text-blue-400',
        presentation: 'text-orange-400',
        spreadsheet: 'text-emerald-400',
        other: 'text-gray-400'
    };
    return colors[fileType] || 'text-gray-400';
};
