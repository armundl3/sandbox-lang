from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ChatRequest
from ..chat_service import chat_service
import json
import asyncio

router = APIRouter(tags=["chat"])

@router.post("/chat/stream")
async def stream_chat(request: ChatRequest):
    """Stream chat response using Server-Sent Events."""
    
    async def event_generator():
        try:
            async for chunk in chat_service.stream_chat_response(
                request.message, 
                request.conversation_id
            ):
                # Send as Server-Sent Event
                data = json.dumps(chunk)
                yield f"data: {data}\n\n"
        except Exception as e:
            error_data = json.dumps({"type": "error", "error": str(e)})
            yield f"data: {error_data}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )