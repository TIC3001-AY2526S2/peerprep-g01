import os
import uuid
import json
import redis.asyncio as aioredis
import socketio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")

mgr = socketio.AsyncRedisManager(REDIS_URL)
sio = socketio.AsyncServer(
    async_mode='asgi',
    client_manager=mgr,
    cors_allowed_origins='*'
)

app = FastAPI(title="PeerPrep Collaboration Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wrap FastAPI with Socket.IO ASGI application
combined_app = socketio.ASGIApp(sio, app, socketio_path="/socket.io")

redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)

class SessionInit(BaseModel):
    matchId: str
    question: dict

@app.post("/internal/init-session")
async def init_session(data: SessionInit):
    """
    Called by the Matching Service once a match is found.
    Initializes the room state in Redis.
    """
    try:
        await redis_client.set(f"question:{data.matchId}", json.dumps(data.question), ex=86400)

        exists = await redis_client.exists(f"code:{data.matchId}")
        if not exists:
            await redis_client.set(f"code:{data.matchId}", "// Welcome to your collaboration session!\n", ex=86400)

        print(f"Session {data.matchId} initialized successfully.")
        return {"status": "success", "matchId": data.matchId}
    except Exception as e:
        print(f"Error initializing session: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/session/{matchId}")
async def get_session(matchId: str):
    """Fetches current session state (question and code) for frontend recovery."""
    question = await redis_client.get(f"question:{matchId}")
    code = await redis_client.get(f"code:{matchId}")
    return {
        "question": json.loads(question) if question else None,
        "code": code or ""
    }

@sio.event
async def connect(sid, environ):
    print(f"Client Connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client Disconnected: {sid}")

@sio.event
async def join_room(sid, data):
    match_id = data.get('matchId')
    if match_id:
        await sio.enter_room(sid, match_id)
        print(f"User {sid} joined room: {match_id}")
    else:
        print(f"User {sid} tried to join without a matchId")

@sio.event
async def request_history(sid, data):
    match_id = data.get('matchId')
    if match_id:
        existing_code = await redis_client.get(f"code:{match_id}")
        if existing_code:
            print(f"Sending history to {sid} for room {match_id}")
            await sio.emit('code_received', {'content': existing_code}, to=sid)

@sio.event
async def code_update(sid, data):
    match_id = data.get('matchId')
    content = data.get('content')

    if match_id and content is not None:
        await redis_client.set(f"code:{match_id}", content, ex=86400)

        # Broadcast to everyone in the room EXCEPT the sender
        await sio.emit(
            'code_received',
            {'content': content},
            room=match_id,
            skip_sid=sid
        )
        print(f"Sync: Room {match_id} updated by {sid}")
