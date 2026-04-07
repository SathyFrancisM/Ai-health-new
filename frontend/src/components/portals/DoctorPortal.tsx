"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, MapPin, Phone, Star, ArrowRight, UserCircle, Stethoscope, Video, Calendar } from "lucide-react"
import { PaymentModal } from "./PaymentModal"

const DOCTORS = [
  { id: 1, name: "Dr. Arvind Swaminathan", specialty: "Cardiologist", experience: "15+ Years", rating: 4.9, fees: "₹800", location: "T. Nagar, Chennai", online: true },
  { id: 2, name: "Dr. Priya Ramakrishnan", specialty: "Dermatologist", experience: "10+ Years", rating: 4.8, fees: "₹600", location: "Mylapore, Chennai", online: true },
  { id: 3, name: "Dr. Rajesh Kumar", specialty: "General Physician", experience: "20+ Years", rating: 4.7, fees: "₹500", location: "Velachery, Chennai", online: false },
  { id: 4, name: "Dr. Meera Iyer", specialty: "Pediatrician", experience: "12+ Years", rating: 4.9, fees: "₹700", location: "Anna Nagar, Chennai", online: true },
];

export function DoctorPortal({ user, gpsCoords, onBack }: { user: any, gpsCoords?: { lat: number; lng: number } | null, onBack: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const gpsQuery = gpsCoords ? `&lat=${gpsCoords.lat}&lng=${gpsCoords.lng}` : '';
        const response = await fetch(`http://localhost:5000/api/auth/network?role=Doctor${gpsQuery}`);
        const data = await response.json();
        setDoctors(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDoctors();
  }, [gpsCoords]);

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.specialty && d.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleBook = (doc: any) => {
    setSelectedDoctor(doc);
  };

  return (
    <>
      <AnimatePresence>
        {selectedDoctor && (
          <PaymentModal 
            doctor={selectedDoctor} 
            user={user} 
            onClose={() => setSelectedDoctor(null)} 
            onSuccess={(receipt) => console.log('Paid', receipt)} 
          />
        )}
      </AnimatePresence>

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
              <div className="absolute -top-2 -right-2 bg-gradient-premium p-1.5 rounded-lg shadow-lg">
                 <Video className="text-white w-4 h-4" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
               <h3 className="text-xl font-bold text-slate-800">{doctor.name}</h3>
               <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                  <span className="flex items-center gap-1 text-teal-600 font-bold text-sm">
                    <Stethoscope className="w-4 h-4" /> {doctor.specialty || "General Physician"}
                  </span>
                  {doctor.distanceKm !== undefined && (
                    <span className="flex items-center gap-1 bg-teal-50 text-teal-700 text-xs font-bold px-2 py-1 rounded-full border border-teal-200">
                      <MapPin className="w-3 h-3" /> {doctor.distanceKm} km away
                    </span>
                  )}
                  {!doctor.distanceKm && doctor.location && (
                    <span className="flex items-center gap-1 text-slate-400 text-xs">
                      <MapPin className="w-3 h-3" /> {doctor.location}
                    </span>
                  )}
               </div>
               <div className="flex items-center justify-center md:justify-start gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="ml-2 font-bold text-slate-700">5.0</span>
               </div>
            </div>

            <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-3 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8">
               <div className="text-2xl font-bold text-slate-800">₹{doctor.fees || 500}</div>
               <div className="text-slate-400 text-xs flex items-center gap-1">
                 <MapPin className="w-3 h-3" /> {doctor.location}
               </div>
               <button 
                 onClick={() => handleBook(doctor)}
                 className="w-full md:w-auto bg-gradient-premium text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-teal-500/20 hover:scale-105 transition-transform flex gap-2 items-center"
               >
                 Book Appointment
               </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
    </>
  )
}
