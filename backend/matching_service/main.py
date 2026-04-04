from fastapi import FastAPI
from routes.websocket import router as websocket_router

app = FastAPI()

app.include_router(websocket_router)


@app.get('/')
def root():
    return {'message': '[+] Matching service running'}