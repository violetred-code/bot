
import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  return (
    <div className="w-full max-w-4xl px-4 pb-8">
      <form
        onSubmit={handleSubmit}
        className="glass-effect rounded-full p-2 pl-6 flex items-center gap-4 transition-all focus-within:ring-2 focus-within:ring-indigo-400/50 shadow-[0_10px_40px_-10px_rgba(31,38,135,0.2)] border-white/50"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask something..."
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-400 py-3 text-lg"
        />
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${text.trim() && !disabled
              ? 'bg-indigo-500 text-white shadow-lg hover:bg-indigo-600 scale-100'
              : 'bg-gray-100 text-gray-400 scale-95 opacity-50 cursor-not-allowed'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
