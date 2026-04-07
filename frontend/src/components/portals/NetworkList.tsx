import { useState, useEffect } from "react";
import { User, MapPin, Activity, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export function NetworkList({ role }: { role: string }) {
  const [network, setNetwork] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNetwork = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/auth/network?role=${role}`);
        const data = await response.json();
        setNetwork(data);
      } catch (err) {
        console.error("Failed to fetch network", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNetwork();
  }, [role]);

  const handleWhatsAppCall = (number: string) => {
    window.open(`https://wa.me/91${number}`, '_blank');
  };

  if (loading) return <div className="text-center p-8 text-slate-400 animate-pulse">Scanning nearby network...</div>;
  if (network.length === 0) return <div className="text-center p-8 text-slate-400">No active {role.toLowerCase()}s found nearby.</div>;

  return (
    <div className="space-y-4">
      {network.map((node) => (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={node.id} 
          className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="bg-teal-100 p-3 rounded-xl">
              <User className="text-teal-600 w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                {node.name} 
                {node.severity === 'Emergency' && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> EMERGENCY</span>}
              </h4>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" /> {node.location || "Location unavailable"}
              </p>
              {node.severity && <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <Activity className="w-3 h-3" /> Status: {node.severity}
              </p>}
            </div>
          </div>
          
          <button 
            onClick={() => handleWhatsAppCall(node.whatsappNumber)}
            className="w-full md:w-auto px-6 py-2 bg-[#25D366] text-white rounded-xl font-bold shadow-lg shadow-[#25D366]/20 hover:scale-105 transition-transform flex items-center justify-center gap-2"
          >
            Catch User (WhatsApp Video)
          </button>
        </motion.div>
      ))}
    </div>
  );
}
