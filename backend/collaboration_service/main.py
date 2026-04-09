import os
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

combined_app = socketio.ASGIApp(sio, app, socketio_path="/socket.io")

redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)


class SessionInit(BaseModel):
    matchId: str
    question: dict

class SaveCode(BaseModel):
    content: str
    userId: str | None = None


@app.post("/internal/init-session")
async def init_session(data: SessionInit):
    """Called by Matching Service once a match is found."""
    try:
        await redis_client.set(f"question:{data.matchId}", json.dumps(data.question), ex=86400)
        exists = await redis_client.exists(f"code:{data.matchId}")
        if not exists:
            await redis_client.set(f"code:{data.matchId}", "# Start collaborating...\n", ex=86400)
        print(f"Session {data.matchId} initialized.")
        return {"status": "success", "matchId": data.matchId}
    except Exception as e:
        print(f"Error initializing session: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.get("/session/{matchId}")
async def get_session(matchId: str):
    """Fetches current session state — used for page refresh / rejoin."""
    question = await redis_client.get(f"question:{matchId}")
    code = await redis_client.get(f"code:{matchId}")
    saved = await redis_client.get(f"saved_code:{matchId}")
    return {
        "question": json.loads(question) if question else None,
        "code": code or "",
        "savedCode": saved or None,
    }


@app.post("/session/{matchId}/save")
async def save_code(matchId: str, data: SaveCode):
    """
    Permanently saves the current code snapshot.
    Stored separately from the live-sync key so it survives TTL.
    Uses no expiry — this is the permanent save.
    """
    try:
        payload = {
            "content": data.content,
            "savedBy": data.userId,
            "matchId": matchId,
        }
        await redis_client.set(f"saved_code:{matchId}", json.dumps(payload))
        print(f"Code saved permanently for session {matchId} by user {data.userId}")
        return {"status": "saved", "matchId": matchId}
    except Exception as e:
        print(f"Error saving code: {e}")
        raise HTTPException(status_code=500, detail="Failed to save code")


@app.get("/")
async def root():
    return {"service": "Collaboration Service", "status": "online"}


@sio.event
async def connect(sid, environ):
    print(f"[+] Client connected: {sid}")


@sio.event
async def disconnect(sid):
    print(f"[-] Client disconnected: {sid}")


@sio.event
async def join_room(sid, data):
    match_id = data.get('matchId')
    if match_id:
        await sio.enter_room(sid, match_id)
        print(f"[+] {sid} joined room {match_id}")


@sio.event
async def request_history(sid, data):
    match_id = data.get('matchId')
    if match_id:
        existing_code = await redis_client.get(f"code:{match_id}")
        if existing_code:
            await sio.emit('code_received', {'content': existing_code}, to=sid)
            print(f"[+] Sent history to {sid} for room {match_id}")


@sio.event
async def code_update(sid, data):
    match_id = data.get('matchId')
    content = data.get('content')
    if match_id and content is not None:
        await redis_client.set(f"code:{match_id}", content, ex=86400)
        await sio.emit(
            'code_received',
            {'content': content},
            room=match_id,
            skip_sid=sid
        )
        print(f"[*] Room {match_id} synced by {sid}")


@sio.event
async def chat_message(sid, data):
    """
    Broadcast a chat message to everyone in the room except the sender.
    Expected payload: { matchId, message, sender, senderId }
    """
    match_id = data.get('matchId')
    if not match_id:
        return
    await sio.emit(
        'chat_message',
        {
            'sender': data.get('sender', 'Anonymous'),
            'message': data.get('message', ''),
            'senderId': data.get('senderId'),
        },
        room=match_id,
        skip_sid=sid
    )
    print(f"Chat in room {match_id} from {data.get('sender')}: {data.get('message')}")


@sio.event
async def leave_room(sid, data):
    match_id = data.get('matchId')
    if match_id:
        await sio.leave_room(sid, match_id)
        print(f"[-] {sid} left room {match_id}")
