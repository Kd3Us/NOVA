from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
from datetime import datetime
import uuid

app = FastAPI(
    title="NOVA API",
    description="API Intelligence Artificielle pour l'Interface NOVA",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    message: str
    user_id: Optional[str] = "user"
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    id: str
    content: str
    timestamp: datetime
    model_used: str
    processing_time: float
    session_id: str

class HealthCheck(BaseModel):
    status: str
    timestamp: datetime
    version: str
    ai_model_status: str

class AIModelConfig(BaseModel):
    model_name: str
    model_type: str
    api_key_configured: bool
    max_tokens: int
    temperature: float

sessions_db = {}
messages_history = {}

@app.get("/", response_model=dict)
async def root():
    return {
        "message": "NOVA API",
        "status": "active",
        "documentation": "/docs"
    }

@app.get("/health", response_model=HealthCheck)
async def health_check():
    return HealthCheck(
        status="operational",
        timestamp=datetime.now(),
        version="1.0.0",
        ai_model_status="ready_for_configuration"
    )

@app.get("/ai/models", response_model=List[AIModelConfig])
async def get_available_models():
    return [
        AIModelConfig(
            model_name="gpt-3.5-turbo",
            model_type="openai",
            api_key_configured=False,
            max_tokens=4096,
            temperature=0.7
        ),
        AIModelConfig(
            model_name="claude-3-sonnet",
            model_type="anthropic",
            api_key_configured=False,
            max_tokens=4096,
            temperature=0.7
        ),
        AIModelConfig(
            model_name="llama-2-7b",
            model_type="huggingface",
            api_key_configured=False,
            max_tokens=2048,
            temperature=0.8
        ),
        AIModelConfig(
            model_name="nova-simulator",
            model_type="simulation",
            api_key_configured=True,
            max_tokens=1000,
            temperature=0.7
        )
    ]

@app.post("/chat", response_model=ChatResponse)
async def chat_with_ai(message_data: ChatMessage):
    try:
        session_id = message_data.session_id or str(uuid.uuid4())
        message_id = str(uuid.uuid4())
        
        start_time = datetime.now()
        
        ai_response = await process_with_ai_model(
            message=message_data.message,
            session_id=session_id,
            user_id=message_data.user_id
        )
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        if session_id not in messages_history:
            messages_history[session_id] = []
        
        messages_history[session_id].append({
            "user_message": message_data.message,
            "ai_response": ai_response,
            "timestamp": datetime.now()
        })
        
        return ChatResponse(
            id=message_id,
            content=ai_response,
            timestamp=datetime.now(),
            model_used="nova-simulator",
            processing_time=processing_time,
            session_id=session_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur IA: {str(e)}")

@app.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    if session_id not in messages_history:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    
    return {
        "session_id": session_id,
        "message_count": len(messages_history[session_id]),
        "messages": messages_history[session_id]
    }

@app.delete("/chat/history/{session_id}")
async def clear_chat_history(session_id: str):
    if session_id in messages_history:
        del messages_history[session_id]
        return {"message": f"Historique de la session {session_id} effacé"}
    else:
        raise HTTPException(status_code=404, detail="Session non trouvée")

async def process_with_ai_model(message: str, session_id: str, user_id: str) -> str:
    message_lower = message.lower()
    
    responses = {
        "bonjour": "Bonjour ! Comment puis-je vous assister aujourd'hui ?",
        "salut": "Salut ! Que puis-je faire pour vous ?",
        "comment": "Excellente question ! Laissez-moi analyser cela pour vous.",
        "aide": "Je suis là pour vous aider. Que souhaitez-vous savoir ?",
        "mission": "Mission reçue ! Analyse en cours...",
        "test": "Test système réussi ! Tous les systèmes sont opérationnels.",
        "merci": "De rien ! C'est un plaisir de vous assister.",
    }
    
    for keyword, response in responses.items():
        if keyword in message_lower:
            return f"{response}\n\nAnalyse de votre message : '{message}' - Session: {session_id[:8]}"
    
    return f"""Analyse terminée !

Votre message: "{message}"

Résultat de l'analyse:
- Message traité avec succès

Comment puis-je vous assister davantage ?"""

if __name__ == "__main__":
    print("Lancement de l'API NOVA")
    print("Interface disponible sur: http://localhost:8000")
    print("Documentation: http://localhost:8000/docs")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )