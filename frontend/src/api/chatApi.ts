import api from './api';
import type { Conversation, Message, SendMessageRequest } from '../types/chat';

// Fetch all conversations
export const fetchConversations = async (query?: string): Promise<Conversation[]> => {
    const params = query ? { search: query } : {};
    const response = await api.get('/conversations/', { params });
    return response.data;
};

// Fetch specific conversation
export const fetchConversation = async (id: number): Promise<Conversation> => {
    const response = await api.get(`/conversations/${id}/`);
    return response.data;
};

// Fetch messages for a conversation
export const fetchMessages = async (conversationId: number): Promise<Message[]> => {
    const response = await api.get(`/messages/?conversation_id=${conversationId}`);
    return response.data;
};

// Send text message
export const sendTextMessage = async (conversationId: number, content: string, replyTo?: number): Promise<Message> => {
    const data: SendMessageRequest = {
        conversation_id: conversationId,
        content,
        message_type: 'text',
        reply_to: replyTo
    };
    const response = await api.post('/messages/', data);
    return response.data;
};

// Send file message
export const sendFileMessage = async (conversationId: number, content: string, file: File, replyTo?: number): Promise<Message> => {
    const formData = new FormData();
    formData.append('conversation_id', conversationId.toString());
    formData.append('content', content || 'Attachment');
    formData.append('file', file);
    formData.append('message_type', 'file');
    if (replyTo) {
        formData.append('reply_to', replyTo.toString());
    }

    const response = await api.post('/messages/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Start a new individual chat
export const startChat = async (userId: number): Promise<Conversation> => {
    const response = await api.post('/conversations/start_individual/', { recipient_id: userId });
    return response.data;
};
