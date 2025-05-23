import React, { useState, useEffect } from "react";
import "./VoiceBotInterface.css";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

// The main voice bot interface component
const VoiceBotInterface = ({ botType = "business" }) => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [audioStream, setAudioStream] = useState(null);
  const [tokenData, setTokenData] = useState(null);

  // Title and descriptions for different bot types
  const botInfo = {
    business: {
      title: "Business Executive",
      description: "Your personal business development assistant",
      avatar: "👩‍💼",
      color: "#3498db",
    },
    doctor: {
      title: "Healthcare Assistant",
      description: "Your virtual healthcare guide",
      avatar: "👨‍⚕️",
      color: "#e74c3c",
    },
    personal: {
      title: "Personal Assistant",
      description: "Your daily tasks organizer",
      avatar: "👩‍🔧",
      color: "#2ecc71",
    },
  };

  // Get bot information based on current type
  const currentBot = botInfo[botType] || botInfo.business;

  // Function to start a voice session
  const startSession = async () => {
    try {
      // First, get a token from OpenAI
      localStorage.setItem("bot_type", botType);
      const tokenResponse = await fetch(
        `${process.env.REACT_APP_BASE_URL}/token?voice=coral&bot_type=${botType}`
      );
      const tokenData = await tokenResponse.json();
      setTokenData(tokenData);

      // Then create a session on our backend
      const sessionResponse = await fetch("/voice/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_type: botType }),
      });

      const sessionData = await sessionResponse.json();
      setSessionId(sessionData.session_id);
      setIsSessionActive(true);

      // Add welcome message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Hello! I'm your ${currentBot.title.toLowerCase()}. How can I help you today?`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      // Set up the audio stream here
      // Code to connect to OpenAI's realtime API would go here
      // This is a placeholder for the actual implementation

      return true;
    } catch (error) {
      console.error("Error starting session:", error);
      return false;
    }
  };

  // Function to end a voice session
  const endSession = async () => {
    if (!sessionId) return;

    try {
      // Close audio stream
      if (audioStream) {
        // Close the audio stream connection
        // This is a placeholder for actual implementation
      }

      // End session on our backend
      await fetch(`/voice/end/${sessionId}`, {
        method: "POST",
      });

      setIsSessionActive(false);
      setIsListening(false);
      setIsSpeaking(false);
      setSessionId(null);
      setTokenData(null);

      // Add session ended message
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: "Voice session ended",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  // Toggle microphone
  const toggleMicrophone = () => {
    setIsListening(!isListening);
    // Actual microphone handling code would go here
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    setIsSpeaking(!isSpeaking);
    // Actual speaker handling code would go here
  };

  return (
    <div
      className="voice-bot-container"
      style={{ borderTop: `4px solid ${currentBot.color}` }}
    >
      <div className="voice-bot-header">
        <div className="bot-avatar">{currentBot.avatar}</div>
        <div className="bot-info">
          <h2>{currentBot.title}</h2>
          <p>{currentBot.description}</p>
        </div>
      </div>

      <div className="voice-bot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
            <div className="message-timestamp">{msg.timestamp}</div>
          </div>
        ))}

        {isListening && (
          <div className="listening-indicator">
            <div className="pulse"></div>
            <p>Listening...</p>
          </div>
        )}

        {isSpeaking && (
          <div className="speaking-indicator">
            <div className="wave"></div>
            <p>Speaking...</p>
          </div>
        )}
      </div>

      <div className="voice-bot-controls">
        {!isSessionActive ? (
          <button
            className="start-session-btn"
            onClick={startSession}
            style={{ backgroundColor: currentBot.color }}
          >
            Start Voice Chat
          </button>
        ) : (
          <div className="active-controls">
            <button
              className={`control-btn microphone ${
                isListening ? "active" : ""
              }`}
              onClick={toggleMicrophone}
            >
              {isListening ? <Mic /> : <MicOff />}
            </button>

            <button
              className={`control-btn speaker ${isSpeaking ? "active" : ""}`}
              onClick={toggleSpeaker}
            >
              {isSpeaking ? <Volume2 /> : <VolumeX />}
            </button>

            <button className="end-session-btn" onClick={endSession}>
              End Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceBotInterface;
