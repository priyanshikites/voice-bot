from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import requests
import logging
from typing import Optional, List
import json
import csv  # New import to work with CSV files

# New imports for the RAG system
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice_assistant")

print("Starting application...")
load_dotenv()
print(f"OpenAI API Key configured: {bool(os.getenv('OPENAI_API_KEY'))}")

app = FastAPI(title="Voice Assistant API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# System Prompt
# ----------------------------
SYSTEM_MESSAGE_TEMPLATE = """
You are a Business Development Executive at iKITES.ai, passionate about transforming healthcare through AI innovation.  
You represent iKITES.ai in both Hindi and English, adapting seamlessly to the client's preferred language—even if they switch mid-conversation. Maintain a professional yet engaging tone.  
You are a female executive, so talk like a female.

### Your Approach as a BD Executive:  

#### 1. Initial Connection:  
- Start with a professional greeting in both languages.  
- Introduce yourself as part of iKITES.ai's Business Development team.  
- Example:  
  - **"Namaste/Hello! I'm from iKITES.ai's Business Development team. How may I assist you today?"**  
  - **"नमस्ते! मैं iKITES.ai की बिज़नेस डेवलपमेंट टीम से बात कर रहा/रही हूं। मैं आपकी क्या मदद कर सकता/सकती हूं?"**  
- Get their name early in the conversation to personalize the interaction.  
- If they start in one language but switch, match their language dynamically to maintain comfort.  

#### 2. Qualify the Opportunity:  
Understand if they are:  
a) A **Healthcare Provider/Institution**  
b) A **Technology Company** looking for healthcare AI solutions  
c) An **Investor or Potential Partner**  
d) Someone **exploring healthcare innovation possibilities**  

#### 3. Value Proposition Delivery (Tailor it based on their profile):  
- **For Healthcare Providers:** Focus on patient outcomes, efficiency improvements, and ROI.  
- **For Tech Companies:** Emphasize our technical expertise and successful deployments.  
- **For Investors:** Highlight market opportunity and innovation pipeline.  
- Use the **"search"** function to provide specific, relevant examples.  

#### 4. Our Unique Strengths:  
- Cutting-edge **AI & Computer Vision** in Healthcare  
- Proven track record across multiple **healthcare domains**  
- Global presence (**India & USA**) with local expertise  
- End-to-end capabilities from **R&D to deployment**  
- Strong **IP portfolio and patenting services**  

#### 5. Solution Discussion:  
- **Listen carefully** to their challenges.  
- Present relevant **case studies and success stories**.  
- Explain how our solutions **address their specific needs**.  
- Discuss implementation **approach and timeline**.  
- Focus on **ROI and business impact**.  

#### 6. Next Steps & Contact Collection:  
When the conversation shows **positive intent**:  
- "To help you better, could I get your contact details? We'll have our specialized team reach out to discuss this further."  
- "आपकी बेहतर मदद के लिए, क्या आप अपने संपर्क विवरण साझा कर सकते हैं? हमारी विशेषज्ञ टीम जल्द ही आपसे संपर्क करेगी।"  
- Collect: **Name, Organization, Role, Email, Phone**  
- Suggest a **follow-up meeting or demo session**  
- Then, store the client's **contact details** and **conversation summary** into our records. Ensure you call the `"store_call_info"` function to save the client's **contact details** and **conversation summary** into our records.  

---

### Additional Key Guidelines:  
✅ **Dynamic Language Switching:** If the client changes language, smoothly switch to match them.  
✅ **Industry-Specific Terminology:** Use precise healthcare and AI terminology.  
✅ **Data-Driven Approach:** Share relevant **success metrics and KPIs**.  
✅ **Pricing & Engagement Models:** Be ready with **ballpark pricing** and engagement structures.  
✅ **Long-Term Partnership Focus:** Build **trust and rapport** for sustainable collaboration.  
✅ **Up-to-Date Information:** Use the `"search"` function to access the latest insights.  
✅ **Pronunciation:** iKITES.ai or iKITES should be pronounced as **i-kites**.  

---

Your **goal** is to identify **qualified opportunities**, demonstrate **iKITES.ai's value proposition effectively**, and move prospects towards meaningful **business engagements**. Maintain **professionalism**, while adapting to the client's communication style.  
"""

# ----------------------------
# RAG and Vector DB Setup
# ----------------------------

# Initialize the sentence transformer embedding model.
# Using 'all-MiniLM-L6-v2' which is fast and commonly used.
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# Create a local Chroma vector database (in-memory) by setting persist_directory to an empty string
chroma_client = chromadb.Client(Settings(persist_directory=""))
collection_name = "hospital_docs"

def initialize_vector_db():
    """
    Load the company information from chunks.json,
    compute embeddings, and add them to the local Chroma collection.
    """
    try:
        collection = chroma_client.get_collection(name=collection_name)
        # Use the collection if already initialized and not empty
        if len(collection.get()["ids"]) > 0:
            logger.info("Vector DB already initialized.")
            return collection
    except Exception:
        collection = chroma_client.create_collection(name=collection_name)
    
    try:
        with open("chunks.json", "r", encoding="utf-8") as f:
            chunks_data = json.load(f)
    except Exception as e:
        logger.error(f"Error reading chunks.json: {e}")
        chunks_data = []
        
    if chunks_data:
        # Create text chunks by combining title and content
        chunks = [f"{chunk['title']}\n{chunk['content']}" for chunk in chunks_data]
        ids = [f"chunk_{i}" for i in range(len(chunks))]
        # Compute embeddings for each chunk
        embeddings = embedding_model.encode(chunks).tolist()
        # Store each chunk as metadata
        metadatas = [{"text": chunk} for chunk in chunks]
        collection.add(documents=chunks, metadatas=metadatas, ids=ids, embeddings=embeddings)
        logger.info(f"Initialized vector DB with {len(chunks)} chunks.")
    else:
        logger.error("No data loaded from chunks.json")
    return collection

# Initialize the vector database on startup.
vector_collection = initialize_vector_db()

# Define request/response models for the RAG endpoint
class RagRequest(BaseModel):
    conversation_id: Optional[str] = None
    query: str

class RagResponse(BaseModel):
    context: List[str]

@app.post("/rag", response_model=RagResponse)
async def rag_endpoint(request: RagRequest):
    """
    Given a query from the user, compute its embedding and retrieve the top
    three most similar chunks from the local vector DB.
    """
    try:
        # Compute the query embedding using the same model.
        query_embedding = embedding_model.encode([request.query]).tolist()[0]
        # Query the vector DB for top 3 matches.
        results = vector_collection.query(query_embeddings=[query_embedding], n_results=3)
        # Extract the matched documents (chunks)
        context_docs = results.get("documents", [[]])[0]
        return RagResponse(context=context_docs)
    except Exception as e:
        logger.error(f"Error in RAG endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------
# Existing Endpoints
# ----------------------------

@app.get("/token")
async def get_token(
    voice: Optional[str] = "coral",
    modalities: Optional[List[str]] = ["audio", "text"],
    system_prompt: Optional[str] = None
):
    try:
        response = requests.post(
            "https://api.openai.com/v1/realtime/sessions",
            headers={
                "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o-realtime-preview",
                "modalities": modalities,
                "voice": "coral",
                "instructions": system_prompt or SYSTEM_MESSAGE_TEMPLATE,
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "temperature": 0.7,
                "max_response_output_tokens": 4096,
            }
        )
        return response.json()
        
    except Exception as e:
        logger.error(f"Error generating token: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "api_key_configured": bool(os.getenv('OPENAI_API_KEY')),
        "supported_voices": [
            "alloy", "echo", "fable", "onyx", "nova", "shimmer", "coral"
        ]
    }

# Define a model for call information with additional fields
class CallInfo(BaseModel):
    name: str
    email: str
    summary: str
    conversation_id: Optional[str] = None
    phone: Optional[str] = None
    organization: Optional[str] = None

@app.post("/store_call_info")
async def store_call_info(call_info: CallInfo):
    """
    Endpoint to store call details after a consultation.
    Accepts user's contact details (name, email, summary, and optionally phone and organization).
    The details are saved in a local CSV file.
    """
    try:
        logger.info(f"Storing call information: {call_info}")
        file_path = "contact_info.csv"
        file_exists = os.path.exists(file_path)
        # Updated fieldnames with additional info.
        fieldnames = ["name", "email", "summary", "conversation_id", "phone", "organization"]
        
        with open(file_path, mode='a', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            if not file_exists:
                writer.writeheader()
            writer.writerow(call_info.dict())
            
        return {"status": "success", "message": "Call information stored successfully"}
    except Exception as e:
        logger.error(f"Error storing call info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"\nStarting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)