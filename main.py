from dotenv import load_dotenv
import os  # Make sure os is imported before load_dotenv

load_dotenv()  # <-- This must be before any os.getenv calls

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import Optional, List
import requests
import logging
import json
import csv

import jwt  # Add this import at the top if not already present
import wave
import speech_recognition as sr

# New imports for the RAG system
from pydantic import BaseModel
# from sentence_transformers import SentenceTransformer
# import chromadb
# from chromadb.config import Settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice_assistant")

print("Starting application...")
logger.info("Environment variables loaded.")
print(f"OpenAI API Key configured: {bool(os.getenv('OPENAI_API_KEY'))}")
logger.info(f"OpenAI API Key configured: {bool(os.getenv('OPENAI_API_KEY'))}")

# Secret key for JWT (should be set in your environment variables)
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"
JWT_EXP_DELTA_MINUTES = 60

baseurl="/voice-bot/api"
app = FastAPI(title="Voice Assistant API")
logger.info("FastAPI application initialized.")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info("CORS middleware configured.")

# ----------------------------
# System Prompt
# ----------------------------
SYSTEM_MESSAGE_TEMPLATE = """
You are a Business Development Executive at iKITES.ai, passionate about revolutionizing healthcare through AI.  
You speak both Hindi and English and dynamically switch based on user preference. Maintain a professional, engaging tone with a confident female voice.

1. Initial Interaction:
- Greet users in both languages:  
  - “Hello! I’m from iKITES.ai's Business Development team. How can I assist you today?”  
  - “नमस्ते! मैं iKITES.ai की बिज़नेस डेवलपमेंट टीम से हूं। मैं आपकी क्या मदद कर सकती हूं?”
- Ask for their name early.

2. Identify Their Role:
Classify the user as one of:
- Healthcare Provider / Institution
- Tech Company exploring health AI
- Investor or Strategic Partner
- Curious Individual

3. iKITES.ai Value Points:
- AI + Computer Vision in Healthcare
- Strong IP Portfolio & Patent Services
- Global (India & USA) Presence
- Full-cycle Delivery (R&D to Deployment)
- Proven Projects with Measurable ROI

4. Customize Your Messaging:
- 🏥 Providers: Talk efficiency, outcomes, ROI  
- 🖥️ Tech: Highlight integrations & expertise  
- 💼 Investors: Showcase market potential  

5. Call to Action:
If user shows interest, ask for contact details:
- “Can I get your name, email, and phone to arrange a follow-up?”  
- “आपका नाम, ईमेल और फ़ोन नंबर मिल सकता है? हमारी टीम आपसे संपर्क करेगी।”

➡️ Use the `store_call_info` function to log:
- name, email, summary, phone, organization

➡️ Use `search` for relevant insights.

Best Practices:
- Match language shifts fluently
- Share results using [ikites] source format  
- Be persuasive, precise, data-driven  
- Explain pricing models if asked  
- Build long-term trust  
- Pronounce iKITES as *i-kites*

**Goal**: Convert conversations into qualified leads and initiate business collaboration."""

DOCTOR_BOT_PROMPT = """
You are a virtual medical assistant at iKITES.ai — trained to offer compassionate, professional support.  
You speak in Hindi or English and adopt a calm, caring **male** voice.  
You **do not diagnose or prescribe** — instead, guide users toward better health decisions.

1. Opening:
- “Hello! I’m your virtual doctor assistant. How can I help you today?”
- “नमस्ते! मैं आपका वर्चुअल हेल्थ असिस्टेंट हूं। आप कैसा महसूस कर रहे हैं?”

2. Responsibilities:
- Listen carefully to symptoms
- Ask relevant follow-up questions
- Suggest helpful steps: rest, hydration, tests, or a doctor visit
- Encourage real consultation:  
  - “This isn’t a diagnosis. Please consult a physician.”

3. Examples of Safe Guidance:
- “It could be a viral infection, but only a doctor can confirm.”
- “Try drinking fluids and resting — but don’t ignore severe symptoms.”

4. Rules:
- ❌ No prescriptions  
- ❌ No definitive medical judgments  
- ✅ Use `search` if asked specific terms  
- ✅ Log conversation via `store_call_info`

🎯 **Goal**: Offer support, encourage medical responsibility, and leave the user more informed and reassured.
"""

PERSONAL_BOT_PROMPT = """
You are a friendly, efficient **personal assistant** at iKITES.ai.  
Your voice is upbeat, female, and conversational. You help the user stay organized, productive, and feel supported — in both English and Hindi.

1. You can:
- Suggest a daily plan
- Help schedule or remember things
- Offer motivational nudges
- Chat casually when user is bored

2. Opening:
- “Hey! I’m your personal assistant. What’s on your mind today?”
- “नमस्ते! मैं आपकी पर्सनल असिस्टेंट हूं। मैं आपकी क्या मदद कर सकती हूं?”

3. Personality:
- Cheerful, non-intrusive
- Supportive and emotionally aware
- Jokes and light talk when asked

4. Tools:
- Use `store_call_info` for saving key moments
- Use `search` if user asks questions you can’t answer directly

**Goal**: Be an intelligent, calm companion who helps the user feel more in control of their day.
"""


# Mapping bot types to their prompts - FIXED MAPPING FOR CONSISTENCY
BOT_PROMPTS = {
    "business": SYSTEM_MESSAGE_TEMPLATE,
    "doctor": DOCTOR_BOT_PROMPT,
    "personal": PERSONAL_BOT_PROMPT,
}

# Define voice configuration for each bot type
BOT_VOICE_CONFIG = {
    "business": "coral",  # Female voice for business executive
    "doctor": "coral",  # Professional voice for doctor
    "personal": "shimmer",  # Cheerful voice for personal assistant
}

# ----------------------------
# RAG and Vector DB Setup
# ----------------------------

# Initialize the sentence transformer embedding model.
# Using 'all-MiniLM-L6-v2' which is fast and commonly used.
# embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# # Create a local Chroma vector database (in-memory) by setting persist_directory to an empty string
# chroma_client = chromadb.Client(Settings(persist_directory=""))
# collection_name = "hospital_docs"


# def initialize_vector_db():
#     """
#     Load the company information from chunks.json,
#     compute embeddings, and add them to the local Chroma collection.
#     """
#     logger.info("Initializing vector database...")
#     try:
#         collection = chroma_client.get_collection(name=collection_name)
#         # Use the collection if already initialized and not empty
#         if len(collection.get()["ids"]) > 0:
#             logger.info("Vector DB already initialized.")
#             return collection
#     except Exception:
#         logger.info("Vector DB collection not found. Creating new collection.")
#         collection = chroma_client.create_collection(name=collection_name)

#     try:
#         with open("chunks.json", "r", encoding="utf-8") as f:
#             chunks_data = json.load(f)
#         logger.info(f"Loaded {len(chunks_data)} chunks from chunks.json.")
#     except Exception as e:
#         logger.error(f"Error reading chunks.json: {e}")
#         chunks_data = []

#     if chunks_data:
#         # Create text chunks by combining title and content
#         chunks = [f"{chunk['title']}\n{chunk['content']}" for chunk in chunks_data]
#         ids = [f"chunk_{i}" for i in range(len(chunks))]
#         # Compute embeddings for each chunk
#         embeddings = embedding_model.encode(chunks).tolist()
#         # Store each chunk as metadata
#         metadatas = [{"text": chunk} for chunk in chunks]
#         collection.add(
#             documents=chunks, metadatas=metadatas, ids=ids, embeddings=embeddings
#         )
#         logger.info(f"Initialized vector DB with {len(chunks)} chunks.")
#     else:
#         logger.error("No data loaded from chunks.json")
#     return collection


# Initialize the vector database on startup.
# vector_collection = initialize_vector_db()


# Define request/response models for the RAG endpoint
# class RagRequest(BaseModel):
#     conversation_id: Optional[str] = None
#     query: str


# class RagResponse(BaseModel):
#     context: List[str]


# @app.post(baseurl+"/rag", response_model=RagResponse)
# async def rag_endpoint(request: RagRequest):
#     """
#     Given a query from the user, compute its embedding and retrieve the top
#     three most similar chunks from the local vector DB.
#     """
#     logger.info(f"Received RAG request: {request}")
#     try:
#         # Compute the query embedding using the same model.
#         query_embedding = embedding_model.encode([request.query]).tolist()[0]
#         # Query the vector DB for top 3 matches.
#         logger.info("Query embedding computed.")
#         results = vector_collection.query(
#             query_embeddings=[query_embedding], n_results=3
#         )
#         # Extract the matched documents (chunks)
#         logger.info("Vector DB queried for top 3 matches.")
#         context_docs = results.get("documents", [[]])[0]
#         logger.info(f"RAG response context: {context_docs}")
#         return RagResponse(context=context_docs)
#     except Exception as e:
#         logger.error(f"Error in RAG endpoint: {e}")
#         raise HTTPException(status_code=500, detail=str(e))


# ----------------------------
# Voice Session Management
# ----------------------------


class VoiceSessionStatus(BaseModel):
    """Model for tracking voice session status"""

    session_id: str
    active: bool
    bot_type: str
    start_time: Optional[str] = None


active_sessions = {}


@app.post(baseurl+"/voice/start")
async def start_voice_session(bot_type: str = "business"):
    """Start a new voice session"""
    logger.info(f"Starting new voice session for bot_type: {bot_type}")
    try:
        # Generate a unique session ID
        import uuid

        session_id = str(uuid.uuid4())

        # Store session information
        import datetime

        active_sessions[session_id] = {
            "active": True,
            "bot_type": bot_type,
            "start_time": datetime.datetime.now().isoformat(),
        }

        logger.info(f"Voice session started: {session_id}")
        return {"session_id": session_id, "status": "started", "bot_type": bot_type}
    except Exception as e:
        logger.error(f"Error starting voice session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post(baseurl+"/voice/end/{session_id}")
async def end_voice_session(session_id: str):
    """End an active voice session"""
    logger.info(f"Ending voice session: {session_id}")
    if session_id in active_sessions:
        active_sessions[session_id]["active"] = False
        logger.info(f"Voice session ended: {session_id}")
        return {"status": "ended", "session_id": session_id}
    else:
        logger.warning(f"Voice session not found: {session_id}")
        raise HTTPException(status_code=404, detail="Session not found")


@app.get(baseurl+"/voice/status/{session_id}")
async def get_voice_session_status(session_id: str):
    """Get the status of a voice session"""
    logger.info(f"Checking status for voice session: {session_id}")
    if session_id in active_sessions:
        logger.info(f"Session status: {active_sessions[session_id]}")
        return active_sessions[session_id]
    else:
        logger.warning(f"Voice session not found: {session_id}")
        raise HTTPException(status_code=404, detail="Session not found")


# ----------------------------
# Existing Endpoints with Updates
# ----------------------------


def verify_jwt_token(authorization: str = Header(...)):
    """
    Dependency to verify JWT token from the Authorization header.
    """
    if not authorization or not authorization.startswith("Bearer "):
        logger.warning("Missing or invalid Authorization header")
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception as e:
        logger.warning(f"JWT verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@app.get(baseurl+"/token")
async def get_token(
    voice: Optional[str] = "coral",
    modalities: Optional[List[str]] = ["audio", "text"],
    system_prompt: Optional[str] = None,
    bot_type: Optional[str] = None,
    user=Depends(verify_jwt_token),  # <-- Require authentication
):
    # Define prompts and voice configs for each bot
    bot_configs = {
        "business": {"prompt": SYSTEM_MESSAGE_TEMPLATE, "voice": "coral"},
        "doctor": {"prompt": DOCTOR_BOT_PROMPT, "voice": "coral"},
        "personal": {"prompt": PERSONAL_BOT_PROMPT, "voice": "shimmer"},
    }
    logger.info(
        f"Token request received. Voice: {voice}, Modalities: {modalities}, system_prompt: {system_prompt}, bot_type: {bot_type}"
    )
    if bot_type == "business":
        system_prompt = SYSTEM_MESSAGE_TEMPLATE
    elif bot_type == "doctor":
        system_prompt = DOCTOR_BOT_PROMPT
    elif bot_type == "personal":
        system_prompt = PERSONAL_BOT_PROMPT
    else:
        system_prompt = SYSTEM_MESSAGE_TEMPLATE

    try:
        response = requests.post(
            "https://api.openai.com/v1/realtime/sessions",
            headers={
                "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-realtime-preview",
                "modalities": modalities,
                "voice": voice,
                "instructions": system_prompt,
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "temperature": 0.7,
                "max_response_output_tokens": 4096,
            },
        )
        logger.info("Token generated successfully.")
        return response.json()
    except Exception as e:
        logger.error(f"Error generating token: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get(baseurl+"/health")
async def health_check():
    """Health check endpoint with enhanced voice information"""
    logger.info("Health check endpoint called.")
    return {
        "status": "healthy",
        "api_key_configured": bool(os.getenv("OPENAI_API_KEY")),
        "supported_voices": [
            "alloy",
            "echo",
            "fable",
            "onyx",
            "nova",
            "shimmer",
            "coral",
        ],
    }


# Define a model for call information with additional fields
class CallInfo(BaseModel):
    name: str
    email: str
    summary: str
    conversation_id: Optional[str] = None
    phone: Optional[str] = None
    organization: Optional[str] = None


@app.post(baseurl+"/store_call_info")
async def store_call_info(call_info: CallInfo):
    """
    Endpoint to store call details after a consultation.
    Accepts user's contact details (name, email, summary, and optionally phone and organization).
    The details are saved in a local CSV file.
    """
    logger.info(f"Received call info to store: {call_info}")
    try:
        file_path = "contact_info.csv"
        file_exists = os.path.exists(file_path)
        # Updated fieldnames with additional info.
        fieldnames = [
            "name",
            "email",
            "summary",
            "conversation_id",
            "phone",
            "organization",
        ]
        with open(file_path, mode="a", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            if not file_exists:
                writer.writeheader()
            writer.writerow(call_info.dict())
        logger.info("Call information stored successfully.")
        return {"status": "success", "message": "Call information stored successfully"}
    except Exception as e:
        logger.error(f"Error storing call info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Add new authentication models
class AuthRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# # Add authentication endpoint
# @app.post(baseurl+"/auth", response_model=AuthResponse)
# async def authenticate(request: AuthRequest):
#     """
#     Authenticate user with username and password from environment variables
#     """
#     logger.info(f"Authentication attempt for username: {request.username}")
#     stored_username = os.getenv("AUTH_USERNAME")
#     stored_password = os.getenv("AUTH_PASSWORD")

#     if not stored_username or not stored_password:
#         logger.error("Authentication credentials not configured")
#         raise HTTPException(
#             status_code=500, detail="Authentication credentials not configured"
#         )

#     if request.username == stored_username and request.password == stored_password:
#         logger.info("Authentication successful.")
#         return AuthResponse(access_token=stored_username)

#     if request.username == stored_username and request.password != stored_password:
#         logger.warning("Invalid password provided")
#         raise HTTPException(status_code=401, detail="Invalid password")

#     if request.username != stored_username and request.password == stored_password:
#         logger.warning("Invalid username provided")
#         raise HTTPException(status_code=401, detail="Invalid username")

#     logger.warning("Invalid username and password provided")
#     raise HTTPException(status_code=401, detail="Invalid username and password")


# Add authentication endpoint
@app.post(baseurl+"/auth", response_model=AuthResponse)
async def authenticate(request: AuthRequest):
    """
    Authenticate user with username and password from environment variables
    """
    logger.info(f"Authentication attempt for username: {request.username}")
    stored_username = os.getenv("AUTH_USERNAME")
    stored_password = os.getenv("AUTH_PASSWORD")

    if not stored_username or not stored_password:
        logger.error("Authentication credentials not configured")
        raise HTTPException(
            status_code=500, detail="Authentication credentials not configured"
        )

    if request.username == stored_username and request.password == stored_password:
        logger.info("Authentication successful.")
        # Create JWT token
        payload = {
            "sub": stored_username,
            "exp": datetime.utcnow() + timedelta(minutes=JWT_EXP_DELTA_MINUTES),
            "iat": datetime.utcnow(),
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return AuthResponse(access_token=token)

    if request.username == stored_username and request.password != stored_password:
        logger.warning("Invalid password provided")
        raise HTTPException(status_code=401, detail="Invalid password")

    if request.username != stored_username and request.password == stored_password:
        logger.warning("Invalid username provided")
        raise HTTPException(status_code=401, detail="Invalid username")

    logger.warning("Invalid username and password provided")
    raise HTTPException(status_code=401, detail="Invalid username and password")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    logger.info(f"Starting server on {host}:{port}")
    print(f"\nStarting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
