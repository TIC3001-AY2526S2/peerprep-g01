import redis.asyncio as redis
import json

r = redis.from_url("redis://localhost:6379")

async def apply_code_op(session_id: str, op: dict):
    key = f"session:{session_id}:code"
    # get current buffer, apply op, write back
    current = await r.get(key) or b""
    new_code = apply_operation(current.decode(), op)  # your OT/CRDT logic
    await r.set(key, new_code)

async def update_cursor(session_id: str, user_id: str, position: dict):
    key = f"session:{session_id}:cursors"
    await r.hset(key, user_id, json.dumps(position))

async def get_session(session_id: str):
    key = f"session:{session_id}:meta"
    data = await r.hgetall(key)
    return {k.decode(): v.decode() for k, v in data.items()}
