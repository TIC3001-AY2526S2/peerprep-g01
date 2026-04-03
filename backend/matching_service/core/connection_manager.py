from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.connections = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.connections:
            del self.connections[user_id]

    async def send(self, user_id: str, message: dict):
        ws = self.connections.get(user_id)
        if ws:
            await ws.send_json(message)


manager = ConnectionManager()