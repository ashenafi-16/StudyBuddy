import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';

export interface StudyFile {
    id: number;
    owner: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        profile_pic_url: string | null;
    };
    file_url: string;
    filename: string;
    file_type: 'pdf' | 'image' | 'document' | 'presentation' | 'spreadsheet' | 'other';
    file_size: number;
    file_size_display: string;
    description: string;
    shared_with: Array<{
        id: number;
        username: string;
        first_name: string;
        last_name: string;
    }>;
    is_public: boolean;
    uploaded_at: string;
    updated_at: string;
}

export interface StudyFileList {
    id: number;
    filename: string;
    file_type: string;
    file_url: string;
    file_size_display: string;
    owner_username: string;
    shared_count: number;
    is_public: boolean;
    uploaded_at: string;
}

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchFiles = async (): Promise<StudyFileList[]> => {
    const response = await axios.get(`${API_BASE}/files/`, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const fetchMyFiles = async (): Promise<StudyFileList[]> => {
    const response = await axios.get(`${API_BASE}/files/my_files/`, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const fetchSharedWithMe = async (): Promise<StudyFileList[]> => {
    const response = await axios.get(`${API_BASE}/files/shared_with_me/`, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const fetchFilesByType = async (type: string): Promise<StudyFileList[]> => {
    const response = await axios.get(`${API_BASE}/files/by_type/`, {
        headers: getAuthHeader(),
        params: { type }
    });
    return response.data;
};

export const fetchFileDetails = async (id: number): Promise<StudyFile> => {
    const response = await axios.get(`${API_BASE}/files/${id}/`, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const uploadFile = async (
    file: File,
    description?: string,
    isPublic: boolean = false
): Promise<StudyFile> => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    formData.append('is_public', String(isPublic));

    const response = await axios.post(`${API_BASE}/files/`, formData, {
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteFile = async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE}/files/${id}/`, {
        headers: getAuthHeader()
    });
};

export const shareFile = async (id: number, userIds: number[]): Promise<void> => {
    await axios.post(`${API_BASE}/files/${id}/share/`,
        { user_ids: userIds },
        { headers: getAuthHeader() }
    );
};

export const unshareFile = async (id: number, userIds: number[]): Promise<void> => {
    await axios.post(`${API_BASE}/files/${id}/unshare/`,
        { user_ids: userIds },
        { headers: getAuthHeader() }
    );
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
