"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, MapPin, Phone, Star, ArrowRight, UserCircle, Stethoscope, Video, Calendar } from "lucide-react"

const DOCTORS = [
  { id: 1, name: "Dr. Arvind Swaminathan", specialty: "Cardiologist", experience: "15+ Years", rating: 4.9, fees: "₹800", location: "T. Nagar, Chennai", online: true },
  { id: 2, name: "Dr. Priya Ramakrishnan", specialty: "Dermatologist", experience: "10+ Years", rating: 4.8, fees: "₹600", location: "Mylapore, Chennai", online: true },
  { id: 3, name: "Dr. Rajesh Kumar", specialty: "General Physician", experience: "20+ Years", rating: 4.7, fees: "₹500", location: "Velachery, Chennai", online: false },
  { id: 4, name: "Dr. Meera Iyer", specialty: "Pediatrician", experience: "12+ Years", rating: 4.9, fees: "₹700", location: "Anna Nagar, Chennai", online: true },
];

export function DoctorPortal({ onBack }: { onBack: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDoctors = DOCTORS.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-slate-800">Expert <span className="text-gradient">Doctors</span></h2>
          <p className="text-slate-500 mt-2">Consult with top specialists from the comfort of your home.</p>
        </div>
        <button 
          onClick={onBack}
          className="px-6 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors font-medium text-slate-600"
        >
          Back
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative glass p-2 rounded-2xl flex items-center gap-2">
          <Search className="ml-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by specialty or doctor name..." 
            className="flex-1 bg-transparent border-none focus:ring-0 p-4 text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="glass px-6 py-4 rounded-2xl flex items-center gap-2 text-slate-500 font-medium">
          <Calendar className="w-4 h-4" /> Next Available
        </div>
      </div>

      {/* Doctor List */}
      <div className="space-y-4">
        {filteredDoctors.map((doctor, index) => (
          <motion.div 
            key={doctor.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6 group hover:border-teal-400 transition-all cursor-pointer"
          >
            <div className="relative">
              <div className="bg-teal-50 w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden">
                 <UserCircle className="text-teal-300 w-20 h-20" />
              </div>
              {doctor.online && (
                <div className="absolute -top-2 -right-2 bg-gradient-premium p-1.5 rounded-lg shadow-lg">
                   <Video className="text-white w-4 h-4" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
               <h3 className="text-xl font-bold text-slate-800">{doctor.name}</h3>
               <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                  <span className="flex items-center gap-1 text-teal-600 font-bold text-sm">
                    <Stethoscope className="w-4 h-4" /> {doctor.specialty}
                  </span>
                  <span className="text-slate-400 text-sm">• {doctor.experience} Exp.</span>
               </div>
               <div className="flex items-center justify-center md:justify-start gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(doctor.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                  ))}
                  <span className="ml-2 font-bold text-slate-700">{doctor.rating}</span>
               </div>
            </div>

            <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-3 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8">
               <div className="text-2xl font-bold text-slate-800">{doctor.fees}</div>
               <div className="text-slate-400 text-xs flex items-center gap-1">
                 <MapPin className="w-3 h-3" /> {doctor.location}
               </div>
               <button className="w-full md:w-auto bg-gradient-premium text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-teal-500/20 hover:scale-105 transition-transform">
                 Book Appointment
               </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
