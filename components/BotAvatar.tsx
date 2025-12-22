
import React from 'react';
import { BotState } from '../types';

interface BotAvatarProps {
  state: BotState;
  className?: string;
  isSmall?: boolean;
}

const BotAvatar: React.FC<BotAvatarProps> = ({ state, className = '', isSmall = false }) => {
  const isThinking = state === 'thinking';
  const isSpeaking = state === 'speaking';

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
      {/* Dynamic Glow - Size Aware */}
      <div className={`absolute inset-0 rounded-full transition-all duration-1000 opacity-30 ${isSmall ? 'blur-[10px]' : 'blur-[80px] md:blur-[120px]'
        } ${isThinking ? 'bg-purple-600 scale-150 animate-pulse' :
          isSpeaking ? 'bg-blue-500 scale-125 animate-bounce-slow' :
            'bg-indigo-400 scale-100'
        }`} />

      {/* Sparkling Stars - Fewer and smaller if small */}
      {[...Array(isSmall ? 4 : 8)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full animate-sparkle"
          style={{
            width: isSmall ? '1px' : '3px',
            height: isSmall ? '1px' : '3px',
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: Math.random() * 0.7 + 0.3,
          }}
        />
      ))}

      {/* Bot Icon (GIF) */}
      <div className={`relative w-[90%] h-[90%] flex items-center justify-center transition-all duration-700 pointer-events-none ${isThinking ? 'scale-110 rotate-3' :
          isSpeaking ? 'scale-105' :
            'scale-100 animate-float'
        }`}>
        <img
          src="/mustaien2.gif"
          alt="AI Bot"
          className="w-full h-full object-contain"
          style={{
            filter: `drop-shadow(0 0 ${isSmall ? '4px' : '20px'} rgba(99, 102, 241, 0.4))`
          }}
        />

        {/* Additional Floating Sparks - Only if not small for performance/clarity */}
        {!isSmall && (
          <div className="absolute inset-0 z-10">
            <div className="absolute top-1/4 right-0 w-[5%] h-[5%] bg-yellow-200 rounded-full blur-[2px] animate-ping" />
            <div className="absolute bottom-1/4 left-0 w-[7%] h-[7%] bg-blue-200 rounded-full blur-[2px] animate-pulse" />
            <div className="absolute top-0 left-1/2 w-[5%] h-[5%] bg-purple-200 rounded-full blur-[2px] animate-bounce-slow" />
          </div>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5%) rotate(2deg); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3%); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-sparkle {
          animation: sparkle 4s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default BotAvatar;
