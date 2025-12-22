
import React, { useState, useEffect } from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const [displayedContent, setDisplayedContent] = useState(isAssistant ? '' : message.content);
  const [complete, setComplete] = useState(!isAssistant);

  useEffect(() => {
    if (isAssistant && !complete) {
      let index = 0;
      const interval = setInterval(() => {
        if (index < message.content.length) {
          setDisplayedContent((prev) => prev + message.content.charAt(index));
          index++;
        } else {
          setComplete(true);
          clearInterval(interval);
        }
      }, 30); // Typing speed: 30ms per character
      return () => clearInterval(interval);
    }
  }, [message.content, isAssistant, complete]);

  return (
    <div className={`flex w-full mb-4 px-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] md:max-w-[45%] p-4 rounded-2xl glass-effect ${isUser
          ? 'rounded-tr-none border-blue-200/50 bg-blue-50/20'
          : 'rounded-tl-none border-indigo-200/50 bg-indigo-50/20'
        } transform transition-all duration-500 hover:scale-[1.02] active:scale-95`}>
        <p className="text-gray-800 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
          {displayedContent}
          {!complete && (
            <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse align-middle" />
          )}
        </p>
        <span className="text-[10px] text-gray-400 mt-2 block text-right">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
