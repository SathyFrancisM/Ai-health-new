"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LoginForm, SignUpForm } from "@/components/auth/AuthForms"
import { HealthProfileForm } from "@/components/auth/HealthProfileForm"
import { AvatarCanvas } from "@/components/canvas/AvatarCanvas"
import { ChatContainer } from "@/components/chat/ChatContainer"
import { HospitalPortal } from "@/components/portals/HospitalPortal"
import { DoctorPortal } from "@/components/portals/DoctorPortal"
import { Heart, ShieldCheck, Activity, Stethoscope, ArrowLeft } from "lucide-react"

export default function Home() {
  const [view, setView] = useState<"login" | "signup" | "onboarding" | "dashboard" | "consultation" | "hospitals" | "doctors">("login");
  const [user, setUser] = useState<any>(null);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);

  const [detectedLocation, setDetectedLocation] = useState<string>("Detecting...");

  const triggerEmergency = async (type: "Manual" | "Auto", summary?: string) => {
    const EMERGENCY_NUMBER = "8778741264";
    
    // Construct Detailed Emergency Message
    const userDetails = `
👤 USER DETAILS:
Name: ${user?.name || "N/A"}
Age/Gender: ${user?.age || "N/A"} / ${user?.gender || "N/A"}
Blood Group: ${user?.bloodGroup || "N/A"}
📍 LAST DETECTED LOCATION: ${detectedLocation}

🏥 HEALTH STATUS:
Conditions: ${user?.existingConditions || "None reported"}
Allergies: ${user?.allergies || "None reported"}

💬 LAST CONVERSATION SUMMARY:
${summary || "No specific conversation summary available"}
    `;

    const fullMessage = `🚨 EMERGENCY ALERT from MediGuide 🚨\n${userDetails}\nType: ${type}`;

    try {
      // 1. Notify Backend
      const response = await fetch('http://localhost:5000/api/emergency/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.id || 'demo_user_id', 
          type, 
          location: detectedLocation,
          lastConversationSummary: summary || "No summary available" 
        })
      });
      
      const data = await response.json();
      
      // 2. Open WhatsApp Intent for Manual Triggers
      if (type === "Manual") {
        const encodedMsg = encodeURIComponent(fullMessage);
        window.open(`https://wa.me/91${EMERGENCY_NUMBER}?text=${encodedMsg}`, '_blank');
      }

      if (data.success) {
        alert(`🚨 EMERGENCY TRICKERED! Your health profile and chat summary have been shared.`);
      }
    } catch (err) {
      console.error("Emergency Alert Failed:", err);
    }
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    setView("dashboard");
  };

  const handleSignUpNext = (data: any) => {
    setRegistrationData(data);
    setView("onboarding");
  };

  const handleOnboardingComplete = async (healthData: any) => {
    try {
      const fullData = { ...registrationData, ...healthData };
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || "Registration failed");

      localStorage.setItem('token', data.token);
      setUser(data.user);
      setView("dashboard");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-200/20 blur-[120px] rounded-full animate-float" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-200/20 blur-[120px] rounded-full animate-float [animation-delay:2s]" />

      {/* Header / Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-8 left-8 flex items-center gap-2 z-50"
      >
        <div className="bg-gradient-premium p-2 rounded-xl shadow-lg shadow-teal-600/20 cursor-pointer" onClick={() => setView("dashboard")}>
          <Heart className="text-white h-6 w-6" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-800">Medi<span className="text-teal-600">Guide</span></span>
      </motion.div>

      <AnimatePresence mode="wait">
        {view === "login" && (
          <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <LoginForm 
              onToggle={() => setView("signup")} 
              onLocationDetect={(loc) => setDetectedLocation(loc)} 
              onLogin={handleLogin}
            />
          </motion.div>
        )}

        {view === "signup" && (
          <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SignUpForm onToggle={() => setView("login")} onNext={handleSignUpNext} />
          </motion.div>
        )}

        {view === "onboarding" && (
          <motion.div key="onboarding" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HealthProfileForm onSubmit={handleOnboardingComplete} />
          </motion.div>
        )}

        {view === "dashboard" && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-6xl flex flex-col items-center"
          >
            <div className="text-center mb-12">
               <h1 className="text-5xl font-bold text-slate-800 mb-4">Hello, <span className="text-gradient">{user?.name || "Advait"}</span></h1>
               <p className="text-slate-500 text-lg">Your AI Health Assistant is ready to help you.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full px-4">
               <div 
                 onClick={() => setView("consultation")}
                 className="glass p-8 rounded-3xl text-center space-y-4 hover:scale-[1.02] transition-transform cursor-pointer border border-teal-100"
               >
                  <div className="bg-teal-100 p-4 rounded-2xl w-fit mx-auto"><Activity className="text-teal-600 h-8 w-8" /></div>
                  <h3 className="text-xl font-bold">Start Consultation</h3>
                  <p className="text-slate-500 text-sm">Chat with MediGuide for instant Indian home remedies.</p>
               </div>
               <div 
                 onClick={() => setView("doctors")}
                 className="glass p-8 rounded-3xl text-center space-y-4 hover:scale-[1.02] transition-transform cursor-pointer border border-cyan-100"
               >
                  <div className="bg-cyan-100 p-4 rounded-2xl w-fit mx-auto"><Stethoscope className="text-cyan-600 h-8 w-8" /></div>
                  <h3 className="text-xl font-bold">Find Doctors</h3>
                  <p className="text-slate-500 text-sm">Browse specialist listings and book appointments.</p>
               </div>
               <div 
                 onClick={() => setView("hospitals")}
                 className="glass p-8 rounded-3xl text-center space-y-4 hover:scale-[1.02] transition-transform cursor-pointer border border-blue-100"
               >
                  <div className="bg-blue-100 p-4 rounded-2xl w-fit mx-auto"><ShieldCheck className="text-blue-600 h-8 w-8" /></div>
                  <h3 className="text-xl font-bold">Hospitals</h3>
                  <p className="text-slate-500 text-sm">Locate nearby care facilities and emergency services.</p>
               </div>
            </div>

            <button 
              onClick={() => triggerEmergency("Manual")}
              className="mt-12 bg-red-500 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-2xl shadow-red-500/40 hover:bg-red-600 transition-colors animate-float"
            >
               <span className="text-2xl">🚨</span> SEND EMERGENCY ALERT
            </button>
          </motion.div>
        )}

        {view === "consultation" && (
          <motion.div 
            key="consultation"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-center gap-8 relative h-[85vh]"
          >
            <button 
              onClick={() => setView("dashboard")}
              className="absolute top-0 left-4 flex items-center gap-2 text-slate-500 hover:text-teal-600 font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> Back to Dashboard
            </button>

            {/* Emergency Button in Consultation */}
            <button 
              onClick={() => triggerEmergency("Manual")}
              className="absolute top-0 right-4 bg-red-50 text-red-500 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-red-100 transition-colors"
            >
               🚨 EMERGENCY
            </button>

            <div className="flex-1 w-full h-full flex items-center justify-center">
              <AvatarCanvas isSpeaking={isAvatarSpeaking} />
            </div>

            <div className="flex-1 w-full flex items-center justify-center">
              <ChatContainer 
                onSpeak={(s) => setIsAvatarSpeaking(s)} 
                onEmergency={(summary: string) => triggerEmergency("Auto", summary)}
                user={user}
              />
            </div>
          </motion.div>
        )}

        {view === "hospitals" && (
          <motion.div key="hospitals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full flex justify-center">
            <HospitalPortal onBack={() => setView("dashboard")} />
          </motion.div>
        )}

        {view === "doctors" && (
          <motion.div key="doctors" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full flex justify-center">
            <DoctorPortal onBack={() => setView("dashboard")} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="absolute bottom-6 text-slate-400 text-sm flex gap-6">
        <span>© 2026 MediGuide AI</span>
        <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Secure & Encrypted</span>
      </div>
    </main>
  )
}
