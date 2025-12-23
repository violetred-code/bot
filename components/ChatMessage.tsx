
import React, { useState, useEffect } from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  // Removed conflicting typewriter effect for streaming


  return (
    <div className={`flex w-full mb-4 px-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] md:max-w-[45%] p-4 rounded-2xl glass-effect ${isUser
        ? 'rounded-tr-none border-blue-200/50 bg-blue-50/20'
        : 'rounded-tl-none border-indigo-200/50 bg-indigo-50/20'
        } transform transition-all duration-500 hover:scale-[1.02] active:scale-95`}>
        <p className="text-gray-800 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
          {message.content}

        </p>
        <span className="text-[10px] text-gray-400 mt-2 block text-right">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default React.memo(ChatMessage);
