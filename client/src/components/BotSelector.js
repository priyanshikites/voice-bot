// Replace your entire BotSelector.js file with this

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import executiveAvatar from '../assets/business-bot.jpg';
import doctorAvatar from '../assets/doctor-bot.jpg';
import assistantAvatar from '../assets/personal-bot.jpg';
// Make sure to import your CSS
import './BotSelector.css';

// Define bot options
const bots = [
  {
    id: 'business', 
    name: 'Business Executive',
    description: 'Your AI healthcare business development expert',
    avatar: executiveAvatar,
    voice: 'coral',
    color: 'from-blue-400 to-teal-500'
  },
  {
    id: 'doctor',
    name: 'Healthcare Doctor',
    description: 'Your AI medical consultant and advisor',
    avatar: doctorAvatar,
    voice: 'coral',
    color: 'from-purple-400 to-indigo-500'
  },
  {
    id: 'personal', 
    name: 'Personal Assistant',
    description: 'Your AI personal assistant for daily tasks',
    avatar: assistantAvatar,
    voice: 'shimmer',
    color: 'from-orange-400 to-red-500'
  }
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
          radial-gradient(circle at ${100-x}% ${100-y}%, rgba(255, 0, 128, 0.2), transparent 80%)
        `;
      }
      
      // Subtle movement for the spheres
      const spheres = document.querySelectorAll('.gradient-sphere');
      spheres.forEach((sphere, index) => {
        const factor = 0.02 * (index + 1);
        const xOffset = (x - 50) * factor;
        const yOffset = (y - 50) * factor;
        
        // Get current transform style and add mouse movement
        const baseTransform = sphere.style.transform || '';
        const newTransform = baseTransform.includes('translate')
          ? baseTransform.replace(/translate\([^)]+\)/, `translate(${xOffset}px, ${yOffset}px)`)
          : `translate(${xOffset}px, ${yOffset}px) ${baseTransform}`;
          
        sphere.style.transform = newTransform;
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const selectBot = (botId) => {
    navigate(`/chat/${botId}`);
  };

  return (
    <div className="h-screen w-screen relative flex flex-col items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="gradient-background">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
        <div className="gradient-sphere sphere-3"></div>
        
        {/* Interactive gradient layer */}
        <div 
          ref={gradientLayerRef}
          className="gradient-layer"
          style={{
            background: `
              radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(0, 172, 193, 0.3), transparent 70%),
              radial-gradient(circle at ${100-mousePosition.x}% ${100-mousePosition.y}%, rgba(255, 0, 128, 0.2), transparent 80%)
            `
          }}
        ></div>
      </div>
      
      {/* Logo */}
      <div className="mb-12 z-10">
        <img src={logo} alt="iKITES Logo" className="h-16" />
      </div>

      {/* Profile Selection Header */}
      <h1 className="text-5xl font-bold text-white mb-16 z-10">Who's assisting you today?</h1>

      {/* Bot Selection Grid */}
      <div className="flex justify-center space-x-8 mb-16 z-10">
        {bots.map((bot) => (
          <div
            key={bot.id}
            className="group relative"
            onMouseEnter={() => setHoverEffect(bot.id)}
            onMouseLeave={() => setHoverEffect(null)}
          >
            {/* Dynamic gradient animation on hover */}
            <div
              className={`absolute inset-0 rounded-lg bg-gradient-to-r ${bot.color} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 -z-10`}
              style={{
                transform: hoverEffect === bot.id ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.3s ease-in-out'
              }}
            />
            
            <div
              onClick={() => selectBot(bot.id)}
              className="w-48 h-48 rounded-lg bg-gradient-to-r from-gray-800 to-gray-700 flex items-center justify-center cursor-pointer overflow-hidden transform transition-transform hover:scale-105 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 animate-shimmer" 
                style={{backgroundSize: '200% 100%', animation: 'shimmer 2s infinite'}}></div>
              <img 
                src={bot.avatar} 
                alt={bot.name} 
                className="w-40 h-40 object-cover rounded-full border-4 border-opacity-20 border-white"
              />
            </div>
            <p className="text-center text-white mt-4 font-medium text-xl">{bot.name}</p>
          </div>
        ))}
      </div>
      
      {/* Inline styles for animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}