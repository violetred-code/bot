
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
  const [progress, setProgress] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Phase 1 -> 2 Transition (5 seconds) & Progress Timer
  useEffect(() => {
    if (phase === 'waiting') {
      const startTime = Date.now();
      const duration = 5000;

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min(Math.round((elapsed / duration) * 100), 100);
        setProgress(currentProgress);

        if (elapsed >= duration) {
          clearInterval(interval);
          setPhase('intro');
          setTimeout(() => setShowIntroUI(true), 1100);
        }
      }, 50);

      return () => clearInterval(interval);
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
    let fullContentAccumulator = "";

    await sendMessageToDify(
      text,
      (chunk) => {
        setBotState((current) => current === 'thinking' ? 'speaking' : current);
        fullContentAccumulator += chunk;
        setStreamingContent(prev => prev + chunk);
      },
      () => {
        setBotState('idle');
        setIsStreaming(false);
        setStreamingContent('');
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
    setPhase('intro');
    setMessages([]);
    setBotState('idle');
    setShowIntroUI(true);
    setProgress(100);
  };

  const getBotStyle = (): React.CSSProperties => {
    switch (phase) {
      case 'waiting':
        return {
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '500px', height: '500px',
        };
      case 'intro':
        return {
          top: '35%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '320px', height: '320px',
        };
      case 'chatting':
        return {
          top: '56px',
          left: '50px',
          transform: 'translate(-50%, -50%)',
          width: '44px',
          height: '44px',
          cursor: isSidebarCollapsed ? 'pointer' : 'default',
          pointerEvents: 'auto',
        };
      default:
        return {};
    }
  };

  const sidebarWidth = isSidebarCollapsed ? '72px' : '280px';

  return (
    <div className="relative h-screen w-full flex overflow-hidden liquid-bg">

      {/* Sidebar (Phase 3) */}
      <aside
        style={{ width: phase === 'chatting' ? sidebarWidth : '280px' }}
        className={`h-[calc(100%-32px)] m-4 bg-white/20 backdrop-blur-2xl border border-white/30 shadow-[0_10px_40px_-10px_rgba(31,38,135,0.15)] rounded-[32px] flex flex-col z-40 transition-all duration-500 ease-in-out ${phase === 'chatting' ? 'translate-x-0' : '-translate-x-[110%]'
          }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between h-[80px]">
          {!isSidebarCollapsed ? (
            <>
              <div className="flex flex-col ml-12 animate-in fade-in duration-300">
                <span className="text-[14px] font-bold text-slate-800 leading-tight tracking-tight">MUSTAINE</span>
                <span className="text-[12px] font-medium text-slate-500 leading-tight">Next-Gen WebUI</span>
              </div>
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="text-slate-400 hover:text-[#635BFF] transition-colors p-2 rounded-xl hover:bg-white/40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
            </>
          ) : null}
        </div>

        {/* Sidebar Menu Items */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 py-4 scrollbar-hide">
          <button onClick={resetChat} className="w-full h-11 flex items-center gap-3 px-3 py-2 text-[15px] font-medium text-slate-700 hover:bg-white/40 hover:text-[#635BFF] rounded-xl transition-all group overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-[#635BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {!isSidebarCollapsed && <span className="animate-in fade-in slide-in-from-left-2 truncate font-semibold">새 채팅</span>}
          </button>

          <button className="w-full h-11 flex items-center gap-3 px-3 py-2 text-[15px] font-medium text-slate-700 hover:bg-white/40 hover:text-[#635BFF] rounded-xl transition-all group overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-[#635BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {!isSidebarCollapsed && <span className="animate-in fade-in slide-in-from-left-2 truncate">검색</span>}
          </button>

          <button className="w-full h-11 flex items-center gap-3 px-3 py-2 text-[15px] font-medium text-slate-700 hover:bg-white/40 hover:text-[#635BFF] rounded-xl transition-all group overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-[#635BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {!isSidebarCollapsed && <span className="animate-in fade-in slide-in-from-left-2 truncate">노트</span>}
          </button>

          {!isSidebarCollapsed && (
            <div className="animate-in fade-in duration-500">
              <div className="pt-6 pb-2">
                <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">대화 요약</span>
              </div>

              {/* History Items - Active at Top */}
              <div className="space-y-1 mt-1">
                {['현재 진행 중인 채팅', '👋 Hello', '📅 Days Left in 2023', '📊 HR 대시보드 구성 요소', '👋 Welcome Message'].map((item, idx) => (
                  <button
                    key={idx}
                    className={`group w-full flex items-center gap-2 px-3 py-2.5 text-[14px] rounded-xl text-left truncate transition-all ${idx === 0
                      ? 'bg-white text-[#635BFF] font-bold shadow-[0_4px_12px_-2px_rgba(99,91,255,0.15)] ring-1 ring-[#635BFF]/10'
                      : 'text-slate-600 hover:bg-white/50 hover:text-[#635BFF]'
                      }`}
                  >
                    <span className="truncate">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Section */}
        <div className={`p-4 border-t border-white/10 bg-white/10 relative ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
          {showProfileMenu && (
            <div className="absolute bottom-full left-4 mb-2 w-48 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl p-1 z-50 animate-in fade-in slide-in-from-bottom-2">
              <button className="w-full text-left px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-[#635BFF]/10 hover:text-[#635BFF] rounded-xl transition-all flex items-center gap-2 group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 group-hover:text-[#635BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                설정
              </button>
              <button onClick={() => window.location.reload()} className="w-full text-left px-3 py-2 text-[13px] font-medium text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                로그아웃
              </button>
            </div>
          )}
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`p-2 rounded-2xl hover:bg-white/40 transition-all cursor-pointer flex items-center ${isSidebarCollapsed ? 'justify-center border border-white/20' : 'gap-3 border border-white/20 shadow-sm bg-white/5 mx-1'}`}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/50 shadow-sm shrink-0">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Judha"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0 animate-in fade-in duration-300">
                <p className="text-[13px] font-bold text-slate-800 truncate">Judha Maygustya</p>
                <p className="text-[10px] text-slate-500 truncate font-medium">judha.design@gmail.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col items-center overflow-hidden">

        {/* Bot Avatar */}
        <div
          onClick={() => isSidebarCollapsed && setIsSidebarCollapsed(false)}
          className="fixed z-50 transition-all duration-700 ease-in-out"
          style={getBotStyle()}
        >
          <BotAvatar state={botState} isSmall={phase === 'chatting'} />

          {/* Loading Counter (Phase 1 only) */}
          {phase === 'waiting' && (
            <div className="absolute top-[110%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full animate-in fade-in zoom-in duration-500">
              <div className="text-4xl font-light text-indigo-600/80 tracking-widest font-mono">
                {progress}<span className="text-xl ml-1">%</span>
              </div>
              <div className="w-48 h-[2px] bg-indigo-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-100 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Intro UI Layer (Phase 2) */}
        <div className={`fixed top-[55%] left-1/2 -translate-x-1/2 flex flex-col items-center z-30 transition-all duration-700 ${phase === 'intro' && showIntroUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
          <div className="text-2xl font-medium text-slate-700 h-10">
            {phase === 'intro' && showIntroUI && <Typewriter text="Hello, I'm MUSTAIEN." />}
          </div>
        </div>

        {/* Chat History Area (Phase 3) */}
        <div
          ref={scrollRef}
          className={`flex-1 w-full max-w-4xl mx-auto overflow-y-auto z-10 px-4 pt-8 pb-32 transition-opacity duration-1000 ${phase === 'chatting' ? 'opacity-100' : 'opacity-0 pointer-events-none'
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
                <div className="glass-effect px-5 py-3 rounded-2xl rounded-tl-none flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-[#635BFF] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-[#635BFF] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-[#635BFF] rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-sm font-medium text-[#635BFF]/70 animate-pulse">MUSTAIEN is typing...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Layer (Phase 2 & 3) */}
        <div className={`fixed bottom-0 right-0 w-full flex justify-center z-30 transition-all duration-700 ${(phase === 'intro' && showIntroUI) || phase === 'chatting'
          ? 'translate-y-0 opacity-100'
          : 'translate-y-full opacity-0'
          }`}
          style={{ width: phase === 'chatting' ? `calc(100% - ${sidebarWidth} - 32px)` : '100%' }}>
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
      </main>

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
