import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

// Bot configurations
const botConfigs = {
  business: {
    title: "Business Development Executive",
    description: "Your AI healthcare innovation business expert",
    tagline: "Igniting breakthroughs in health-tech innovation",
    voice: "coral",
    avatarColor: "bg-teal-50",
    buttonColor: "bg-[#00A9B5] hover:bg-[#008C96]",
    gradientBg: "from-teal-50 to-teal-100",
    // SYSTEM_MESSAGE_TEMPLATE: `
    //   You are a Business Development Executive at iKITES.ai, passionate about transforming healthcare through AI innovation.
    //   You represent iKITES.ai in both Hindi and English, adapting seamlessly to the client's preferred language.
    //   Maintain a professional yet engaging tone. You are a female executive, so talk like a female.
    // `
  },
  doctor: {
    title: "Healthcare Doctor",
    description: "Your AI medical consultant and advisor",
    tagline: "Advancing healthcare with personalized AI consultation",
    voice: "coral",
    avatarColor: "bg-indigo-50",
    buttonColor: "bg-indigo-600 hover:bg-indigo-700",
    gradientBg: "from-indigo-50 to-blue-100",
    // DOCTOR_BOT_PROMPT: `
    //   You are an AI Healthcare Doctor at iKITES.ai, specialized in providing medical consultation.
    //   You can communicate in both Hindi and English based on patient preference.
    //   You maintain a caring, professional tone and focus on evidence-based information.
    //   You are a male doctor, so talk like a male.
    // `
  },
  personal: {
    title: "Personal Assistant",
    description: "Your AI personal assistant for daily tasks",
    tagline: "Simplifying your day with intelligent assistance",
    voice: "shimmer",
    avatarColor: "bg-amber-50",
    buttonColor: "bg-amber-500 hover:bg-amber-600",
    gradientBg: "from-amber-50 to-orange-100",
    // PERSONAL_BOT_PROMPT: `
    //   You are a Personal Assistant AI at iKITES.ai, designed to help with daily tasks and questions.
    //   You can communicate in both Hindi and English based on user preference.
    //   You maintain a friendly, helpful tone that's conversational and approachable.
    //   You are a female assistant, so talk like a female.
    // `
  }
};

export default function BotChat() {
  const { botId } = useParams();
  const navigate = useNavigate();
  const botConfig = botConfigs[botId] || botConfigs.business;
  
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState('idle'); // idle, connecting, active, ended
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const dataChannel = useRef(null);
  const conversationId = useRef(null);
  const timerInterval = useRef(null);

  useEffect(() => {
    if (isCallActive) {
      timerInterval.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
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
      const response = await fetch("http://localhost:8000/rag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
      });
      if (!response.ok) {
        throw new Error('Search API request failed');
      }
      const data = await response.json();
      let formattedResults = "";
      data.context.forEach(item => {
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
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCall = async () => {
    try {
      // Get token with bot_type parameter
      const queryParams = new URLSearchParams({
        voice: botConfig.voice,
        bot_type: botId,
        modalities: JSON.stringify(["audio"]),
        input_audio_transcription: JSON.stringify({
          model: 'whisper-1',
          language: 'hi'
        })
      }).toString();
      
      // Use the correct server URL
      const serverUrl = 'http://localhost:8000';
      
      // First get the token response as text
      const tokenResponse = await fetch(`http://localhost:8000/token?${queryParams}`);
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('[Token] Error response:', errorText);
        throw new Error(`Token request failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
      }
      
      // Get response as text first
      const responseText = await tokenResponse.text();
      
      // Then parse it as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('[Debug] Token received:', data);
        
        if (!data.client_secret || !data.client_secret.value) {
          throw new Error('Invalid token response format');
        }
      } catch (e) {
        console.error('[Token] Failed to parse JSON:', e);
        console.error('[Token] Raw response:', responseText);
        throw new Error('Invalid JSON response from token endpoint');
      }

      // Setup WebRTC connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnection.current = pc;

      // Create a data channel
      const dc = pc.createDataChannel('oai-events');
      dataChannel.current = dc;
      
      // When the data channel opens, send the session update with the search and store_call_info tool configuration.
      dc.onopen = () => {
        console.log('[DataChannel] Opened');
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
                      description: "Search query"
                    }
                  },
                  required: ["query"],
                  additionalProperties: false
                }
              },
              {
                type: "function",
                name: "store_call_info",
                description: "Store call details including user's name, email, a summary of the call, and optionally phone number and organization.",
                parameters: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      description: "User's name"
                    },
                    email: {
                      type: "string",
                      description: "User's email address"
                    },
                    summary: {
                      type: "string",
                      description: "Summary of the call and reason for contacting the services"
                    },
                    phone: {
                      type: "string",
                      description: "User's phone number (optional)"
                    },
                    organization: {
                      type: "string",
                      description: "User's organization name (optional)"
                    }
                  },
                  required: ["name", "email", "summary"],
                  additionalProperties: false
                }
              }
            ],
            tool_choice: "auto"
          }
        };
        dataChannel.current.send(JSON.stringify(toolConfig));
      };

      // Handle data channel messages
      dc.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('[Data] Message received:', data);

        // Log input transcriptions if available
        if (data.type === "input_audio_transcription") {
          console.log('[Transcript] Input:', data.text);
        }
        
        // Log conversation items as they come in
        if (data.type === "conversation.item.created") {
          if (data.item.role === "user") {
            console.log('[Conversation] User:', data.item.content);
          } else if (data.item.role === "assistant") {
            console.log('[Conversation] Assistant:', data.item.content);
          }
        }

        // Detect a function call in the response.done event and process accordingly.
        if (data.type === "response.done" && data.response && Array.isArray(data.response.output)) {
          console.log('[Assistant Output]', data.response.output);
          const funcCallItem = data.response.output.find(
            (item) => item.type === "function_call" && item.name === "search"
          );
          if (funcCallItem) {
            try {
              const args = JSON.parse(funcCallItem.arguments);
              const query = args.query;
              console.log(`[Function Call] search called with query: ${query}`);
              
              // Execute our search function by calling the backend /rag endpoint.
              const results = await performSearch(query);
              
              // Send the function call output back to the model.
              const functionOutput = {
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: funcCallItem.call_id,
                  output: JSON.stringify({ results })
                }
              };
              // 1. Send function output
              dataChannel.current.send(JSON.stringify(functionOutput));

              // 2. THEN immediately trigger the next assistant response
              dataChannel.current.send(JSON.stringify({ type: "response.create" }));
              
              // Trigger a new response from the model.
              dataChannel.current.send(JSON.stringify({ type: "response.create" }));
            } catch (error) {
              console.error("[Function Call] Error processing search function call:", error);
            }
          }

          // Process the store_call_info function call if present.
          const storeCallFunc = data.response.output.find(
            (item) => item.type === "function_call" && item.name === "store_call_info"
          );
          if (storeCallFunc) {
            try {
              const args = JSON.parse(storeCallFunc.arguments);
              console.log(`[Function Call] store_call_info called with data:`, args);
              
              // Call the new endpoint to store call details.
              const response = await fetch("http://localhost:8000/store_call_info", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  ...args,
                  botType: botId // Add the bot type to the stored information
                })
              });
              if (!response.ok) {
                const errorText = await response.text();
                console.error('[store_call_info] Error response:', errorText);
                throw new Error(`store_call_info request failed: ${response.status} ${response.statusText}`);
              }
              const resultData = await response.json();
              
              // Send the function call output back to the model.
              const functionOutput = {
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: storeCallFunc.call_id,
                  output: JSON.stringify(resultData)
                }
              };
              // 1. Send function output
              dataChannel.current.send(JSON.stringify(functionOutput));

              // 2. THEN immediately trigger the next assistant response
              dataChannel.current.send(JSON.stringify({ type: "response.create" }));
              
              // Trigger a new response from the model.
              dataChannel.current.send(JSON.stringify({ type: "response.create" }));
            } catch (error) {
              console.error("[Function Call] Error processing store_call_info function call:", error);
            }
          }
        }
      };

      // Set up the audio element
      console.log('[Debug] Setting up audio element');
      audioElement.current = new Audio();
      audioElement.current.autoplay = true;
      document.body.appendChild(audioElement.current);

      // Handle incoming audio tracks
      pc.ontrack = (event) => {
        console.log('[Audio] Track received:', {
          kind: event.track.kind,
          id: event.track.id,
          label: event.track.label
        });
        
        audioElement.current.srcObject = event.streams[0];
        event.track.onmute = () => console.log('[Audio] Track muted');
        event.track.onunmute = () => console.log('[Audio] Track unmuted');
        event.track.onended = () => console.log('[Audio] Track ended');
        audioElement.current.play().catch(e => console.error('[Audio] Playback error:', e));
      };

      // Get the local audio stream
      console.log('[Debug] Getting user media');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      console.log('[Debug] User media obtained');

      // Add local audio tracks to the connection
      stream.getTracks().forEach(track => {
        console.log('[Debug] Adding local track:', track.kind);
        pc.addTrack(track, stream);
      });

      // Create and send the SDP offer
      console.log('[Debug] Creating offer');
      const offer = await pc.createOffer();
      console.log('[Debug] Setting local description');
      await pc.setLocalDescription(offer);

      // Send the offer to OpenAI using the realtime API with the token
      console.log('[Debug] Sending offer to OpenAI');
      const sdpResponse = await fetch(
        'https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${data.client_secret.value}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        }
      );

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error('[SDP] Error response:', errorText);
        throw new Error(`SDP request failed: ${sdpResponse.status} ${sdpResponse.statusText}`);
      }

      // Set the remote description from the SDP answer
      console.log('[Debug] Setting remote description');
      const answer = {
        type: 'answer',
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      setIsCallActive(true);
      setCallStatus('active');
      console.log(`[Debug] Call setup completed in ${performance.now() - startTime}ms`);

    } catch (error) {
      console.error('[Error] Call setup failed:', error);
      setCallStatus('ended');
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
    setCallStatus('ended');
    console.log('[Timing] Call ended');
  };

  return (
    <div className={`h-screen w-screen bg-gradient-to-b ${botConfig.gradientBg} flex flex-col`}>
      {/* Header with back button */}
      <div className="w-full bg-white shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <img src={logo} alt="iKITES Logo" className="h-10" />
        </div>
        {isCallActive && (
          <div className="text-xl font-mono text-teal-700 bg-teal-50 px-4 py-2 rounded-full">
            {formatTime(callDuration)}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          <div className="flex flex-col items-center space-y-8">
            {/* Status Avatar */}
            <div className="relative">
              <div className={`w-32 h-32 rounded-full ${botConfig.avatarColor} flex items-center justify-center`}>
                <svg className={`w-16 h-16 text-${botConfig.buttonColor.split(' ')[0].replace('bg-', '')}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
                </svg>
              </div>
              <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full ${
                callStatus === 'active' ? 'bg-teal-500' :
                callStatus === 'connecting' ? 'bg-yellow-500' :
                'bg-gray-400'
              } ring-3 ring-white`} />
            </div>

            {/* Call Status */}
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-3 text-[#1B3C87]">{botConfig.title}</h2>
              <p className="text-lg text-gray-600">
                {callStatus === 'idle' && botConfig.description}
                {callStatus === 'connecting' && 'Connecting you with your AI assistant...'}
                {callStatus === 'active' && `In conversation with your ${botConfig.title}`}
                {callStatus === 'ended' && 'Thank you for connecting with iKITES.ai'}
              </p>
            </div>

            {/* Call Controls */}
            <div className="flex gap-6">
              {!isCallActive ? (
                <button
                  onClick={startCall}
                  disabled={callStatus === 'connecting'}
                  className={`${botConfig.buttonColor} text-white px-8 py-4 rounded-full transition-all disabled:bg-gray-400 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2 text-lg`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Start Consultation</span>
                </button>
              ) : (
                <button
                  onClick={endCall}
                  className="bg-red-500 text-white px-8 py-4 rounded-full hover:bg-red-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2 text-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>End Session</span>
                </button>
              )}
            </div>

            {/* Supportive Message */}
            <p className="text-lg text-[#1B3C87] text-center italic mt-6">
              "{botConfig.tagline}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}