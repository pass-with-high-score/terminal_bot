"""
SSH Handler with PTY support for real interactive shell.
Supports streaming I/O through async generators.
"""

import paramiko
import asyncio
import io
import socket
import threading
from typing import Optional, Tuple, AsyncGenerator
from dataclasses import dataclass


@dataclass
class SSHCredentials:
    host: str
    port: int
    username: str
    password: Optional[str] = None
    private_key: Optional[str] = None
    passphrase: Optional[str] = None


class SSHSession:
    """Interactive SSH session with PTY support"""
    
    def __init__(self):
        self.client: Optional[paramiko.SSHClient] = None
        self.channel: Optional[paramiko.Channel] = None
        self._connected = False
        self._stop_event = threading.Event()
    
    def connect(self, credentials: SSHCredentials) -> Tuple[bool, str]:
        """
        Connect to SSH server and open PTY channel.
        
        Returns:
            Tuple[bool, str]: (success, message)
        """
        try:
            self.client = paramiko.SSHClient()
            self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            # Parse private key if provided
            pkey = None
            if credentials.private_key:
                pkey = self._parse_private_key(
                    credentials.private_key, 
                    credentials.passphrase
                )
                if pkey is None:
                    return False, "Invalid private key format"
            
            # Connect
            self.client.connect(
                hostname=credentials.host,
                port=credentials.port,
                username=credentials.username,
                password=credentials.password,
                pkey=pkey,
                timeout=10,
                look_for_keys=False,
                allow_agent=False
            )
            
            # Open PTY channel
            self.channel = self.client.invoke_shell(
                term='xterm-256color',
                width=120,
                height=30
            )
            self.channel.setblocking(False)
            self._connected = True
            
            return True, f"Connected to {credentials.username}@{credentials.host}"
            
        except paramiko.AuthenticationException:
            return False, "Authentication failed"
        except socket.timeout:
            return False, f"Connection timeout to {credentials.host}:{credentials.port}"
        except socket.error as e:
            return False, f"Connection error: {str(e)}"
        except Exception as e:
            return False, f"Error: {str(e)}"
    
    def _parse_private_key(
        self, 
        key_content: str, 
        passphrase: Optional[str] = None
    ) -> Optional[paramiko.PKey]:
        """Try to parse private key in various formats"""
        key_file = io.StringIO(key_content)
        
        # Try RSA
        try:
            key_file.seek(0)
            return paramiko.RSAKey.from_private_key(key_file, password=passphrase)
        except paramiko.SSHException:
            pass
        
        # Try Ed25519
        try:
            key_file.seek(0)
            return paramiko.Ed25519Key.from_private_key(key_file, password=passphrase)
        except paramiko.SSHException:
            pass
        
        # Try ECDSA
        try:
            key_file.seek(0)
            return paramiko.ECDSAKey.from_private_key(key_file, password=passphrase)
        except paramiko.SSHException:
            pass
        
        return None
    
    def send(self, data: str) -> bool:
        """Send data to the SSH channel"""
        if not self._connected or not self.channel:
            return False
        
        try:
            self.channel.send(data)
            return True
        except Exception:
            return False
    
    async def read_output(self) -> AsyncGenerator[bytes, None]:
        """
        Async generator that yields output from SSH channel.
        Runs until session is disconnected.
        """
        if not self._connected or not self.channel:
            return
        
        while self._connected and not self._stop_event.is_set():
            try:
                if self.channel.recv_ready():
                    data = self.channel.recv(4096)
                    if data:
                        yield data
                else:
                    await asyncio.sleep(0.01)  # Small delay to prevent busy loop
                    
            except socket.timeout:
                await asyncio.sleep(0.01)
            except Exception:
                break
    
    def resize(self, cols: int, rows: int) -> bool:
        """Resize the PTY"""
        if not self._connected or not self.channel:
            return False
        
        try:
            self.channel.resize_pty(width=cols, height=rows)
            return True
        except Exception:
            return False
    
    def disconnect(self) -> None:
        """Close SSH connection"""
        self._stop_event.set()
        self._connected = False
        
        if self.channel:
            try:
                self.channel.close()
            except:
                pass
            self.channel = None
        
        if self.client:
            try:
                self.client.close()
            except:
                pass
            self.client = None
    
    @property
    def is_connected(self) -> bool:
        """Check if session is still connected"""
        if not self._connected or not self.client:
            return False
        
        try:
            transport = self.client.get_transport()
            return transport is not None and transport.is_active()
        except:
            return False


class SessionManager:
    """Manage multiple SSH sessions"""
    
    def __init__(self):
        self.sessions: dict[str, SSHSession] = {}
    
    def create_session(self, session_id: str) -> SSHSession:
        """Create or get existing session"""
        if session_id not in self.sessions:
            self.sessions[session_id] = SSHSession()
        return self.sessions[session_id]
    
    def get_session(self, session_id: str) -> Optional[SSHSession]:
        """Get session by ID"""
        return self.sessions.get(session_id)
    
    def remove_session(self, session_id: str) -> None:
        """Remove and disconnect session"""
        if session_id in self.sessions:
            self.sessions[session_id].disconnect()
            del self.sessions[session_id]
    
    def disconnect_all(self) -> None:
        """Disconnect all sessions"""
        for session in self.sessions.values():
            session.disconnect()
        self.sessions.clear()


# Global session manager
session_manager = SessionManager()
