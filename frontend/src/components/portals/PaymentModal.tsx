import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CreditCard, CheckCircle2, ShieldCheck, Phone, X, Loader2 } from "lucide-react"

export function PaymentModal({ doctor, user, onClose, onSuccess }: { doctor: any, user: any, onClose: () => void, onSuccess: (receipt: any) => void }) {
  const [step, setStep] = useState<"details" | "processing" | "success">("details")
  const [receipt, setReceipt] = useState<any>(null)

  const handlePay = async () => {
    setStep("processing")
    
    // Simulate real-world network latency for UPI/Bank Gateway
    setTimeout(async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id || 'demo_user_id',
            userName: user?.name || 'Advait',
            doctorId: doctor.id,
            doctorName: doctor.name,
            amount: doctor.fees || 500
          })
        })
        const data = await res.json()
        if(data.success) {
          setReceipt(data.receipt)
          setStep("success")
        }
      } catch (err) {
        console.error("Payment failed", err)
        setStep("details")
      }
    }, 2500)
  }

  const handleStartCall = () => {
    window.open(`https://wa.me/91${doctor.whatsappNumber}?text=Hi%20${doctor.name},%20I%20have%20booked%20an%20appointment.%20Receipt:%20${receipt?.receiptId}`, '_blank')
    onSuccess(receipt)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10"><X /></button>
        
        {step === "details" && (
          <div className="p-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Complete Booking</h3>
            
            <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
              <p className="text-slate-500 text-sm mb-1">Consulting with</p>
              <p className="font-bold text-lg text-slate-800">{doctor.name}</p>
              <p className="text-teal-600 text-sm font-medium">{doctor.specialty || "Specialist"}</p>
            </div>

            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
              <span className="text-slate-500 font-medium">Consultation Fee</span>
              <span className="text-2xl font-black text-slate-800">₹{doctor.fees || 500}</span>
            </div>

            <button 
              onClick={handlePay}
              className="w-full bg-slate-900 text-white rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-xl shadow-slate-900/20"
            >
              <CreditCard className="w-5 h-5" /> Pay Now securely
            </button>
            <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4 text-teal-500"/> SSL Encrypted Payment
            </p>
          </div>
        )}

        {step === "processing" && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
            <h3 className="text-xl font-bold text-slate-800">Processing Payment...</h3>
            <p className="text-slate-500">Please do not close this window.</p>
          </div>
        )}

        {step === "success" && (
          <div className="p-8 flex flex-col items-center text-center bg-teal-50/50">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle2 className="w-20 h-20 text-[#25D366] mb-4" />
            </motion.div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Payment Successful!</h3>
            <p className="text-slate-600 mb-6">Your appointment is confirmed. The receipt has been sent to the doctor.</p>
            
            <div className="w-full bg-white p-4 rounded-xl border border-slate-200 mb-6 flex justify-between items-center text-sm shadow-sm">
              <span className="text-slate-500">Receipt ID</span>
              <span className="font-bold font-mono text-slate-700">{receipt?.receiptId}</span>
            </div>

            <button 
              onClick={handleStartCall}
              className="w-full bg-[#25D366] text-white rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-xl shadow-[#25D366]/30"
            >
              <Phone className="w-5 h-5" /> Start WhatsApp Video Call
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
