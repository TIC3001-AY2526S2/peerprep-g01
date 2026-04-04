const WS_URL = 'ws://localhost:3002';

export function createMatchingSocket({ onMessage, onError, onClose }) {
    const ws = new WebSocket(`${WS_URL}/ws/match`);

    ws.onopen = () => {
        console.log('[+] matchingService.js - WebSocket connected');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('[*] matchingService.js - Received:', data);
        onMessage(data);
    };

    ws.onerror = (error) => {
        console.error('[!] matchingService.js - WebSocket error:', error);
        onError?.(error);
    };

    ws.onclose = () => {
        console.log('[*] matchingService.js - WebSocket closed');
        onClose?.();
    };

    return ws;
}

export function sendMatchRequest(ws, payload) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
        console.log('[+] matchingService.js - Sent payload:', payload);
    } else {
        console.error('[!] matchingService.js - WebSocket not open');
    }
}

export function closeMatchingSocket(ws) {
    if (ws) {
        ws.close();
    }
}