import os
import redis.asyncio as aioredis
import socketio
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

# 1. Define constants/config first
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")

# 2. CREATE the 'sio' object (This must come BEFORE the @sio.event lines)
mgr = socketio.AsyncRedisManager(REDIS_URL)
sio = socketio.AsyncServer(
    async_mode='asgi',
    client_manager=mgr,
    cors_allowed_origins='*'
)

# 3. Create the FastAPI app and wrap it
app = FastAPI()
combined_app = socketio.ASGIApp(sio, app, socketio_path="/socket.io")

# 4. Create the Redis storage client
redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)

# 5. NOW you can use @sio.event
@sio.event
async def connect(sid, environ):
    print(f"✅ Connected: {sid}")

@sio.event
async def join_room(sid, data):
    room_id = data.get('roomId')
    await sio.enter_room(sid, room_id)
    print(f"🏠 {sid} joined {room_id}")
    # We removed the automatic push here to prevent the race condition

@sio.event
async def request_history(sid, data):
    room_id = data.get('roomId')
    existing_code = await redis_client.get(f"code:{room_id}")
    if existing_code:
        print(f"📦 Sending history to {sid}")
        await sio.emit('code_received', {'content': existing_code}, to=sid)

@sio.event
async def code_update(sid, data):
    room_id = data.get('roomId')
    content = data.get('content')

    # This will tell us WHICH tab is doing the saving
    print(f"💾 Saving code for {room_id} FROM client {sid}")

    await redis_client.set(f"code:{room_id}", content, ex=86400)
    await sio.emit('code_received', {'content': content}, room=room_id, skip_sid=sid)