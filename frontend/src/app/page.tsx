"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LoginForm, SignUpForm } from "@/components/auth/AuthForms"
import { HealthProfileForm } from "@/components/auth/HealthProfileForm"
import { AvatarCanvas } from "@/components/canvas/AvatarCanvas"
import { ChatContainer } from "@/components/chat/ChatContainer"
import { HospitalPortal } from "@/components/portals/HospitalPortal"
import { DoctorPortal } from "@/components/portals/DoctorPortal"
import { ReceiptList } from "@/components/portals/ReceiptList"
import { BookingPortal } from "@/components/portals/BookingPortal"
import { ConsultationRoom } from "@/components/portals/ConsultationRoom"
import { PharmacyPortal } from "@/components/portals/PharmacyPortal"
import { OrderTracker } from "@/components/portals/OrderTracker"
import { Navbar } from "@/components/layout/Navbar"
import { Heart, ShieldCheck, Activity, Stethoscope, ArrowLeft, MapPin, Pill, Package, CalendarPlus } from "lucide-react"

export default function Home() {
  const [view, setView] = useState<"login" | "signup" | "onboarding" | "dashboard" | "ai_consultation" | "hospitals" | "doctors" | "booking" | "video_consultation" | "pharmacy" | "orders">("login");
  const [user, setUser] = useState<any>(null);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  
  // State for passing data between views
  const [activeConsultationBooking, setActiveConsultationBooking] = useState<any>(null);

  const [detectedLocation, setDetectedLocation] = useState<string>("Detecting...");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  const triggerEmergency = async (type: "Manual" | "Auto", summary?: string) => {
    const EMERGENCY_NUMBER = "8778741264";
    
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
      const fullData = { 
        ...registrationData, 
        ...healthData, 
        location: detectedLocation,
        lat: gpsCoords?.lat || null,
        lng: gpsCoords?.lng || null
      };
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

  const startVideoConsultation = (bookingData: any) => {
    setActiveConsultationBooking(bookingData);
    setView("video_consultation");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    setView("login");
  };

  const isAuthNavView = view !== "login" && view !== "signup" && view !== "onboarding";

  return (
    <main className={`min-h-screen flex flex-col ${isAuthNavView ? 'pt-28 pb-16 items-center p-4' : 'items-center justify-center p-4'} relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-cyan-50`}>
      
      <Navbar view={view} setView={setView} user={user} onLogout={handleLogout} />

      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-200/20 blur-[120px] rounded-full animate-float pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-200/20 blur-[120px] rounded-full animate-float [animation-delay:2s] pointer-events-none" />

      {/* Header / Logo - Only visible on public views */}
      {!isAuthNavView && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-8 left-8 flex items-center gap-2 z-50 text-slate-800"
        >
          <div className="bg-gradient-premium p-2 rounded-xl shadow-lg shadow-teal-600/20 cursor-pointer" onClick={() => setView("dashboard")}>
            <Heart className="text-white h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-800 cursor-pointer" onClick={() => setView("dashboard")}>
            Medi<span className="text-teal-600">Guide</span>
          </span>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {view === "login" && (
          <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <LoginForm 
              onToggle={() => setView("signup")} 
              onLocationDetect={(loc) => setDetectedLocation(loc)}
              onGpsDetect={(coords) => setGpsCoords(coords)}
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
            className="w-full max-w-6xl flex flex-col items-center mt-12 pb-16"
          >
            <div className="text-center mb-10 w-full">
               <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">Hello, <span className="text-gradient truncate inline-block max-w-[10em] align-bottom">{user?.name || "Advait"}</span></h1>
               <p className="text-slate-500 text-lg">
                 {user?.role === 'Doctor' ? "Doctor Dashboard - Manage your appointments." : 
                  user?.role === 'Hospital' ? "Hospital Reception - Manage incoming reports." : 
                  "Your complete digital healthcare companion."}
               </p>
            </div>

            {(!user?.role || user?.role === 'User') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full px-4">
                 
                 {/* AI Consultation (Old Main Feature) */}
                 <div onClick={() => setView("ai_consultation")} className="glass p-6 rounded-3xl text-center space-y-4 hover:scale-[1.02] transition-transform cursor-pointer border border-teal-100 group">
                    <div className="bg-teal-100 p-4 rounded-2xl w-fit mx-auto group-hover:bg-teal-200 transition-colors"><Activity className="text-teal-600 h-8 w-8" /></div>
                    <h3 className="text-lg font-bold">AI Companion</h3>
                    <p className="text-slate-500 text-xs">Chat for quick symptoms & verified Indian home remedies.</p>
                 </div>

                 {/* New Booking System */}
                 <div onClick={() => setView("booking")} className="glass p-6 rounded-3xl text-center space-y-4 hover:scale-[1.02] transition-transform cursor-pointer border border-blue-100 group">
                    <div className="bg-blue-100 p-4 rounded-2xl w-fit mx-auto group-hover:bg-blue-200 transition-colors"><CalendarPlus className="text-blue-600 h-8 w-8" /></div>
                    <h3 className="text-lg font-bold">Book Doctor</h3>
                    <p className="text-slate-500 text-xs">Find specialists & book in-person or video appointments.</p>
                 </div>

                 {/* Pharmacy */}
                 <div onClick={() => setView("pharmacy")} className="glass p-6 rounded-3xl text-center space-y-4 hover:scale-[1.02] transition-transform cursor-pointer border border-emerald-100 group">
                    <div className="bg-emerald-100 p-4 rounded-2xl w-fit mx-auto group-hover:bg-emerald-200 transition-colors"><Pill className="text-emerald-600 h-8 w-8" /></div>
                    <h3 className="text-lg font-bold">Pharmacy</h3>
                    <p className="text-slate-500 text-xs">Order medicines, upload prescriptions, fast delivery.</p>
                 </div>
                 
                 {/* Quick Actions Card */}
                 <div className="glass p-6 rounded-3xl flex flex-col justify-between border border-purple-100">
                    <div className="space-y-3 w-full">
                      <button onClick={() => setView("orders")} className="w-full flex items-center justify-between p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors">
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><Package className="w-4 h-4 text-purple-500" /> My Orders</span>
                        <span className="text-slate-300 text-xs">&rarr;</span>
                      </button>
                      <button onClick={() => setView("doctors")} className="w-full flex items-center justify-between p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors">
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-cyan-500" /> Directory</span>
                        <span className="text-slate-300 text-xs">&rarr;</span>
                      </button>
                      <button onClick={() => setView("hospitals")} className="w-full flex items-center justify-between p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors">
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500" /> ERP Map</span>
                        <span className="text-slate-300 text-xs">&rarr;</span>
                      </button>
                    </div>
                 </div>

                 <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex justify-center mt-6">
                    <button 
                      onClick={() => triggerEmergency("Manual")}
                      className="bg-red-500 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-red-500/30 hover:bg-red-600 hover:shadow-red-500/50 transition-all animate-float"
                    >
                       <span className="text-2xl">🚨</span> EMERGENCY SOS ALARM
                    </button>
                 </div>
              </div>
            )}

            {(user?.role === 'Doctor' || user?.role === 'Hospital') && (
              <div className="w-full px-4 max-w-4xl">
                 <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                       <Stethoscope className="text-teal-500" /> Appointments & Consultations
                    </h3>
                    <ReceiptList user={user} />
                 </div>
              </div>
            )}

          </motion.div>
        )}

        {/* Existing AI Chat UI */}
        {view === "ai_consultation" && (
          <motion.div 
            key="ai_consultation"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-center gap-8 relative h-[85vh] mt-8"
          >
            <button 
              onClick={() => setView("dashboard")}
              className="absolute -top-6 left-4 flex items-center gap-2 text-slate-500 hover:text-teal-600 font-medium transition-colors z-10"
            >
              <ArrowLeft className="w-5 h-5" /> Back
            </button>

            <button 
              onClick={() => triggerEmergency("Manual")}
              className="absolute -top-6 right-4 bg-red-50 text-red-500 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-red-100 transition-colors z-10"
            >
               🚨 SOS
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

        {/* New Modular Features */}
        {view === "booking" && (
          <motion.div key="booking" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full flex justify-center mt-12">
            <BookingPortal user={user} gpsCoords={gpsCoords} onBack={() => setView("dashboard")} onConsultation={startVideoConsultation} />
          </motion.div>
        )}

        {view === "video_consultation" && activeConsultationBooking && (
          <motion.div key="video_consultation" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex justify-center mt-8">
            <ConsultationRoom booking={activeConsultationBooking} user={user} onBack={() => setView("dashboard")} />
          </motion.div>
        )}

        {view === "pharmacy" && (
          <motion.div key="pharmacy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full flex justify-center mt-12">
            <PharmacyPortal user={user} onBack={() => setView("dashboard")} />
          </motion.div>
        )}

        {view === "orders" && (
          <motion.div key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full flex justify-center mt-12">
            <OrderTracker user={user} onBack={() => setView("dashboard")} />
          </motion.div>
        )}

        {/* Old Directories */}
        {view === "hospitals" && (
          <motion.div key="hospitals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full flex justify-center mt-12">
            <HospitalPortal user={user} gpsCoords={gpsCoords} onBack={() => setView("dashboard")} />
          </motion.div>
        )}

        {view === "doctors" && (
          <motion.div key="doctors" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full flex justify-center mt-12">
            <DoctorPortal user={user} gpsCoords={gpsCoords} onBack={() => setView("dashboard")} />
          </motion.div>
        )}

      </AnimatePresence>

      {/* Footer Info */}
      <div className="fixed bottom-4 right-4 text-slate-400 text-xs flex gap-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-100 shadow-sm z-40">
        <span>© 2026 MediGuide AI</span>
        <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-teal-500" /> AES-256</span>
      </div>
    </main>
  )
}

