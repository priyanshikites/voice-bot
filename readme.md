# iKITES.ai Voice Assistant Codebase Documentation

This documentation provides an overview of the project's structure, key files, endpoints, and the overall architecture. The project powers a voice-enabled AI assistant for iKITES.ai, a healthcare innovation company. The assistant helps prospects learn more about the company, its offerings, and collects contact details for follow-up.

---

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Backend](#backend)
  - [Key Files](#key-files)
  - [Endpoints](#endpoints)
  - [Vector Database Setup](#vector-database-setup)
  - [System Prompt](#system-prompt)
- [Frontend](#frontend)
  - [Client Application](#client-application)
  - [Call Setup & WebRTC](#call-setup--webrtc)
  - [Data Channel and Function Calls](#data-channel-and-function-calls)
- [Configuration & Environment](#configuration--environment)
- [How It Works Together](#how-it-works-together)
- [Additional Notes](#additional-notes)

---

## Overview

The iKITES.ai voice assistant codebase comprises two main parts:

1. **Backend (Python / FastAPI)**:
   - Serves endpoints for managing real-time sessions, healthcare knowledge searches, and storing call information.
   - Uses a retrieval augmented generation (RAG) system to pull context from a pre-defined knowledge base (stored in `chunks.json`).
   - Embeds company information using the SentenceTransformer model and stores these embeddings in an in-memory Chroma vector database.

2. **Frontend (React)**:
   - Provides a web interface for users to start and end a consultation.
   - Manages the WebRTC connection for audio and data channel interactions with the backend.
   - Integrates with backend endpoints to call search functions and store call details.

---

## Project Structure

```
├── chunks.json               # JSON file containing company info chunks for search functionality.
├── main.py                   # Main backend file; includes API endpoints and vector DB setup.
├── contact_info.csv          # File for storing call details.
├── client
│   └── src
│       └── App.js          # React application for the client-side interface.
└── .gitignore                # Git ignore file.
```

---

## Backend

### Key Files

- **chunks.json**  
  Contains an array of JSON objects. Each object represents a text chunk containing various pieces of company-related information. These chunks build the vector database for retrieval augmented generation.

- **main.py**  
  The main FastAPI application. It:
  - Loads environment variables.
  - Initializes logging.
  - Sets up the FastAPI app with CORS.
  - Reads `chunks.json`, computes embeddings using the SentenceTransformer model, and stores them in an in-memory Chroma vector database.
  - Exposes endpoints like `/rag`, `/token`, `/health`, and `/store_call_info`.

### Endpoints

#### 1. `/rag`  
**Method:** POST  
**Description:**  
Receives a query from the user, computes its embedding, and queries the Chroma vector database to return the top three most similar document chunks from the company's knowledge base.

**Request Model:**  
- `conversation_id` (optional)
- `query` (string)

**Response Model:**  
- `context`: List of text chunks (strings).

---

#### 2. `/token`  
**Method:** GET  
**Description:**  
Generates a token (client secret) from OpenAI's realtime sessions API. This token is used to initiate a WebRTC connection for real-time interactions (voice and text).

---

#### 3. `/health`  
**Method:** GET  
**Description:**  
A basic health endpoint that returns:
- The API status (e.g., `"healthy"`).
- The status of the OpenAI API key configuration.
- A list of supported voices.

---

#### 4. `/store_call_info`  
**Method:** POST  
**Description:**  
Receives call information (client name, email, call summary, optionally phone, organization, and conversation id) and appends it to a local CSV file (`contact_info.csv`).

---

### Vector Database Setup

- **Embedding Model:**  
  Utilizes the SentenceTransformer model `all-MiniLM-L6-v2` to compute text chunk embeddings.

- **Chroma Vector DB:**  
  An in-memory database is created using the `chromadb` library with the collection name `hospital_docs`. The function `initialize_vector_db()`:
  - Checks if the collection is already initialized.
  - Loads the data from `chunks.json`.
  - Creates text chunks by combining titles and content.
  - Computes embeddings and stores them along with metadata.

---

### System Prompt

The system prompt (defined in `main.py`) instructs the assistant to behave as a Business Development Executive for iKITES.ai. It covers:
- Greeting and bilingual style (English/Hindi).
- Qualification of opportunities.
- Value proposition explanations.
- Dynamic language switching.
- Function call guidelines for search and call info storage.

---

## Frontend

### Client Application

- **File:** `client/src/App.js`

**Overview:**  
The React app manages the user's interface for the voice assistant, including:
- Displaying the call status, duration timer, and control buttons.
- Handling the initiation and termination of a consultation.
- Adapting UI elements during different call states.

---

### Call Setup & WebRTC

- **Initiating a Call:**  
  Upon starting a consultation:
  - A token is requested from the `/token` endpoint.
  - An `RTCPeerConnection` is established with a corresponding data channel.
  - The local audio is captured via `navigator.mediaDevices.getUserMedia` and added to the connection.
  - An SDP offer is created and sent to OpenAI's realtime API, with the remote SDP answer completing the handshake.

---

### Data Channel and Function Calls

- **Data Channel Setup:**  
  The data channel is used for sending tool configurations and receiving messages. Upon opening:
  - The client sends a configuration that includes the `search` function (which queries the `/rag` endpoint) and the `store_call_info` function (which records call details).

- **Handling Incoming Messages:**  
  The client processes data channel messages, logs transcripts, and handles function call requests by:
  - Performing a search (calling `/rag`) and sending the formatted results back.
  - Forwarding call details to `/store_call_info` when needed.

- **Call Controls:**  
  Buttons allow users to start and end sessions. Ending a call shuts down both the data channel and the RTCPeerConnection, then resets the timer.

---

## Configuration & Environment

- **Environment Variables:**  
  Configurations (like `OPENAI_API_KEY`) are loaded from a `.env` file, which is included in Git's ignore rules.

- **.gitignore:**  
  Ensures that sensitive or heavy files are not committed. Relevant entries include:
  - `venv` – Virtual environment files.
  - `client/node_modules` – Node modules (for the React app).
  - `.env` – Environment variable definitions.

---

## How It Works Together

1. **Startup:**  
   - The backend initializes with FastAPI, loads data from `chunks.json`, computes embeddings, and sets up the in-memory Chroma vector database.
   - The system prompt is prepared to guide the assistant's behavior.

2. **Client-Initiated Call:**  
   - The user starts the consultation.
   - The frontend establishes a WebRTC connection using a token from `/token`, setting up an SDP handshake and opening a data channel.

3. **During the Call:**  
   - The assistant processes user inputs and executes function calls (like search queries) via the data channel.
   - Backend endpoints are called (e.g., `/rag` for search and `/store_call_info` for storing call info).

4. **Recording Interaction Data:**  
   - After the session, call details are sent to the `/store_call_info` endpoint and saved in a CSV file for follow-up.

---

## Additional Notes

- **Logging & Error Handling:**  
  Robust logging and error handling are implemented on both sides to capture and manage issues (like network failures or malformed responses).

- **Extensibility:**  
  The design allows for easy addition of new endpoints or functions. Future enhancements could include more tools or improved interactivity.

- **Real-time Interactivity:**  
  The integration between WebRTC (via the data channel) and backend API endpoints ensures a seamless, low-latency interactive experience.

---