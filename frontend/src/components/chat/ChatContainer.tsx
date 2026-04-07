"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Mic, MicOff, Volume2, VolumeX, User, Bot, Sparkles, AlertCircle } from "lucide-react"

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export function ChatContainer({ onSpeak, onEmergency, user }: { 
  onSpeak: (speaking: boolean) => void,
  onEmergency: (summary: string) => void,
  user: any
}) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Namaste! I'm MediGuide, your health companion. How are you feeling today?", sender: "bot", timestamp: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [isEmergencyDisabled, setIsEmergencyDisabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Inactivity Timer (3 minutes)
  useEffect(() => {
    if (isEmergencyDisabled) return;

    // Clear existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Filter "bye" intent
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.sender === 'user' && /bye|goodbye|end|exit/i.test(lastMsg.text)) {
      setIsEmergencyDisabled(true);
      return;
    }

    // Set new timer
    timerRef.current = setTimeout(() => {
      const summary = messages.map(m => `[${m.sender}] ${m.text}`).join('\n');
      onEmergency(summary);
    }, 3 * 60 * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [messages, isEmergencyDisabled, onEmergency]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: input, sender: "user", timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    
    // Call Backend AI
    onSpeak(true);
    try {
      const response = await fetch('http://localhost:5000/api/ai/consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input, 
          userId: user?.id || 'demo_user_id',
          allergies: user?.allergies || []
        })
      });
      
      const data = await response.json();
      
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        text: data.text, 
        sender: "bot", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, botMsg]);
      
      if (isTtsEnabled) speakText(botMsg.text);
    } catch (err) {
      console.error(err);
      const errMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        text: "I'm sorry, I'm having trouble connecting. Please try again later.", 
        sender: "bot", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      onSpeak(false);
    }
  };

  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    // Auto-detect language or use a friendly voice
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-lg glass rounded-3xl overflow-hidden shadow-2xl border border-white/40">
      {/* Header */}
      <div className="p-4 border-b border-white/20 bg-teal-500/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Bot className="text-teal-600 w-5 h-5" />
           <span className="font-bold text-slate-800">Live Consultation</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              const summary = messages.map(m => `[${m.sender}] ${m.text}`).join('\n');
              onEmergency(summary);
            }}
            className="p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group"
            title="Manual Emergency Alert"
          >
             <AlertCircle className="text-red-500 w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
          <button 
            onClick={() => setIsTtsEnabled(!isTtsEnabled)}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            {isTtsEnabled ? <Volume2 className="text-teal-600 w-5 h-5" /> : <VolumeX className="text-slate-400 w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                msg.sender === 'user' 
                ? 'bg-gradient-premium text-white rounded-tr-none' 
                : 'bg-white text-slate-800 shadow-md rounded-tl-none border border-slate-100'
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <div className="text-[10px] mt-1 opacity-60 text-right">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 bg-white/40 border-t border-white/20">
        <div className="flex gap-2 items-center bg-white rounded-2xl p-1 shadow-inner border border-slate-100">
          <button 
            onClick={startListening}
            className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'hover:bg-slate-50 text-slate-400'}`}
          >
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3 bg-gradient-premium text-white rounded-xl shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:shadow-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" /> Powered by MediGuide AI
        </p>
      </div>
    </div>
  )
}
