import asyncio
import websockets
import json

async def user(user_id):
    uri = "ws://localhost:8000/ws/match"

    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({
            "user_id": user_id,
            "category": "data_structure",
            "complexity": "easy"
        }))

        while True:
            msg = await ws.recv()
            print(f"{user_id} received:", msg)

async def another_test(user_id):
    uri = "ws://localhost:8000/ws/match"

    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({
            "user_id": user_id,
            "category": "database",
            "complexity": "easy"
        }))

        while True:
            msg = await ws.recv()
            print(f"{user_id} received:", msg)

async def main():
    await asyncio.gather(
        user("userA"),
        user("userB"),
        another_test("userC")
    )

asyncio.run(main())