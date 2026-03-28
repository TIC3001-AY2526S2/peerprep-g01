# client connects to:
wss://collab-service/ws/session/{sessionId}/?token={jwt}

from channels.generic.websocket import AsyncWebsocketConsumer
import json

class CollabConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
        self.room_group = f"room_{self.session_id}"
        self.user_id = self.scope["user"].id  # from JWT middleware

        # validate user belongs to this session
        session = await get_session(self.session_id)
        if self.user_id not in [session["userA"], session["userB"]]:
            await self.close(code=4003)
            return

        # join the channel group — this is how both users get linked
        await self.channel_layer.group_add(
            self.room_group,
            self.channel_name
        )
        await self.accept()

        # notify the room someone joined
        await self.channel_layer.group_send(self.room_group, {
            "type": "user_joined",
            "userId": self.user_id
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_send(self.room_group, {
            "type": "user_left",
            "userId": self.user_id
        })
        await self.channel_layer.group_discard(
            self.room_group,
            self.channel_name
        )
    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data["type"]

        if msg_type == "code_op":
            # apply op to Redis buffer
            await apply_code_op(self.session_id, data["op"])
            # broadcast to everyone in the room
            await self.channel_layer.group_send(self.room_group, {
                "type": "code_op",
                "userId": self.user_id,
                "op": data["op"],
                "timestamp": data["timestamp"]
            })

        elif msg_type == "cursor_move":
            await update_cursor(self.session_id, self.user_id, data["position"])
            await self.channel_layer.group_send(self.room_group, {
                "type": "cursor_move",
                "userId": self.user_id,
                "position": data["position"]
            })

        elif msg_type == "chat_message":
            await self.channel_layer.group_send(self.room_group, {
                "type": "chat_message",
                "userId": self.user_id,
                "text": data["text"]
            })

    # these handlers are called when group_send delivers to this consumer
    async def code_op(self, event):
        await self.send(text_data=json.dumps(event))

    async def cursor_move(self, event):
        await self.send(text_data=json.dumps(event))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def user_joined(self, event):
        await self.send(text_data=json.dumps(event))

    async def user_left(self, event):
        await self.send(text_data=json.dumps(event))
