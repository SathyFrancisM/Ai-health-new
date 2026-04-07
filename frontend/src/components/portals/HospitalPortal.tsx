"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, MapPin, Phone, Clock, ArrowRight, Building2, ShieldAlert } from "lucide-react"

const HOSPITALS = [
  { id: 1, name: "Apollo Greams Road", location: "Chennai", specialty: "Multi-specialty", rating: 4.8, phone: "044-28293333", emergency: true },
  { id: 2, name: "Fortis Malar Hospital", location: "Adyar, Chennai", specialty: "Cardiac Sciences", rating: 4.6, phone: "044-42892222", emergency: true },
  { id: 3, name: "MIOT International", location: "Manapakkam, Chennai", specialty: "Orthopaedics", rating: 4.7, phone: "044-42002288", emergency: true },
  { id: 4, name: "SIMS Hospital", location: "Vadapalani, Chennai", specialty: "Trauma Care", rating: 4.5, phone: "044-43535353", emergency: true },
];

export function HospitalPortal({ onBack }: { onBack: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHospitals = HOSPITALS.filter(h => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-slate-800">Find <span className="text-gradient">Hospitals</span></h2>
          <p className="text-slate-500 mt-2">Locate the best care facilities near you.</p>
        </div>
        <button 
          onClick={onBack}
          className="px-6 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors font-medium text-slate-600"
        >
          Back
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative glass p-2 rounded-2xl flex items-center gap-2">
        <Search className="ml-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by hospital name or specialty..." 
          className="flex-1 bg-transparent border-none focus:ring-0 p-4 text-slate-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Hospital List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredHospitals.map((hospital, index) => (
          <motion.div 
            key={hospital.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass p-6 rounded-3xl group hover:border-teal-400 transition-all cursor-pointer relative overflow-hidden"
          >
            {hospital.emergency && (
              <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1 rounded-bl-2xl text-[10px] font-bold tracking-widest flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> 24/7 EMERGENCY
              </div>
            )}
            
            <div className="flex gap-4">
              <div className="bg-teal-50 p-4 rounded-2xl group-hover:bg-teal-100 transition-colors">
                <Building2 className="text-teal-600 h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800">{hospital.name}</h3>
                <div className="flex items-center gap-1 text-slate-400 text-sm mt-1">
                  <MapPin className="w-4 h-4" /> {hospital.location}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                   <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">{hospital.specialty}</span>
                   <span className="bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full text-xs font-medium">★ {hospital.rating}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-2 text-teal-600 font-bold">
                 <Phone className="w-4 h-4" /> {hospital.phone}
               </div>
               <button className="flex items-center gap-2 bg-gradient-premium text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-teal-500/20 hover:scale-105 transition-transform">
                 Book Now <ArrowRight className="w-4 h-4" />
               </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
