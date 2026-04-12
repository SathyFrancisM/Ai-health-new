"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, MessageCircle, 
  Send, Clock, User, ArrowLeft, Camera, Monitor, X,
  CheckCircle
} from "lucide-react"

const API_BASE = "http://localhost:5000"

interface ConsultationRoomProps {
  booking: any
  user: any
  onBack: () => void
}

export function ConsultationRoom({ booking, user, onBack }: ConsultationRoomProps) {
  const [consultation, setConsultation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [showChat, setShowChat] = useState(booking?.type === 'chat')
  const [timer, setTimer] = useState(0)
  const [status, setStatus] = useState<'connecting' | 'active' | 'ended'>('connecting')
  const [error, setError] = useState("")
  
  const chatEndRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Create or join consultation session
  useEffect(() => {
    const initConsultation = async () => {
      try {
        // Create consultation from booking
        const createRes = await fetch(`${API_BASE}/api/consultation/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: booking.id,
            doctorId: booking.doctorId,
            patientId: user?.id || 'demo_user_id',
            type: booking.type || 'video',
            doctorName: booking.doctorName,
            patientName: user?.name || 'Patient'
          })
        })
        const createData = await createRes.json()
        
        const consultationData = createData.consultation || createData
        setConsultation(consultationData)

        // Join the session
        const joinRes = await fetch(
          `${API_BASE}/api/consultation/${consultationData.id}/join?userId=${user?.id || 'demo_user_id'}&role=patient`
        )
        const joinData = await joinRes.json()
        
        if (joinData.success || joinData.consultation) {
          setStatus('active')
          setMessages(consultationData.chatMessages || [])
        }

        // Connect WebSocket for real-time chat
        try {
          const ws = new WebSocket(`ws://localhost:5000/ws/consultation`)
          ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'join', consultationId: consultationData.id }))
          }
          ws.onmessage = (event) => {
            const msg = JSON.parse(event.data)
            if (msg.type === 'chat') {
              setMessages(prev => [...prev, msg])
            }
          }
          wsRef.current = ws
        } catch (wsErr) {
          console.warn('WebSocket not available, using polling')
        }
      } catch (err) {
        console.error('Failed to init consultation:', err)
        setError('Failed to connect. Please try again.')
      }
    }
    
    initConsultation()

    return () => {
      wsRef.current?.close()
    }
  }, [booking, user])

  // Start local video
  useEffect(() => {
    if (booking?.type === 'video' && status === 'active' && isCameraOn) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: isMicOn })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
        .catch(err => console.warn('Camera not available:', err))
    }
  }, [status, isCameraOn, booking?.type])

  // Timer
  useEffect(() => {
    if (status !== 'active') return
    const interval = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [status])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !consultation) return

    const msg = {
      sender: 'patient',
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    }

    // Optimistic update
    setMessages(prev => [...prev, msg])
    setNewMessage("")

    // Send via API
    try {
      await fetch(`${API_BASE}/api/consultation/${consultation.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'patient', message: msg.message })
      })

      // Also broadcast via WebSocket
      wsRef.current?.send(JSON.stringify({
        type: 'chat',
        sender: 'patient',
        message: msg.message
      }))
    } catch (err) {
      console.error('Failed to send message:', err)
    }

    // Simulate doctor response in demo mode
    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'doctor',
        message: getDemoResponse(msg.message),
        timestamp: new Date().toISOString()
      }])
    }, 2000 + Math.random() * 3000)
  }

  const endConsultation = async () => {
    if (!consultation) return
    try {
      await fetch(`${API_BASE}/api/consultation/${consultation.id}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Consultation completed' })
      })
    } catch (err) {
      console.error('Failed to end consultation:', err)
    }
    
    // Stop camera
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
    
    wsRef.current?.close()
    setStatus('ended')
  }

  // Demo doctor responses
  function getDemoResponse(msg: string) {
    const lower = msg.toLowerCase()
    if (lower.includes('hello') || lower.includes('hi')) return "Hello! How are you feeling today? Please describe your symptoms in detail."
    if (lower.includes('pain') || lower.includes('hurt')) return "I understand you're in pain. Can you tell me where exactly it hurts and for how long this has been going on?"
    if (lower.includes('fever') || lower.includes('temperature')) return "A fever can have many causes. Are you experiencing any other symptoms like cough, body aches, or chills?"
    if (lower.includes('cough')) return "For a cough, I'd recommend staying hydrated and resting. If it persists beyond a week, we should run some tests."
    if (lower.includes('thank')) return "You're welcome! Take care and don't hesitate to reach out if symptoms persist. Get well soon! 🙏"
    return "I see. Let me note that down. Could you provide more details about when these symptoms started and their severity?"
  }

  if (status === 'ended') {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-16">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </motion.div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Consultation Completed</h3>
        <p className="text-slate-500 mb-2">Duration: {formatTime(timer)}</p>
        <p className="text-slate-400 text-sm mb-8">Your consultation summary will be available in your bookings.</p>
        <button onClick={onBack}
          className="bg-gradient-premium text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-teal-500/20 hover:scale-105 transition-transform">
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl flex flex-col h-[85vh]">
      {/* Header Bar */}
      <div className="flex items-center justify-between glass px-5 py-3 rounded-2xl mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <p className="font-bold text-slate-800">{booking?.doctorName || 'Doctor'}</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
              <span className="text-xs text-slate-500 capitalize">{status}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-500 font-mono text-sm bg-slate-100 px-3 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5" /> {formatTime(timer)}
          </span>
          <button onClick={() => setShowChat(!showChat)}
            className={`p-2 rounded-xl transition-colors ${showChat ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Video / Main Area */}
        {booking?.type !== 'chat' && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-slate-900 rounded-2xl relative overflow-hidden flex items-center justify-center">
              {/* Remote Video Placeholder (Doctor) */}
              <div className="text-center">
                <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-slate-500" />
                </div>
                <p className="text-slate-400 text-sm">{booking?.doctorName || 'Doctor'}</p>
                <p className="text-slate-500 text-xs mt-1">
                  {status === 'connecting' ? 'Connecting...' : 'In demo mode — video simulated'}
                </p>
              </div>

              {/* Local Video (Self) */}
              <div className="absolute bottom-4 right-4 w-40 h-28 bg-slate-800 rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl">
                {isCameraOn ? (
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <VideoOff className="w-6 h-6 text-slate-500" />
                  </div>
                )}
                <div className="absolute bottom-1 left-1 text-xs text-white bg-black/50 px-1.5 py-0.5 rounded">You</div>
              </div>

              {/* Connection indicator */}
              {status === 'connecting' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-3 border-teal-400/30 border-t-teal-400 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-white font-medium">Connecting to doctor...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Video Controls */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button onClick={() => setIsMicOn(!isMicOn)}
                className={`p-3 rounded-full transition-colors ${isMicOn ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-red-500 text-white'}`}>
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button onClick={() => setIsCameraOn(!isCameraOn)}
                className={`p-3 rounded-full transition-colors ${isCameraOn ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-red-500 text-white'}`}>
                {isCameraOn ? <Camera className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button onClick={endConsultation}
                className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {(showChat || booking?.type === 'chat') && (
          <div className={`flex flex-col glass rounded-2xl overflow-hidden ${booking?.type === 'chat' ? 'flex-1' : 'w-80'}`}>
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-700">Chat</span>
              {booking?.type !== 'chat' && (
                <button onClick={() => setShowChat(false)} className="p-1 rounded hover:bg-slate-100">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${
                    msg.sender === 'patient' ? 'bg-teal-500 text-white rounded-br-md' :
                    msg.sender === 'system' ? 'bg-slate-100 text-slate-500 text-xs italic text-center w-full rounded-xl' :
                    'bg-white border border-slate-200 text-slate-700 rounded-bl-md'
                  }`}>
                    {msg.sender !== 'patient' && msg.sender !== 'system' && (
                      <p className="text-xs font-bold text-teal-600 mb-1">{booking?.doctorName || 'Doctor'}</p>
                    )}
                    <p>{msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'patient' ? 'text-teal-200' : 'text-slate-400'}`}>
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </motion.div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-100">
              <div className="flex gap-2">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-teal-400" />
                <button onClick={sendMessage}
                  className="bg-teal-500 text-white p-2.5 rounded-xl hover:bg-teal-600 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* End chat button for chat-only mode */}
            {booking?.type === 'chat' && (
              <div className="p-3 border-t border-slate-100">
                <button onClick={endConsultation}
                  className="w-full bg-red-50 text-red-500 py-2 rounded-xl font-medium text-sm hover:bg-red-100 transition-colors">
                  End Consultation
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
