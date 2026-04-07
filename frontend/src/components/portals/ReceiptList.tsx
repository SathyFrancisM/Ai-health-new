import { useState, useEffect } from "react";
import { Receipt, MapPin, CreditCard, Clock, Phone } from "lucide-react";
import { motion } from "framer-motion";

export function ReceiptList({ user }: { user: any }) {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/auth/receipts?doctorId=${user?.id || 'demo_doctor_id'}`);
        const data = await response.json();
        setReceipts(data);
      } catch (err) {
        console.error("Failed to fetch receipts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
    
    // Poll for new receipts every 5 seconds since it's a live dashboard
    const interval = setInterval(fetchReceipts, 5000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) return <div className="text-center p-8 text-slate-400 animate-pulse">Scanning for incoming payments...</div>;
  
  if (receipts.length === 0) {
    return (
      <div className="text-center p-12 text-slate-400 flex flex-col items-center">
        <Receipt className="w-12 h-12 mb-4 text-slate-200" />
        <p>No appointments booked yet.</p>
        <p className="text-xs mt-2">Waiting for user payments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {receipts.map((receipt) => (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={receipt.receiptId} 
          className="p-6 rounded-2xl bg-white border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
              <CreditCard className="text-teal-600 w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                Appointment: {receipt.userName}
              </h4>
              <p className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block mt-2">
                Receipt ID: {receipt.receiptId}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end w-full md:w-auto">
            <div className="text-2xl font-black text-slate-800">
               ₹{receipt.amount} Paid
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" /> {new Date(receipt.date).toLocaleTimeString()}
            </div>
            <div className="mt-4 text-teal-600 text-sm font-bold flex items-center gap-1 bg-teal-50 px-4 py-2 rounded-lg">
              <Phone className="w-4 h-4"/> Expect WhatsApp Call
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
