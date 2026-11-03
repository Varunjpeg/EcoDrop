import asyncio
import random
import uuid
import time
from typing import Dict, Any, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="EcoDrop Mock Pi Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MOCK_ITEMS = [
    {"type": "plastic_bottle", "display": "Plastic Bottle (PET)", "condition": "good", "base_coins": 20, "cond_mult": 0.85, "recycle": 0.95, "co2_kg": 0.1, "bin": 1},
    {"type": "textbook", "display": "Textbook", "condition": "fair", "base_coins": 35, "cond_mult": 0.65, "recycle": 0.80, "co2_kg": 0.5, "bin": 3},
    {"type": "pen", "display": "Ballpoint Pen", "condition": "good", "base_coins": 8, "cond_mult": 0.85, "recycle": 0.60, "co2_kg": 0.02, "bin": 2},
    {"type": "cardboard", "display": "Cardboard", "condition": "excellent", "base_coins": 10, "cond_mult": 1.0, "recycle": 0.85, "co2_kg": 0.15, "bin": 3},
    {"type": "earphones", "display": "Earphones (E-waste)", "condition": "good", "base_coins": 60, "cond_mult": 0.85, "recycle": 0.70, "co2_kg": 1.2, "bin": 4},
    {"type": "paper_bundle", "display": "Paper Bundle (~100g)", "condition": "good", "base_coins": 12, "cond_mult": 0.85, "recycle": 0.90, "co2_kg": 0.08, "bin": 3},
]

# In-memory storage for active sessions
# Format: session_id -> { "status": str, "result": dict, "machine_id": str, "timestamp": float }
sessions: Dict[str, Dict[str, Any]] = {}

# Active WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)

    async def broadcast_status(self, session_id: str, status_data: Dict[str, Any]):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                await connection.send_json(status_data)

manager = ConnectionManager()

class SessionStartRequest(BaseModel):
    machine_id: str = "MACH_001"
    user_id: str = None

@app.get("/health")
def health_check():
    return {"status": "ok", "machine_id": "MACH_001", "ble": "connected"}

@app.get("/machine/info")
def machine_info():
    return {
        "id": "MACH_001",
        "name": "EcoDrop #001",
        "location": "Main Block Entrance",
        "status": "active",
        "bins": 4
    }

@app.get("/machine/stats")
def machine_stats():
    return {
        "total_items_processed": 1420,
        "uptime_hours": 342.5
    }

@app.post("/session/start")
def start_session(req: SessionStartRequest):
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "status": "started",
        "machine_id": req.machine_id,
        "user_id": req.user_id,
        "timestamp": time.time(),
        "result": None
    }
    return {"session_id": session_id, "machine_id": req.machine_id, "timestamp": sessions[session_id]["timestamp"]}

@app.post("/session/{session_id}/item-detected")
async def item_detected(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    session["status"] = "analyzing"
    await manager.broadcast_status(session_id, {"status": "analyzing"})
    
    # Simulate AI processing time
    await asyncio.sleep(3)
    
    # Randomly select a mock item
    item = random.choice(MOCK_ITEMS).copy()
    
    # Calculate coins: base_coins * condition_multiplier
    coins = int(item["base_coins"] * item["cond_mult"])
    item["calculated_coins"] = coins
    item["confidence"] = round(random.uniform(0.85, 0.99), 2)
    
    session["status"] = "analyzed"
    session["result"] = item
    
    await manager.broadcast_status(session_id, {"status": "analyzed", "result": item})
    
    return {"status": "analyzed", "result": item}

@app.get("/session/{session_id}/result")
def get_result(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    result = sessions[session_id].get("result")
    if not result:
        return {"status": sessions[session_id]["status"], "message": "No result yet"}
        
    return result

@app.get("/session/{session_id}/status")
def get_status(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"status": sessions[session_id]["status"]}

@app.post("/session/{session_id}/confirm")
async def confirm_deposit(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if sessions[session_id]["status"] != "analyzed":
        raise HTTPException(status_code=400, detail="Cannot confirm, no item analyzed")
    
    sessions[session_id]["status"] = "confirmed"
    await manager.broadcast_status(session_id, {"status": "confirmed", "message": "Bin opening, item deposited"})
    
    # Simulate hardware action
    await asyncio.sleep(2)
    
    sessions[session_id]["status"] = "completed"
    await manager.broadcast_status(session_id, {"status": "completed"})
    
    return {"status": "completed", "message": "Item successfully deposited"}

@app.post("/session/{session_id}/reject")
async def reject_deposit(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    sessions[session_id]["status"] = "rejected"
    await manager.broadcast_status(session_id, {"status": "rejected", "message": "Item rejected by user"})
    
    return {"status": "rejected"}

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    try:
        while True:
            # Keep connection alive, wait for client messages if any
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
