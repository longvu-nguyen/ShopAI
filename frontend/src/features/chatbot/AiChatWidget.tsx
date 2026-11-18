import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User as UserIcon, 
  ShoppingBag, 
  ArrowUpRight, 
  RotateCcw,
  Loader2
} from 'lucide-react';
import { aiChatApi } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { ChatProductRecommendation } from '../../types';

interface DisplayMessage {
  id: string;
  sender: 'User' | 'Assistant';
  text: string;
  recommendedProducts?: ChatProductRecommendation[];
  orderSummary?: string;
  timestamp: string;
}

export const AiChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'welcome',
      sender: 'Assistant',
      text: "👋 Hi! I'm **ShopAI Assistant**, your intelligent shopping & order support advisor.\n\nHow can I help you today? Ask me about products, order tracking, shipping, or warranty policies!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>(() => {
    return localStorage.getItem('shopai_chat_session') || '';
  });

  const { addToCart } = useCart();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Load history if session exists
  useEffect(() => {
    if (sessionToken) {
      aiChatApi.getHistory(sessionToken).then((res) => {
        if (res.success && res.data?.messages?.length > 0) {
          const loaded: DisplayMessage[] = res.data.messages.map((m) => {
            let prods: ChatProductRecommendation[] | undefined;
            if (m.metadataJson) {
              try {
                const parsed = JSON.parse(m.metadataJson);
                prods = parsed.recommendations;
              } catch {
                // ignore
              }
            }
            return {
              id: m.id,
              sender: m.sender,
              text: m.message,
              recommendedProducts: prods,
              timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
          });
          setMessages(loaded);
        }
      }).catch(() => {
        // start fresh session if expired
        localStorage.removeItem('shopai_chat_session');
        setSessionToken('');
      });
    }
  }, []);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: DisplayMessage = {
      id: Math.random().toString(),
      sender: 'User',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await aiChatApi.sendMessage(text, sessionToken || undefined);
      if (res.success && res.data) {
        if (res.data.sessionToken && res.data.sessionToken !== sessionToken) {
          setSessionToken(res.data.sessionToken);
          localStorage.setItem('shopai_chat_session', res.data.sessionToken);
        }

        const botMsg: DisplayMessage = {
          id: Math.random().toString(),
          sender: 'Assistant',
          text: res.data.reply,
          recommendedProducts: res.data.recommendedProducts,
          orderSummary: res.data.orderLookupSummary,
          timestamp: new Date(res.data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'Assistant',
          text: "I'm having trouble connecting to the intelligence server right now. Please try again in a few moments.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem('shopai_chat_session');
    setSessionToken('');
    setMessages([
      {
        id: 'welcome_reset',
        sender: 'Assistant',
        text: "👋 Chat session reset. What can I help you find or answer today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const quickPrompts = [
    { label: '📦 Track My Order', prompt: 'Where is my order status?' },
    { label: '🎧 Top Headphones', prompt: 'Recommend the best noise cancelling headphones' },
    { label: '💻 Coding Laptops', prompt: 'What are the top laptops for developers?' },
    { label: '🚚 Shipping & Rates', prompt: 'How does your free shipping policy work?' },
    { label: '🛡️ 30-Day Returns', prompt: 'What is your return and warranty policy?' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 text-white rounded-full shadow-2xl hover:shadow-brand-500/50 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white animate-ping" />
          </div>
          <span className="font-bold text-xs tracking-wide">Ask ShopAI</span>
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-white">ShopAI Assistant</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-300 font-medium">Intelligent E-Commerce Advisory</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Restart Conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Minimize Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp.prompt)}
                className="whitespace-nowrap px-3 py-1 bg-white border border-slate-200/80 hover:border-brand-500 hover:text-brand-600 rounded-full text-[11px] font-medium text-slate-600 transition-colors shadow-subtle shrink-0"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'User' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'Assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] ${m.sender === 'User' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div
                    className={`px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-subtle ${
                      m.sender === 'User'
                        ? 'bg-brand-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{m.text}</div>

                    {/* Rich Product Recommendations Cards */}
                    {m.recommendedProducts && m.recommendedProducts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                        {m.recommendedProducts.map((prod) => (
                          <div
                            key={prod.id}
                            className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200/60 hover:border-brand-300 transition-colors"
                          >
                            <img
                              src={prod.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=150&q=80'}
                              alt={prod.name}
                              className="w-12 h-12 rounded-lg object-cover bg-white shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-[11px] text-slate-900 truncate">{prod.name}</h5>
                              <p className="text-[10px] text-brand-600 font-extrabold mt-0.5">${prod.price.toFixed(2)}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  onClick={() => {
                                    setIsOpen(false);
                                    navigate(`/products/${prod.slug}`);
                                  }}
                                  className="text-[10px] font-semibold text-slate-700 hover:text-brand-600 flex items-center gap-0.5"
                                >
                                  <span>Details</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => addToCart(prod.id, 1)}
                                  className="text-[10px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5 ml-auto"
                                >
                                  <ShoppingBag className="w-3 h-3" />
                                  <span>Add</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
                </div>

                {m.sender === 'User' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center">
                <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-4 py-2.5 bg-white border border-slate-100 rounded-2xl rounded-bl-none shadow-subtle flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                  <span>ShopAI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask anything or enter ORD-..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 bg-slate-100 text-xs rounded-full border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-full shadow-md transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
