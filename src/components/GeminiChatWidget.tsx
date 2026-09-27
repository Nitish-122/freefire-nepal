import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const GeminiChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: 'Namaste! 🙏 I am your Khiladi Nepal Support Assistant. Ask me anything about tournaments, joining scrims, wallet points, eSewa/Khalti deposits, or Free Fire rules!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Format history for backend API request
      const history = newMessages.slice(0, -1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history })
      });

      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I am having trouble connecting right now. Please try again later.' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: 'Connection error. Please check your network.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="relative group flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-gradient-to-r from-[#E50914] to-[#B20710] hover:from-[#FF1E28] hover:to-[#C40812] text-white shadow-[0_0_25px_rgba(229,9,20,0.5)] hover:shadow-[0_0_35px_rgba(229,9,20,0.8)] transition-all transform hover:scale-105 cursor-pointer font-gaming text-xs font-bold uppercase tracking-wider"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#121212]" />
          </div>
          <span>AI Support Chat</span>
          <Sparkles className="w-4 h-4 text-amber-300" />
        </button>
      ) : (
        <div className="w-[90vw] sm:w-[380px] h-[520px] bg-[#121212] border border-[#2A2A2A] rounded-3xl shadow-[0_0_50px_rgba(229,9,20,0.3)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#1C1212] to-[#121212] border-b border-[#222222] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E50914]/20 border border-[#E50914]/50 flex items-center justify-center text-[#E50914]">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                  Khiladi Support AI <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                </h3>
                <p className="text-[10px] text-neutral-400 font-gaming uppercase tracking-widest">
                  Powered by Gemini Flash
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#0A0A0A]">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'model' && (
                  <div className="w-7 h-7 rounded-lg bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center text-[#E50914] shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#E50914] text-white rounded-br-none font-medium'
                      : 'bg-[#181818] border border-[#262626] text-neutral-200 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center text-[#E50914] shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 rounded-2xl bg-[#181818] border border-[#262626] text-neutral-400 text-xs flex items-center gap-2 rounded-bl-none">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E50914]" />
                  <span>Checking tournaments & rules...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-[#101010] border-t border-[#1F1F1F] flex gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setInput('How to join a tournament?')}
              className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-neutral-300 whitespace-nowrap cursor-pointer transition-colors"
            >
              🎮 How to join tournament?
            </button>
            <button
              type="button"
              onClick={() => setInput('How to deposit money via eSewa?')}
              className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-neutral-300 whitespace-nowrap cursor-pointer transition-colors"
            >
              💳 eSewa deposit guide
            </button>
            <button
              type="button"
              onClick={() => setInput('Where do I get Room ID & Password?')}
              className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-neutral-300 whitespace-nowrap cursor-pointer transition-colors"
            >
              🔑 Room ID & Password
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-[#121212] border-t border-[#222222] flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about tournaments, wallet, rules..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2A2A2A] text-white focus:border-[#E50914] focus:outline-none text-xs"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-[#E50914] hover:bg-[#C40812] disabled:opacity-50 text-white transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
