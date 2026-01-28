"""
FastAPI Backend for SSH Terminal Mini App
WebSocket endpoints for real-time terminal I/O
"""

import os
import json
import uuid
import asyncio
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from ssh_handler import SSHCredentials, SSHSession, session_manager

# Load environment
load_dotenv()

PORT = int(os.getenv("PORT", "8000"))
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    yield
    # Cleanup on shutdown
    session_manager.disconnect_all()


app = FastAPI(
    title="SSH Terminal API",
    description="WebSocket API for SSH Terminal Mini App",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS + ["*"],  # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class ConnectRequest(BaseModel):
    host: str
    port: int = 22
    username: str
    password: Optional[str] = None
    private_key: Optional[str] = None
    passphrase: Optional[str] = None


class ConnectResponse(BaseModel):
    success: bool
    message: str
    session_id: Optional[str] = None


class ResizeRequest(BaseModel):
    cols: int
    rows: int


# REST endpoints
@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "service": "SSH Terminal API"}


@app.post("/api/connect", response_model=ConnectResponse)
async def connect_ssh(request: ConnectRequest):
    """
    Create SSH connection and return session ID.
    Use the session_id to connect via WebSocket.
    """
    # Generate session ID
    session_id = str(uuid.uuid4())
    
    # Create session
    session = session_manager.create_session(session_id)
    
    # Connect
    credentials = SSHCredentials(
        host=request.host,
        port=request.port,
        username=request.username,
        password=request.password,
        private_key=request.private_key,
        passphrase=request.passphrase
    )
    
    success, message = session.connect(credentials)
    
    if not success:
        session_manager.remove_session(session_id)
        return ConnectResponse(success=False, message=message)
    
    return ConnectResponse(
        success=True,
        message=message,
        session_id=session_id
    )


@app.post("/api/disconnect/{session_id}")
async def disconnect_ssh(session_id: str):
    """Disconnect SSH session"""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_manager.remove_session(session_id)
    return {"success": True, "message": "Disconnected"}


@app.post("/api/resize/{session_id}")
async def resize_terminal(session_id: str, request: ResizeRequest):
    """Resize terminal PTY"""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    success = session.resize(request.cols, request.rows)
    return {"success": success}


# WebSocket endpoint
@app.websocket("/ws/terminal/{session_id}")
async def terminal_websocket(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for terminal I/O.
    
    Client sends: {"type": "input", "data": "..."} or {"type": "resize", "cols": N, "rows": M}
    Server sends: {"type": "output", "data": "..."} or {"type": "error", "message": "..."}
    """
    await websocket.accept()
    
    session = session_manager.get_session(session_id)
    if not session or not session.is_connected:
        await websocket.send_json({"type": "error", "message": "Session not found or not connected"})
        await websocket.close()
        return
    
    # Task to read from SSH and send to WebSocket
    async def read_ssh_output():
        try:
            async for data in session.read_output():
                if data:
                    # Send as base64 or raw text
                    try:
                        text = data.decode('utf-8', errors='replace')
                        await websocket.send_json({"type": "output", "data": text})
                    except Exception:
                        pass
        except Exception as e:
            try:
                await websocket.send_json({"type": "error", "message": str(e)})
            except:
                pass
    
    # Start reading task
    read_task = asyncio.create_task(read_ssh_output())
    
    try:
        while True:
            # Receive message from client
            try:
                message = await websocket.receive_json()
            except:
                break
            
            msg_type = message.get("type")
            
            if msg_type == "input":
                # Send input to SSH
                data = message.get("data", "")
                session.send(data)
                
            elif msg_type == "resize":
                # Resize PTY
                cols = message.get("cols", 80)
                rows = message.get("rows", 24)
                session.resize(cols, rows)
                
            elif msg_type == "ping":
                # Keep-alive
                await websocket.send_json({"type": "pong"})
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass
    finally:
        # Cleanup
        read_task.cancel()
        try:
            await read_task
        except asyncio.CancelledError:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
