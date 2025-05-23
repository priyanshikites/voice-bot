import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import VoiceVisualizer from "./VoiceAnimation";
// Bot configurations
const botConfigs = {
  business: {
    title: "Business Development Executive",
    description: "Your AI healthcare innovation business expert",
    tagline: "Igniting breakthroughs in health-tech innovation",
    voice: "coral",
    avatarColor: "bg-teal-50",
    buttonColor: "bg-[#00A9B5] hover:bg-[#008C96]",
    // gradientBg: "from-teal-50 to-teal-100",
    avatarType: "female",
    avatar: "https://cdn-icons-png.flaticon.com/512/4128/4128176.png",
    avatarAlt: "Female Business Executive",
  },
  doctor: {
    title: "Healthcare Doctor",
    description: "Your AI medical consultant and advisor",
    tagline: "Advancing healthcare with personalized AI consultation",
    voice: "coral",
    avatarColor: "bg-indigo-50",
    buttonColor: "bg-indigo-600 hover:bg-indigo-700",
    // gradientBg: "from-indigo-50 to-blue-100",
    avatarType: "male",
    avatar: "https://cdn-icons-png.flaticon.com/512/3774/3774299.png",
    avatarAlt: "Male Doctor",
  },
  personal: {
    title: "Personal Assistant",
    description: "Your AI personal assistant for daily tasks",
    tagline: "Simplifying your day with intelligent assistance",
    voice: "shimmer",
    avatarColor: "bg-amber-50",
    buttonColor: "bg-amber-500 hover:bg-amber-600",
    // gradientBg: "from-amber-50 to-orange-100",
    avatarType: "female",
    avatar: "https://cdn-icons-png.flaticon.com/512/4128/4128349.png",
    avatarAlt: "Female Personal Assistant",
  },
};

// Update VoiceBarsWave to accept children (for timer)
const VoiceBarsWave = ({ isActive, children }) => {
  const [durations, setDurations] = useState([]);
  const BAR_COUNT = 160;

  useEffect(() => {
    setDurations(
      Array.from({ length: BAR_COUNT }, () =>
        (Math.random() * (0.7 - 0.2) + 0.2).toFixed(2)
      )
    );
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-semibold text-[#3b5f83]">
          Talk to your AI assistant now
        </h2>
      </div>
      {/* Voice animation */}
      <VoiceVisualizer isActive={isActive} />
      {/* Timer below animation if provided */}
      {children}
      <style>{`
        @keyframes wave-sm {
          0% { opacity: 0.35; height: 10px; }
          100% { opacity: 1; height: 25px; }
        }
        @keyframes wave-md {
          0% { opacity: 0.35; height: 15px; }
          100% { opacity: 1; height: 50px; }
        }
        @keyframes wave-lg {
          0% { opacity: 0.35; height: 15px; }
          100% { opacity: 1; height: 70px; }
        }
        .bar {
          display: inline-block;
          height: 10px;
          border-radius: 2px;
          will-change: height, opacity;
        }
        .wave-sm {
          animation-name: wave-sm;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
          animation-direction: alternate;
        }
        .wave-md {
          animation-name: wave-md;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
          animation-direction: alternate;
        }
        .wave-lg {
          animation-name: wave-lg;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
          animation-direction: alternate;
        }
      `}</style>
    </div>
  );
};

// Professional avatar component with realistic avatar images
const BotAvatar = ({ config, isSpeaking }) => {
  return (
    <div className={`relative ${isSpeaking ? "speaking-bounce" : ""}`}>
      <div
        className={`w-14 h-14 ${
          isSpeaking
            ? "border-2 border-blue-500 speaking-pulse"
            : "border border-gray-200"
        } rounded-full overflow-hidden bg-white shadow-lg`}
      >
        <img
          src={config.avatar}
          alt={config.avatarAlt}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute -right-1 -bottom-1 flex flex-col items-center">
          <div className="bg-green-500 p-1 rounded-full shadow-lg z-10">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
          <div className="absolute w-6 h-6 bg-green-500 rounded-full animate-ping opacity-75"></div>
        </div>
      )}

      {/* Speaking animation waves */}
      {isSpeaking && (
        <div className="absolute -left-3 top-1/2 transform -translate-y-1/2">
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-blue-500 rounded-full speaking-wave-1"></div>
            <div className="w-1 h-5 bg-blue-500 rounded-full speaking-wave-2"></div>
            <div className="w-1 h-7 bg-blue-500 rounded-full speaking-wave-3"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function BotChat() {
  const { botId } = useParams();
  const navigate = useNavigate();
  const botConfig = botConfigs[botId] || botConfigs.business;

  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState("idle"); // idle, connecting, active, ended
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const dataChannel = useRef(null);
  const conversationId = useRef(null);
  const timerInterval = useRef(null);
  const [messages, setMessages] = useState([]);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const chatContainerRef = useRef(null);

  // Add enhanced CSS for avatar animations
  const avatarAnimationStyles = `
    @keyframes pulse-animation {
      0% { opacity: 0.3; transform: scale(0.8); }
      50% { opacity: 1; transform: scale(1.1); }
      100% { opacity: 0.3; transform: scale(0.8); }
    }
    
    @keyframes speaking-pulse {
      0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
      100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }
    
    @keyframes speaking-bounce {
      0%, 100% { transform: translateY(0); }
      25% { transform: translateY(-2px); }
      75% { transform: translateY(2px); }
    }
    
    @keyframes speaking-wave-1 {
      0%, 100% { height: 3px; }
      50% { height: 10px; }
    }
    
    @keyframes speaking-wave-2 {
      0%, 100% { height: 5px; }
      50% { height: 15px; }
    }
    
    @keyframes speaking-wave-3 {
      0%, 100% { height: 7px; }
      50% { height: 20px; }
    }
    
    @keyframes soundWave {
      0% { height: 10%; }
      100% { height: 80%; }
    }
    
    .speaking-pulse {
      animation: speaking-pulse 2s infinite;
    }
    
    .speaking-bounce {
      animation: speaking-bounce 1s infinite;
    }
    
    .speaking-wave-1 {
      animation: speaking-wave-1 0.8s infinite;
    }
    
    .speaking-wave-2 {
      animation: speaking-wave-2 0.8s infinite 0.2s;
    }
    
    .speaking-wave-3 {
      animation: speaking-wave-3 0.8s infinite 0.4s;
    }
    
    .sound-wave-container {
      position: relative;
      width: 100%;
      height: 100%;
    }
    
    .sound-wave-bar {
      position: absolute;
      bottom: 0;
      width: 0.5rem;
      border-radius: 4px;
      transform-origin: bottom;
      transition: height 0.2s ease;
    }
  `;

  // Add data channel message handler at component level
  useEffect(() => {
    if (dataChannel.current) {
      dataChannel.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log("[Data] Message received:", data);

        // Handle user speech
        if (data.type === "input_audio_transcription") {
          setIsUserSpeaking(true);
          addMessage(data.text, true);
          setTimeout(() => setIsUserSpeaking(false), 1000);
        }

        // Handle bot responses
        if (
          data.type === "conversation.item.created" &&
          data.item.role === "assistant"
        ) {
          setIsBotSpeaking(true);
          addMessage(data.item.content, false);
          setTimeout(() => setIsBotSpeaking(false), 1000);
        }

        // Handle function calls
        if (
          data.type === "response.done" &&
          data.response &&
          Array.isArray(data.response.output)
        ) {
          console.log("[Assistant Output]", data.response.output);

          // Handle search function
          const funcCallItem = data.response.output.find(
            (item) => item.type === "function_call" && item.name === "search"
          );
          if (funcCallItem) {
            try {
              const args = JSON.parse(funcCallItem.arguments);
              const query = args.query;
              console.log(`[Function Call] search called with query: ${query}`);

              const results = await performSearch(query);
              const functionOutput = {
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: funcCallItem.call_id,
                  output: JSON.stringify({ results }),
                },
              };
              dataChannel.current.send(JSON.stringify(functionOutput));
              dataChannel.current.send(
                JSON.stringify({ type: "response.create" })
              );
            } catch (error) {
              console.error("[Function Call] Error processing search:", error);
            }
          }

          // Handle store_call_info function
          const storeCallFunc = data.response.output.find(
            (item) =>
              item.type === "function_call" && item.name === "store_call_info"
          );
          if (storeCallFunc) {
            try {
              const args = JSON.parse(storeCallFunc.arguments);
              console.log(
                `[Function Call] store_call_info called with data:`,
                args
              );

              const response = await fetch(
                `${process.env.REACT_APP_BASE_URL}/store_call_info`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...args, botType: botId }),
                }
              );

              if (!response.ok) {
                throw new Error(
                  `store_call_info request failed: ${response.status}`
                );
              }

              const resultData = await response.json();
              const functionOutput = {
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: storeCallFunc.call_id,
                  output: JSON.stringify(resultData),
                },
              };
              dataChannel.current.send(JSON.stringify(functionOutput));
              dataChannel.current.send(
                JSON.stringify({ type: "response.create" })
              );
            } catch (error) {
              console.error(
                "[Function Call] Error processing store_call_info:",
                error
              );
            }
          }
        }
      };
    }
  }, [botId]);

  useEffect(() => {
    if (isCallActive) {
      timerInterval.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerInterval.current);
      setCallDuration(0);
    }
    return () => clearInterval(timerInterval.current);
  }, [isCallActive]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (dataChannel.current) {
        dataChannel.current.close();
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (audioElement.current) {
        document.body.removeChild(audioElement.current);
      }
      clearInterval(timerInterval.current);
    };
  }, []);

  /**
   * This function queries the backend RAG endpoint using the provided query.
   * It then formats the results so that each entry is shown as:
   * [ikites] <text content>
   * -----
   */
  async function performSearch(query) {
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/rag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) {
        throw new Error("Search API request failed");
      }
      const data = await response.json();
      let formattedResults = "";
      data.context.forEach((item) => {
        formattedResults += `[ikites] ${item}\n-----\n`;
      });
      console.log(`[Search] Results:\n${formattedResults}`);
      return formattedResults;
    } catch (error) {
      console.error("Error in performSearch:", error);
      return "Search failed due to an error.";
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startCall = async () => {
    try {
      const startTime = performance.now();
      // Get token with bot_type parameter
      const queryParams = new URLSearchParams({
        voice: botConfig.voice,
        bot_type: botId,
        modalities: JSON.stringify(["audio"]),
        input_audio_transcription: JSON.stringify({
          model: "whisper-1",
          language: "hi",
        }),
      }).toString();

      // Get JWT token from localStorage
      const jwtToken = localStorage.getItem("access_token");
      if (!jwtToken) {
        alert("You are not authenticated. Please log in.");
        setCallStatus("ended");
        return;
      }

      // Use the correct server URL
      const serverUrl = `${process.env.REACT_APP_BASE_URL}`;

      // First get the token response as text
      const tokenResponse = await fetch(`${serverUrl}/token?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });
      console.log("queryParams:", queryParams);

      if (tokenResponse.status === 401) {
        alert("Session expired or unauthorized. Please log in again.");
        setCallStatus("ended");
        navigate("/login");
        return;
      }

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("[Token] Error response:", errorText);
        throw new Error(
          `Token request failed: ${tokenResponse.status} ${tokenResponse.statusText}`
        );
      }

      // Get response as text first
      const responseText = await tokenResponse.text();

      // Then parse it as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("[Debug] Token received:", data);

        if (!data.client_secret || !data.client_secret.value) {
          throw new Error("Invalid token response format");
        }
      } catch (e) {
        console.error("[Token] Failed to parse JSON:", e);
        console.error("[Token] Raw response:", responseText);
        throw new Error("Invalid JSON response from token endpoint");
      }

      // Setup WebRTC connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerConnection.current = pc;

      // Create a data channel
      const dc = pc.createDataChannel("oai-events");
      dataChannel.current = dc;

      // When the data channel opens, send the session update with the search and store_call_info tool configuration.
      dc.onopen = () => {
        console.log("[DataChannel] Opened");
        const toolConfig = {
          type: "session.update",
          session: {
            tools: [
              {
                type: "function",
                name: "search",
                description:
                  "Search the knowledge base. The knowledge base is in English, translate to and from English if needed. " +
                  "Results are formatted as a source name first in square brackets, followed by the text content, and a line with '-----' at the end of each result.",
                parameters: {
                  type: "object",
                  properties: {
                    query: {
                      type: "string",
                      description: "Search query",
                    },
                  },
                  required: ["query"],
                  additionalProperties: false,
                },
              },
              {
                type: "function",
                name: "store_call_info",
                description:
                  "Store call details including user's name, email, a summary of the call, and optionally phone number and organization.",
                parameters: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      description: "User's name",
                    },
                    email: {
                      type: "string",
                      description: "User's email address",
                    },
                    summary: {
                      type: "string",
                      description:
                        "Summary of the call and reason for contacting the services",
                    },
                    phone: {
                      type: "string",
                      description: "User's phone number (optional)",
                    },
                    organization: {
                      type: "string",
                      description: "User's organization name (optional)",
                    },
                  },
                  required: ["name", "email", "summary"],
                  additionalProperties: false,
                },
              },
            ],
            tool_choice: "auto",
          },
        };
        dataChannel.current.send(JSON.stringify(toolConfig));
      };

      // Set up the audio element
      console.log("[Debug] Setting up audio element");
      audioElement.current = new Audio();
      audioElement.current.autoplay = true;
      document.body.appendChild(audioElement.current);

      // Handle incoming audio tracks
      pc.ontrack = (event) => {
        console.log("[Audio] Track received:", {
          kind: event.track.kind,
          id: event.track.id,
          label: event.track.label,
        });

        audioElement.current.srcObject = event.streams[0];
        event.track.onmute = () => console.log("[Audio] Track muted");
        event.track.onunmute = () => console.log("[Audio] Track unmuted");
        event.track.onended = () => console.log("[Audio] Track ended");
        audioElement.current
          .play()
          .catch((e) => console.error("[Audio] Playback error:", e));
      };

      // Get the local audio stream
      console.log("[Debug] Getting user media");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      console.log("[Debug] User media obtained");

      // Add local audio tracks to the connection
      stream.getTracks().forEach((track) => {
        console.log("[Debug] Adding local track:", track.kind);
        pc.addTrack(track, stream);
      });

      // Create and send the SDP offer
      console.log("[Debug] Creating offer");
      const offer = await pc.createOffer();
      console.log("[Debug] Setting local description");
      await pc.setLocalDescription(offer);

      // Send the offer to OpenAI using the realtime API with the token
      console.log("[Debug] Sending offer to OpenAI");
      const sdpResponse = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.client_secret.value}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error("[SDP] Error response:", errorText);
        throw new Error(
          `SDP request failed: ${sdpResponse.status} ${sdpResponse.statusText}`
        );
      }

      // Set the remote description from the SDP answer
      console.log("[Debug] Setting remote description");
      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      setIsCallActive(true);
      setCallStatus("active");
      console.log(
        `[Debug] Call setup completed in ${performance.now() - startTime}ms`
      );
    } catch (error) {
      console.error("[Error] Call setup failed:", error);
      setCallStatus("ended");
    }
  };

  const endCall = () => {
    if (dataChannel.current) {
      dataChannel.current.close();
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    setIsCallActive(false);
    setCallStatus("ended");
    console.log("[Timing] Call ended");
  };

  // Add message to chat
  const addMessage = (text, isUser = false) => {
    setMessages((prev) => [...prev, { text, isUser, timestamp: new Date() }]);
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      className={`h-screen w-screen bg-gradient-to-b ${botConfig.gradientBg} flex flex-col`}
    >
      <style>{avatarAnimationStyles}</style>
      {/* Header with bot info */}
      <div className="w-full bg-white shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <img src={logo} alt="iKITES Logo" className="h-10" />
        </div>

        {/* Add bot info in header */}
        <div className="flex items-center space-x-3">
          <div className="text-right mr-3">
            <h2 className="font-semibold text-gray-800">{botConfig.title}</h2>
            <p className="text-xs text-gray-500">{botConfig.tagline}</p>
          </div>
          <BotAvatar config={botConfig} isSpeaking={isBotSpeaking} />
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col p-4 overflow-scroll">
        <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-4 overflow-hidden flex flex-col min-h-[33rem] max-h-[30rem] w-[40rem] m-auto mt-[7%]">
          {/* VoiceBarsWave Animation when no messages */}
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <VoiceBarsWave isActive={isBotSpeaking}>
                {isCallActive && (
                  <div className="mt-4 text-lg font-mono text-[#21aeb7] bg-[#e6f7fa] px-6 py-2 rounded-full shadow">
                    {formatTime(callDuration)}
                  </div>
                )}
              </VoiceBarsWave>
            </div>
          )}

          {/* Chat Messages */}
          {messages.length > 0 && (
            <div
              ref={chatContainerRef}
              className="h-full overflow-y-auto space-y-4"
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!message.isUser && (
                    <div className="mr-2">
                      <BotAvatar
                        config={botConfig}
                        isSpeaking={
                          isBotSpeaking &&
                          messages[messages.length - 1]?.text === message.text
                        }
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.isUser
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    <div className="flex flex-col">
                      <p className="text-sm">{message.text}</p>
                      <span className="text-xs opacity-70 text-right mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  {message.isUser && (
                    <div className="ml-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-blue-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Speaking Indicators */}
              {isUserSpeaking && (
                <div className="flex justify-end items-center space-x-2">
                  <div className="bg-blue-500 text-white rounded-2xl px-4 py-2 rounded-br-none">
                    <div className="flex space-x-1">
                      <div
                        className="w-2 h-2 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {isBotSpeaking && (
                <div className="flex flex-col space-y-3">
                  <div className="flex justify-start items-center space-x-3">
                    <BotAvatar config={botConfig} isSpeaking={true} />
                    <div className="bg-gray-100 rounded-2xl px-4 py-3 rounded-bl-none">
                      <div className="flex space-x-1">
                        <div
                          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  {/* VoiceBarsWave at bottom of chat when bot is speaking */}
                  <div className="w-full h-16 my-2 flex flex-col items-center">
                    <VoiceBarsWave isActive={true}>
                      {isCallActive && (
                        <div className="mt-2 text-base font-mono text-[#21aeb7] bg-[#e6f7fa] px-4 py-1 rounded-full shadow">
                          {formatTime(callDuration)}
                        </div>
                      )}
                    </VoiceBarsWave>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Call Controls */}
        <div className="flex justify-center gap-8 mt-8">
          {!isCallActive ? (
            <button
              onClick={startCall}
              disabled={callStatus === "connecting"}
              className={`
                group
                relative
                flex items-center justify-center
                px-10 py-4
                rounded-full
                bg-[#21aeb7]
                text-white
                font-semibold
                text-lg
                shadow-xl
                transition-all
                duration-200
                hover:bg-[#268c94]
                hover:scale-105
                focus:outline-none
                disabled:opacity-60
                disabled:cursor-not-allowed
                border-0
              `}
              style={{
                boxShadow:
                  "0 8px 24px 0 rgba(33,174,183,0.15), 0 1.5px 4px 0 rgba(47,72,110,0.10)",
                letterSpacing: "0.02em",
              }}
            >
              <span className="flex items-center gap-3">
                <svg
                  className="w-7 h-7 drop-shadow"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#fff"
                    strokeWidth="2.2"
                  />
                  <path
                    d="M8 12h.01M12 12h.01M16 12h.01"
                    stroke="#fff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="tracking-wide">Start Consultation</span>
              </span>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-[#21aeb7] rounded-full opacity-30 blur-sm group-hover:opacity-60 transition" />
            </button>
          ) : (
            <button
              onClick={endCall}
              className={`
                group
                relative
                flex items-center justify-center
                px-10 py-4
                rounded-full
                bg-[#d33030]
                text-white
                font-semibold
                text-lg
                shadow-xl
                transition-all
                duration-200
                hover:bg-[#982828]
                hover:scale-105
                focus:outline-none
                border-0
              `}
              style={{
                boxShadow:
                  "0 8px 24px 0 rgba(220,38,38,0.15), 0 1.5px 4px 0 rgba(220,38,38,0.10)",
                letterSpacing: "0.02em",
              }}
            >
              <span className="flex items-center gap-3">
                <svg
                  className="w-7 h-7 drop-shadow"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  viewBox="0 0 24 24"
                >
                  <line
                    x1="6"
                    y1="6"
                    x2="18"
                    y2="18"
                    stroke="#fff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="6"
                    y1="18"
                    x2="18"
                    y2="6"
                    stroke="#fff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="tracking-wide">End Session</span>
              </span>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-red-500 rounded-full opacity-30 blur-sm group-hover:opacity-60 transition" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
