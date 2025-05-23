// Replace your entire BotSelector.js file with this

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import executiveAvatar from "../assets/business-bot.jpg";
import doctorAvatar from "../assets/doctor-bot.jpg";
import assistantAvatar from "../assets/personal-bot.jpg";
// Make sure to import your CSS
import "./BotSelector.css";

// Define bot options
const bots = [
  {
    id: "business",
    name: "Business Executive",
    description: "Your AI healthcare business development expert",
    avatar: executiveAvatar,
    voice: "coral",
    color: "from-blue-400 to-teal-500",
  },
  {
    id: "doctor",
    name: "Healthcare Doctor",
    description: "Your AI medical consultant and advisor",
    avatar: doctorAvatar,
    voice: "coral",
    color: "from-purple-400 to-indigo-500",
  },
  {
    id: "personal",
    name: "Personal Assistant",
    description: "Your AI personal assistant for daily tasks",
    avatar: assistantAvatar,
    voice: "shimmer",
    color: "from-orange-400 to-red-500",
  },
];

export default function BotSelection() {
  const navigate = useNavigate();
  const [hoverEffect, setHoverEffect] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const gradientLayerRef = useRef(null);

  // Track mouse movement for interactive background
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Get mouse position as percentage of window
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;

      // Update state
      setMousePosition({ x, y });

      // Update gradient layer position directly for smoother effect
      if (gradientLayerRef.current) {
        const offsetX = (x - 50) / 10; // Reduced movement for subtlety
        const offsetY = (y - 50) / 10;
        gradientLayerRef.current.style.transform = `translate(${offsetX}%, ${offsetY}%)`;

        // Update radial gradient positions
        gradientLayerRef.current.style.background = `
          radial-gradient(circle at ${x}% ${y}%, rgba(0, 172, 193, 0.3), transparent 70%),
          radial-gradient(circle at ${100 - x}% ${
          100 - y
        }%, rgba(255, 0, 128, 0.2), transparent 80%)
        `;
      }

      // Subtle movement for the spheres
      const spheres = document.querySelectorAll(".gradient-sphere");
      spheres.forEach((sphere, index) => {
        const factor = 0.02 * (index + 1);
        const xOffset = (x - 50) * factor;
        const yOffset = (y - 50) * factor;

        // Get current transform style and add mouse movement
        const baseTransform = sphere.style.transform || "";
        const newTransform = baseTransform.includes("translate")
          ? baseTransform.replace(
              /translate\([^)]+\)/,
              `translate(${xOffset}px, ${yOffset}px)`
            )
          : `translate(${xOffset}px, ${yOffset}px) ${baseTransform}`;

        sphere.style.transform = newTransform;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const selectBot = (botId) => {
    navigate(`/chat/${botId}`);
  };

  return (
    <div className="h-screen w-screen relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-teal-100">
      {/* Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-blue-200 via-teal-100 to-transparent rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-tr from-pink-200 via-orange-100 to-transparent rounded-full blur-3xl opacity-50"></div>
      </div>
      {/* Logo */}
      <div className="mb-12 z-10">
        <img src={logo} alt="iKITES Logo" className="h-16 drop-shadow-lg" />
      </div>
      {/* Profile Selection Header */}
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-12 z-10 text-center drop-shadow-sm">
        Welcome! Pick your AI partner to get started.
      </h1>
      {/* Bot Selection Grid */}
      <div className="flex flex-wrap justify-center gap-10 mb-16 z-10">
        {bots.map((bot) => (
          <div
            key={bot.id}
            className="group relative"
            onMouseEnter={() => setHoverEffect(bot.id)}
            onMouseLeave={() => setHoverEffect(null)}
          >
            {/* Card with glassmorphism */}
            <div
              onClick={() => selectBot(bot.id)}
              className="w-56 h-72 rounded-2xl bg-white/60 backdrop-blur-md shadow-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-white/30 hover:border-teal-400 relative overflow-hidden"
            >
              {/* Avatar */}
              <div className="mt-6 mb-4 relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full ring-0 group-hover:ring-8 group-hover:ring-teal-200 transition-all duration-300"></div>
                <img
                  src={bot.avatar}
                  alt={bot.name}
                  className="w-28 h-28 object-cover rounded-full border-4 border-white shadow-md group-hover:animate-avatar-pulse transition-all duration-300"
                />
              </div>
              {/* Name */}
              <p className="text-center text-gray-900 font-semibold text-xl mb-2 drop-shadow-sm">
                {bot.name}
              </p>
              {/* Description */}
              <p className="text-center text-gray-600 text-base px-4 mb-4">
                {bot.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* Inline styles for shimmer animation (if needed elsewhere) */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes avatar-pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }
        .animate-avatar-pulse {
          animation: avatar-pulse 0.7s;
        }
      `}</style>
    </div>
  );
}

// import { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import logo from "../assets/logo.png";
// import executiveAvatar from "../assets/business-bot.jpg";
// import doctorAvatar from "../assets/doctor-bot.jpg";
// import assistantAvatar from "../assets/personal-bot.jpg";
// import "./BotSelector.css";

// // Enhanced bot definitions with contextual information
// const bots = [
//   {
//     id: "business",
//     name: "Business Executive",
//     description:
//       "Strategic AI partner specialized in healthcare business development, market analysis, and growth planning with deep industry insights.",
//     avatar: executiveAvatar,
//     voice: "coral",
//     status: "online",
//     tags: ["strategy", "analytics", "healthcare", "growth"],
//     specialty: "Business Strategy",
//     experience: "Fortune 500 Consulting",
//     color: "from-blue-500 to-cyan-500",
//   },
//   {
//     id: "doctor",
//     name: "Healthcare Doctor",
//     description:
//       "Expert medical AI consultant providing professional healthcare guidance, clinical insights, and evidence-based medical information.",
//     avatar: doctorAvatar,
//     voice: "coral",
//     status: "online",
//     tags: ["medical", "clinical", "diagnosis", "research"],
//     specialty: "Medical Consultation",
//     experience: "20+ Years Practice",
//     color: "from-purple-500 to-pink-500",
//   },
//   {
//     id: "personal",
//     name: "Personal Assistant",
//     description:
//       "Intelligent AI companion designed for productivity optimization, task management, and seamless daily workflow coordination.",
//     avatar: assistantAvatar,
//     voice: "shimmer",
//     status: "online",
//     tags: ["productivity", "automation", "scheduling", "organization"],
//     specialty: "Productivity & Organization",
//     experience: "Executive Level Support",
//     color: "from-emerald-500 to-teal-500",
//   },
// ];

// // Generate floating particles
// const generateParticles = (count = 20) => {
//   return Array.from({ length: count }, (_, i) => ({
//     id: i,
//     x: Math.random() * 100,
//     y: Math.random() * 100,
//     delay: Math.random() * 20,
//     duration: 15 + Math.random() * 10,
//   }));
// };

// export default function BotSelection() {
//   const navigate = useNavigate();
//   const [selectedBot, setSelectedBot] = useState(null);
//   const [hoveredBot, setHoveredBot] = useState(null);
//   const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
//   const [isLoading, setIsLoading] = useState(false);
//   const [particles] = useState(() => generateParticles(25));
//   const [typingText, setTypingText] = useState("");
//   const containerRef = useRef(null);

//   const fullText =
//     "Choose your AI companion and unlock intelligent conversations.";

//   // Typing effect for subtitle
//   useEffect(() => {
//     let currentIndex = 0;
//     const typingInterval = setInterval(() => {
//       if (currentIndex <= fullText.length) {
//         setTypingText(fullText.slice(0, currentIndex));
//         currentIndex++;
//       } else {
//         clearInterval(typingInterval);
//         // Restart after a pause
//         setTimeout(() => {
//           currentIndex = 0;
//           setTypingText("");
//         }, 3000);
//       }
//     }, 100);

//     return () => clearInterval(typingInterval);
//   }, []);

//   // Enhanced mouse tracking with momentum
//   useEffect(() => {
//     let animationId;
//     const handleMouseMove = (e) => {
//       if (containerRef.current) {
//         const rect = containerRef.current.getBoundingClientRect();
//         const x = ((e.clientX - rect.left) / rect.width) * 100;
//         const y = ((e.clientY - rect.top) / rect.height) * 100;

//         setMousePosition({ x, y });

//         // Smooth animation for CSS properties
//         animationId = requestAnimationFrame(() => {
//           document.documentElement.style.setProperty("--mouse-x", `${x}%`);
//           document.documentElement.style.setProperty("--mouse-y", `${y}%`);
//         });
//       }
//     };

//     const container = containerRef.current;
//     if (container) {
//       container.addEventListener("mousemove", handleMouseMove);
//       return () => {
//         container.removeEventListener("mousemove", handleMouseMove);
//         if (animationId) cancelAnimationFrame(animationId);
//       };
//     }
//   }, []);

//   // Advanced keyboard navigation
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if (e.key === "Escape") {
//         setSelectedBot(null);
//         setHoveredBot(null);
//       }

//       if (e.key === "Enter" && hoveredBot && !isLoading) {
//         selectBot(hoveredBot);
//       }

//       // Arrow navigation
//       if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
//         e.preventDefault();
//         const currentIndex = bots.findIndex((bot) => bot.id === hoveredBot);
//         let nextIndex;

//         switch (e.key) {
//           case "ArrowRight":
//           case "ArrowDown":
//             nextIndex = currentIndex < bots.length - 1 ? currentIndex + 1 : 0;
//             break;
//           case "ArrowLeft":
//           case "ArrowUp":
//             nextIndex = currentIndex > 0 ? currentIndex - 1 : bots.length - 1;
//             break;
//           default:
//             return;
//         }

//         setHoveredBot(bots[nextIndex].id);

//         // Focus the card for better accessibility
//         const cardElement = document.querySelector(
//           `[data-bot-id="${bots[nextIndex].id}"]`
//         );
//         if (cardElement) {
//           cardElement.focus();
//         }
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [hoveredBot, isLoading]);

//   const selectBot = async (botId) => {
//     if (isLoading) return;

//     setIsLoading(true);
//     setSelectedBot(botId);

//     // Enhanced loading sequence with animations
//     await new Promise((resolve) => setTimeout(resolve, 500));

//     try {
//       // Add a nice transition effect
//       const selectedCard = document.querySelector(`[data-bot-id="${botId}"]`);
//       if (selectedCard) {
//         selectedCard.style.transform = "scale(1.1) rotateY(5deg)";
//         selectedCard.style.opacity = "0.8";
//       }

//       await new Promise((resolve) => setTimeout(resolve, 300));
//       navigate(`/chat/${botId}`);
//     } catch (error) {
//       console.error("Navigation error:", error);
//       setIsLoading(false);
//       setSelectedBot(null);
//     }
//   };

//   const handleBotInteraction = (botId, type) => {
//     if (isLoading) return;

//     switch (type) {
//       case "hover":
//         setHoveredBot(botId);
//         break;
//       case "leave":
//         setHoveredBot(null);
//         break;
//       case "focus":
//         setHoveredBot(botId);
//         break;
//       case "blur":
//         setHoveredBot(null);
//         break;
//       default:
//         break;
//     }
//   };

//   return (
//     <div
//       ref={containerRef}
//       className="bot-selector-container"
//       role="main"
//       aria-label="AI Assistant Selection Interface"
//     >
//       {/* Advanced Particle System */}
//       <div className="particle-system" aria-hidden="true">
//         {particles.map((particle) => (
//           <div
//             key={particle.id}
//             className="particle"
//             style={{
//               left: `${particle.x}%`,
//               top: `${particle.y}%`,
//               animationDelay: `${particle.delay}s`,
//               animationDuration: `${particle.duration}s`,
//             }}
//           />
//         ))}
//       </div>

//       {/* Enhanced Logo */}
//       <div className="logo-container">
//         <img
//           src={logo}
//           alt="iKITES - Advanced AI Platform"
//           className="interactive-element"
//         />
//       </div>

//       {/* Hero Text with Advanced Typography */}
//       <h1 className="header-text">
//         Welcome! Pick your AI partner to get started.
//       </h1>

//       {/* Animated Subtitle */}
//       <div className="header-subtext">
//         {typingText}
//         <span className="cursor">|</span>
//       </div>

//       {/* Enhanced Bot Grid */}
//       <div
//         className="bot-grid"
//         role="group"
//         aria-label="Available AI Assistants"
//       >
//         {bots.map((bot, index) => (
//           <div
//             key={bot.id}
//             data-bot-id={bot.id}
//             className={`bot-card interactive-element ${
//               selectedBot === bot.id ? "selected" : ""
//             } ${hoveredBot === bot.id ? "hovered" : ""}`}
//             onClick={() => selectBot(bot.id)}
//             onMouseEnter={() => handleBotInteraction(bot.id, "hover")}
//             onMouseLeave={() => handleBotInteraction(bot.id, "leave")}
//             onFocus={() => handleBotInteraction(bot.id, "focus")}
//             onBlur={() => handleBotInteraction(bot.id, "blur")}
//             role="button"
//             tabIndex={0}
//             aria-label={`Select ${bot.name} - ${bot.description}`}
//             aria-pressed={selectedBot === bot.id}
//             aria-disabled={isLoading}
//             style={{
//               animationDelay: `${0.2 + index * 0.2}s`,
//               opacity: isLoading && selectedBot !== bot.id ? 0.4 : 1,
//               pointerEvents: isLoading ? "none" : "auto",
//             }}
//           >
//             {/* Status Display */}
//             <div className="bot-status">
//               <div className="status-dot"></div>
//               <span>{bot.status}</span>
//             </div>

//             {/* Enhanced Avatar System */}
//             <div className="avatar-container">
//               <div className="avatar-orbit-ring"></div>
//               <div className="avatar-glow"></div>
//               <img
//                 src={bot.avatar}
//                 alt={`${bot.name} - ${bot.specialty}`}
//                 className="bot-avatar"
//                 loading="lazy"
//               />
//             </div>

//             {/* Bot Information */}
//             <div className="bot-info">
//               <h3 className="bot-name">{bot.name}</h3>
//               <div className="bot-specialty">
//                 <span
//                   style={{
//                     fontSize: "0.875rem",
//                     color: "var(--hui-text-accent)",
//                     fontFamily: "JetBrains Mono, monospace",
//                     fontWeight: "500",
//                     textTransform: "uppercase",
//                     letterSpacing: "0.1em",
//                     marginBottom: "0.5rem",
//                     display: "block",
//                   }}
//                 >
//                   {bot.specialty}
//                 </span>
//                 <span
//                   style={{
//                     fontSize: "0.75rem",
//                     color: "var(--hui-text-muted)",
//                     fontFamily: "Inter, sans-serif",
//                     fontWeight: "400",
//                     marginBottom: "1rem",
//                     display: "block",
//                   }}
//                 >
//                   {bot.experience}
//                 </span>
//               </div>
//               <p className="bot-description">{bot.description}</p>

//               {/* Enhanced Tags */}
//               <div className="bot-tags">
//                 {bot.tags.map((tag, tagIndex) => (
//                   <span key={tagIndex} className="bot-tag">
//                     #{tag}
//                   </span>
//                 ))}
//               </div>
//             </div>

//             {/* Advanced Loading State */}
//             {isLoading && selectedBot === bot.id && (
//               <div className="loading-overlay">
//                 <div className="loading-spinner"></div>
//                 <div className="loading-text">Initializing {bot.name}...</div>
//                 <div
//                   style={{
//                     fontSize: "0.75rem",
//                     color: "var(--hui-text-muted)",
//                     marginTop: "0.5rem",
//                     fontFamily: "JetBrains Mono, monospace",
//                   }}
//                 >
//                   Establishing neural connection
//                 </div>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Enhanced Accessibility Announcements */}
//       <div aria-live="polite" aria-atomic="true" className="sr-only">
//         {hoveredBot &&
//           `Focused on ${bots.find((b) => b.id === hoveredBot)?.name} - ${
//             bots.find((b) => b.id === hoveredBot)?.specialty
//           }`}
//         {isLoading &&
//           selectedBot &&
//           `Loading ${
//             bots.find((b) => b.id === selectedBot)?.name
//           }. Please wait...`}
//       </div>

//       {/* Interactive Background Elements */}
//       <div className="floating-elements" aria-hidden="true">
//         {Array.from({ length: 8 }).map((_, i) => (
//           <div
//             key={i}
//             className="floating-element"
//             style={{
//               position: "absolute",
//               width: `${6 + i * 3}px`,
//               height: `${6 + i * 3}px`,
//               borderRadius: "50%",
//               background: `linear-gradient(45deg,
//                 rgba(59, 130, 246, ${0.4 - i * 0.04}),
//                 rgba(139, 92, 246, ${0.3 - i * 0.03})
//               )`,
//               top: `${15 + i * 10}%`,
//               left: `${5 + i * 12}%`,
//               animation: `particle-float ${12 + i * 4}s ease-in-out infinite`,
//               animationDelay: `${i * 0.8}s`,
//               pointerEvents: "none",
//               zIndex: 1,
//               filter: `blur(${0.5 + i * 0.2}px)`,
//             }}
//           />
//         ))}
//       </div>

//       {/* Neural Network Visualization */}
//       <svg
//         className="neural-network"
//         style={{
//           position: "absolute",
//           inset: 0,
//           width: "100%",
//           height: "100%",
//           pointerEvents: "none",
//           zIndex: 1,
//           opacity: 0.1,
//         }}
//         aria-hidden="true"
//       >
//         <defs>
//           <linearGradient
//             id="neuralGradient"
//             x1="0%"
//             y1="0%"
//             x2="100%"
//             y2="100%"
//           >
//             <stop offset="0%" stopColor="rgba(59, 130, 246, 0.5)" />
//             <stop offset="50%" stopColor="rgba(139, 92, 246, 0.5)" />
//             <stop offset="100%" stopColor="rgba(16, 185, 129, 0.5)" />
//           </linearGradient>
//         </defs>

//         {/* Dynamic neural connections */}
//         {Array.from({ length: 12 }).map((_, i) => (
//           <line
//             key={i}
//             x1={`${10 + i * 8}%`}
//             y1={`${20 + (i % 3) * 20}%`}
//             x2={`${30 + i * 6}%`}
//             y2={`${40 + (i % 4) * 15}%`}
//             stroke="url(#neuralGradient)"
//             strokeWidth="1"
//             opacity="0.3"
//             style={{
//               animation: `neural-pulse ${3 + i * 0.5}s ease-in-out infinite`,
//               animationDelay: `${i * 0.2}s`,
//             }}
//           />
//         ))}
//       </svg>

//       {/* Custom Styles */}
//       <style jsx>{`
//         .sr-only {
//           position: absolute;
//           width: 1px;
//           height: 1px;
//           padding: 0;
//           margin: -1px;
//           overflow: hidden;
//           clip: rect(0, 0, 0, 0);
//           white-space: nowrap;
//           border: 0;
//         }

//         .cursor {
//           color: var(--hui-accent-primary);
//           animation: typing-cursor 1.2s infinite;
//         }

//         @keyframes typing-cursor {
//           0%,
//           50% {
//             opacity: 1;
//           }
//           51%,
//           100% {
//             opacity: 0;
//           }
//         }

//         @keyframes neural-pulse {
//           0%,
//           100% {
//             opacity: 0.1;
//           }
//           50% {
//             opacity: 0.6;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }
