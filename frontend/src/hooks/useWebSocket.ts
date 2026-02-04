import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UseWebSocketProps {
    conversationId: number | null;
    onMessageReceived?: (message: any) => void;
    onTypingIndicator?: (userId: number, isTyping: boolean) => void;
    onPresenceUpdate?: (userId: number, status: string) => void;
}

export const useWebSocket = ({
    conversationId,
    onMessageReceived,
    onTypingIndicator,
    onPresenceUpdate,
}: UseWebSocketProps) => {
    const { user } = useAuth();
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const connect = useCallback(() => {
        if (!user?.token || !conversationId) return;

        const wsUrl = `ws://127.0.0.1:8000/ws/chat/${conversationId}/?token=${user.token}`;

        try {
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('✅ WebSocket connected to conversation:', conversationId);
                reconnectAttempts.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Handle different message types
                    switch (data.type) {
                        case 'presence':
                            onPresenceUpdate?.(data.user_id, data.status);
                            break;

                        case 'typing':
                            onTypingIndicator?.(data.user_id, data.is_typing);
                            break;

                        default:
                            // Regular chat message
                            if (data.id) {
                                onMessageReceived?.(data);
                            }
                            break;
                    }
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = (event) => {
                console.log('WebSocket closed:', event.code, event.reason);
                wsRef.current = null;

                // Auto-reconnect with exponential backoff
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                    console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current + 1})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttempts.current++;
                        connect();
                    }, delay);
                }
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
        }
    }, [conversationId, user?.token, onMessageReceived, onTypingIndicator, onPresenceUpdate]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    const sendMessage = useCallback((text: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not connected. Cannot send message.');
            return false;
        }

        try {
            wsRef.current.send(JSON.stringify({
                action: 'send_message',
                message_type: 'text',
                text: text,
            }));
            return true;
        } catch (error) {
            console.error('Failed to send message via WebSocket:', error);
            return false;
        }
    }, []);

    const sendTypingIndicator = useCallback((isTyping: boolean) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        try {
            wsRef.current.send(JSON.stringify({
                action: 'typing',
                is_typing: isTyping,
            }));
        } catch (error) {
            console.error('Failed to send typing indicator:', error);
        }
    }, []);

    // Connect when conversation changes
    useEffect(() => {
        if (conversationId) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [conversationId, connect, disconnect]);

    return {
        sendMessage,
        sendTypingIndicator,
        isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    };
};





// import { useEffect, useRef, useCallback } from 'react';
// import { useAuth } from '../contexts/AuthContext';

// interface UseWebSocketProps {
//     conversationId: number | null;
//     onMessageReceived?: (message: any) => void;
//     onTypingIndicator?: (userId: number, isTyping: boolean) => void;
//     onPresenceUpdate?: (userId: number, status: string) => void;
// }

// export const useWebSocket = ({
//     conversationId,
//     onMessageReceived,
//     onTypingIndicator,
//     onPresenceUpdate,
// }: UseWebSocketProps) => {
//     const { user } = useAuth();
//     const wsRef = useRef<WebSocket | null>(null);
//     const reconnectTimeoutRef = useRef<number | null>(null);
//     const reconnectAttempts = useRef(0);
//     const maxReconnectAttempts = 5;

//     const connect = useCallback(() => {
//         if (!user?.token || !conversationId) return;

//         const wsUrl = `ws://127.0.0.1:8000/ws/chat/${conversationId}/?token=${user.token}`;

//         try {
//             const ws = new WebSocket(wsUrl);

//             ws.onopen = () => {
//                 console.log('✅ WebSocket connected to conversation:', conversationId);
//                 reconnectAttempts.current = 0;
//             };

//             ws.onmessage = (event) => {
//                 try {
//                     const data = JSON.parse(event.data);

//                     // Handle different message types
//                     switch (data.type) {
//                         case 'presence':
//                             onPresenceUpdate?.(data.user_id, data.status);
//                             break;

//                         case 'typing':
//                             onTypingIndicator?.(data.user_id, data.is_typing);
//                             break;

//                         default:
//                             // Regular chat message
//                             if (data.id) {
//                                 onMessageReceived?.(data);
//                             }
//                             break;
//                     }
//                 } catch (error) {
//                     console.error('Failed to parse WebSocket message:', error);
//                 }
//             };

//             ws.onerror = (error) => {
//                 console.error('WebSocket error:', error);
//             };

//             ws.onclose = (event) => {
//                 console.log('WebSocket closed:', event.code, event.reason);
//                 wsRef.current = null;

//                 // Auto-reconnect with exponential backoff
//                 if (reconnectAttempts.current < maxReconnectAttempts) {
//                     const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
//                     console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current + 1})`);

//                     reconnectTimeoutRef.current = setTimeout(() => {
//                         reconnectAttempts.current++;
//                         connect();
//                     }, delay);
//                 }
//             };

//             wsRef.current = ws;
//         } catch (error) {
//             console.error('Failed to create WebSocket connection:', error);
//         }
//     }, [conversationId, user?.token, onMessageReceived, onTypingIndicator, onPresenceUpdate]);

//     const disconnect = useCallback(() => {
//         if (reconnectTimeoutRef.current) {
//             clearTimeout(reconnectTimeoutRef.current);
//             reconnectTimeoutRef.current = null;
//         }

//         if (wsRef.current) {
//             wsRef.current.close();
//             wsRef.current = null;
//         }
//     }, []);

//     const sendMessage = useCallback((text: string) => {
//         if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
//             console.warn('WebSocket not connected. Cannot send message.');
//             return false;
//         }

//         try {
//             wsRef.current.send(JSON.stringify({
//                 action: 'send_message',
//                 message_type: 'text',
//                 text: text,
//             }));
//             return true;
//         } catch (error) {
//             console.error('Failed to send message via WebSocket:', error);
//             return false;
//         }
//     }, []);

//     const sendTypingIndicator = useCallback((isTyping: boolean) => {
//         if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
//             return;
//         }

//         try {
//             wsRef.current.send(JSON.stringify({
//                 action: 'typing',
//                 is_typing: isTyping,
//             }));
//         } catch (error) {
//             console.error('Failed to send typing indicator:', error);
//         }
//     }, []);

//     // Connect when conversation changes
//     useEffect(() => {
//         if (conversationId) {
//             connect();
//         }

//         return () => {
//             disconnect();
//         };
//     }, [conversationId, connect, disconnect]);

//     return {
//         sendMessage,
//         sendTypingIndicator,
//         isConnected: wsRef.current?.readyState === WebSocket.OPEN,
//     };
// };