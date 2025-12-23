
import React, { useState, useRef, useEffect } from 'react';
import BotAvatar from './components/BotAvatar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { Message, BotState, AppPhase } from './types';
import { sendMessageToDify } from './services/difyService';

const Typewriter: React.FC<{ text: string }> = ({ text }) => {
  const [currentText, setCurrentText] = useState('');
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setCurrentText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{currentText}</span>;
};

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>('waiting');
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState<string>(''); // Active streaming buffer
  const [isStreaming, setIsStreaming] = useState(false);

  const [botState, setBotState] = useState<BotState>('idle');
  const [showIntroUI, setShowIntroUI] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Phase 1 -> 2 Transition (5 seconds)
  useEffect(() => {
    if (phase === 'waiting') {
      const timer = setTimeout(() => {
        setPhase('intro');
        setTimeout(() => setShowIntroUI(true), 1100);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: botState === 'speaking' ? 'auto' : 'smooth',
      });
    }
  }, [messages, botState, streamingContent]);

  const handleSendMessage = async (text: string) => {
    if (phase === 'intro') {
      setPhase('chatting');
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setBotState('thinking');

    // Start streaming: prepare state
    setStreamingContent('');
    setIsStreaming(true);

    // Use a local variable to accumulate text for the final commit.
    // This avoids closure staleness issues with the `streamingContent` state.
    let fullContentAccumulator = "";

    await sendMessageToDify(
      text,
      (chunk) => {
        // On first chunk, if we are still 'thinking', switch to 'speaking'
        setBotState((current) => current === 'thinking' ? 'speaking' : current);

        fullContentAccumulator += chunk;
        setStreamingContent(prev => prev + chunk);
      },
      () => {
        // On complete
        setBotState('idle');
        setIsStreaming(false);
        setStreamingContent(''); // Clear buffer

        // Commit actual message to history
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: fullContentAccumulator,
            timestamp: Date.now(),
          },
        ]);
      },
      (error) => {
        console.error("Dify Error:", error);
        setBotState('idle');
        setIsStreaming(false);
        setStreamingContent('');

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Sorry, I encountered an error connecting to my brain. (${error.message || "Unknown Error"})`,
            timestamp: Date.now(),
          },
        ]);
      }
    );

  };

  const resetChat = () => {
    setPhase('waiting');
    setMessages([]);
    setBotState('idle');
    setShowIntroUI(false);
    setShowDropdown(false);
  };

  // Bot Container Style based on phase
  const getBotStyle = (): React.CSSProperties => {
    switch (phase) {
      case 'waiting':
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
        };
      case 'intro':
        return {
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '320px',
          height: '320px',
        };
      case 'chatting':
        return {
          top: '40px',
          left: '112px',
          transform: 'translate(-50%, -50%)',
          width: '48px',
          height: '48px',
        };
      default:
        return {};
    }
  };

  return (
    <div className="relative h-screen w-full flex flex-col items-center overflow-hidden liquid-bg">

      {/* Dynamic Bot Avatar Container */}
      <div
        className="fixed z-50 transition-all duration-1000 ease-in-out pointer-events-none"
        style={getBotStyle()}
      >
        <BotAvatar state={botState} isSmall={phase === 'chatting'} />
      </div>

      {/* Phase 3 Header (Transparent) */}
      <header className={`fixed top-0 left-0 w-full h-20 z-40 transition-all duration-1000 flex items-center px-6 md:px-24 ${phase === 'chatting' ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}>
        <div className="flex items-center gap-4 ml-16 md:ml-16">
          <h1 className="text-lg font-semibold text-slate-800 tracking-tight">
            Next-Gen AI Assistant
          </h1>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">History</div>
                <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  Previous Chat #1
                </button>
                <div className="my-1 border-t border-slate-50" />
                <button
                  onClick={resetChat}
                  className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 font-medium"
                >
                  + New Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Intro UI Layer (Phase 2) */}
      <div className={`fixed top-[55%] left-1/2 -translate-x-1/2 flex flex-col items-center z-30 transition-all duration-700 ${phase === 'intro' && showIntroUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
        <div className="text-2xl font-medium text-slate-700 h-10">
          {phase === 'intro' && showIntroUI && <Typewriter text="Hello, I'm MUSTAIEN." />}
        </div>
      </div>

      {/* Chat History Layer (Phase 3) */}
      <div
        ref={scrollRef}
        className={`flex-1 w-full max-w-4xl mx-auto overflow-y-auto z-10 px-4 pt-24 pb-32 transition-opacity duration-1000 ${phase === 'chatting' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      >
        <div className="flex flex-col space-y-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {/* Active Streaming Message */}
          {isStreaming && (
            <ChatMessage
              message={{
                id: 'streaming-temp',
                role: 'assistant',
                content: streamingContent,
                timestamp: Date.now()
              }}
            />
          )}

          {botState === 'thinking' && !isStreaming && (
            <div className="flex justify-start px-4">
              <div className="glass-effect px-5 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Layer (Phase 2 & 3) */}
      <div className={`fixed bottom-0 left-0 w-full flex justify-center z-30 transition-all duration-1000 ${(phase === 'intro' && showIntroUI) || phase === 'chatting'
        ? 'translate-y-0 opacity-100'
        : 'translate-y-full opacity-0'
        }`}>
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={botState === 'thinking'}
        />
      </div>

      {/* Aesthetic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-24 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 left-1/4 w-[500px] h-[500px] bg-pink-100/10 rounded-full blur-[120px]" />
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </div>
  );
};

export default App;
