import api from './api';
import { unwrapPaginated } from './pagination';

export interface Task {
    id: number;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    due_date: string;
    priority: 'low' | 'medium' | 'high';
}

export const fetchTasks = async (): Promise<Task[]> => {
    const response = await api.get('/tasks/');
    return unwrapPaginated<Task>(response.data);
};

export const createTask = async (data: Partial<Task>): Promise<Task> => {
    const response = await api.post('/tasks/', data);
    return response.data;
};

export const updateTask = async (id: number, data: Partial<Task>): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}/`, data);
    return response.data;
};

export const deleteTask = async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}/`);
};
