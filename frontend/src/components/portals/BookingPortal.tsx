"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, MapPin, Calendar, Clock, ArrowLeft, ArrowRight, 
  Building2, Stethoscope, UserCircle, Star, CheckCircle, 
  Video, MessageCircle, Filter, ChevronDown, X
} from "lucide-react"

const API_BASE = "http://localhost:5000"

// Step labels for the booking wizard
const STEPS = ["Select Hospital", "Choose Doctor", "Pick Time Slot", "Confirm"]

interface BookingPortalProps {
  user: any
  gpsCoords?: { lat: number; lng: number } | null
  onBack: () => void
  onConsultation?: (consultationData: any) => void
}

export function BookingPortal({ user, gpsCoords, onBack, onConsultation }: BookingPortalProps) {
  const [step, setStep] = useState(0)
  const [hospitals, setHospitals] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [slots, setSlots] = useState<any>(null)
  const [selectedHospital, setSelectedHospital] = useState<any>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [bookingType, setBookingType] = useState<'in-person' | 'video' | 'chat'>('in-person')
  const [searchTerm, setSearchTerm] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState("")
  const [loading, setLoading] = useState(false)
  const [bookingResult, setBookingResult] = useState<any>(null)
  const [error, setError] = useState("")

  // Generate next 7 days for date picker
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return {
      value: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      isToday: i === 0
    }
  })

  // Fetch hospitals
  useEffect(() => {
    const fetchHospitals = async () => {
      setLoading(true)
      try {
        const gpsQuery = gpsCoords ? `&lat=${gpsCoords.lat}&lng=${gpsCoords.lng}` : ''
        const searchQuery = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''
        const res = await fetch(`${API_BASE}/api/booking/hospitals?x=1${gpsQuery}${searchQuery}`)
        const data = await res.json()
        setHospitals(data.data || [])
      } catch (err) {
        console.error('Failed to fetch hospitals:', err)
        setError('Unable to load hospitals. Please try again.')
      }
      setLoading(false)
    }
    if (step === 0) fetchHospitals()
  }, [step, gpsCoords, searchTerm])

  // Fetch doctors when hospital selected
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!selectedHospital) return
      setLoading(true)
      try {
        const gpsQuery = gpsCoords ? `&lat=${gpsCoords.lat}&lng=${gpsCoords.lng}` : ''
        const specQuery = specialtyFilter ? `&specialty=${encodeURIComponent(specialtyFilter)}` : ''
        const res = await fetch(`${API_BASE}/api/booking/doctors?hospitalId=${selectedHospital.id}${gpsQuery}${specQuery}`)
        const data = await res.json()
        setDoctors(data.data || [])
      } catch (err) {
        console.error('Failed to fetch doctors:', err)
      }
      setLoading(false)
    }
    if (step === 1) fetchDoctors()
  }, [step, selectedHospital, specialtyFilter, gpsCoords])

  // Fetch slots when doctor selected
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDoctor) return
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/booking/slots?doctorId=${selectedDoctor.id}&date=${selectedDate}`)
        const data = await res.json()
        setSlots(data)
      } catch (err) {
        console.error('Failed to fetch slots:', err)
      }
      setLoading(false)
    }
    if (step === 2) fetchSlots()
  }, [step, selectedDoctor, selectedDate])

  // Handle booking
  const handleBook = async () => {
    if (!selectedDoctor || !selectedSlot) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_BASE}/api/booking/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'demo_user_id',
          doctorId: selectedDoctor.id,
          date: selectedDate,
          timeSlot: selectedSlot.time,
          type: bookingType,
          patientName: user?.name || 'Patient',
          patientPhone: user?.whatsappNumber || '',
          notes: ''
        })
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setBookingResult(data.booking)
        setStep(3)
      }
    } catch (err) {
      setError('Failed to book appointment. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-6xl space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-slate-800">
            Book <span className="text-gradient">Appointment</span>
          </h2>
          <p className="text-slate-500 mt-2">Find the right doctor and schedule your visit.</p>
        </div>
        <button onClick={onBack} className="px-6 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors font-medium text-slate-600">
          Back
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              i === step ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' :
              i < step ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'
            }`}>
              {i < step ? <CheckCircle className="w-4 h-4" /> : <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">{i + 1}</span>}
              <span className="hidden md:inline">{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-teal-400' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* STEP 0: Select Hospital */}
        {step === 0 && (
          <motion.div key="hospitals" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="relative glass p-2 rounded-2xl flex items-center gap-2 mb-6">
              <Search className="ml-4 text-slate-400" />
              <input type="text" placeholder="Search hospitals..." className="flex-1 bg-transparent border-none focus:ring-0 p-3 text-slate-700 outline-none"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hospitals.map((hospital, i) => (
                <motion.div key={hospital.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => { setSelectedHospital(hospital); setStep(1) }}
                  className={`glass p-5 rounded-2xl cursor-pointer group hover:border-teal-400 transition-all ${
                    selectedHospital?.id === hospital.id ? 'border-2 border-teal-500 bg-teal-50/50' : ''
                  }`}>
                  <div className="flex gap-4">
                    <div className="bg-teal-50 p-3 rounded-xl group-hover:bg-teal-100 transition-colors">
                      <Building2 className="text-teal-600 h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800">{hospital.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-500 text-sm">{hospital.location}</span>
                        {hospital.distanceKm !== undefined && (
                          <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">{hospital.distanceKm} km</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-medium">{hospital.specialty}</span>
                        <span className="bg-yellow-50 text-yellow-600 px-2.5 py-0.5 rounded-full text-xs font-medium">★ {hospital.rating || '4.5'}</span>
                        {hospital.emergency && (
                          <span className="bg-red-50 text-red-500 px-2.5 py-0.5 rounded-full text-xs font-bold">24/7 ER</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="text-slate-300 group-hover:text-teal-500 transition-colors self-center" />
                  </div>
                </motion.div>
              ))}
            </div>

            {hospitals.length === 0 && !loading && (
              <div className="text-center text-slate-400 py-12">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hospitals found. Try a different search.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 1: Choose Doctor */}
        {step === 1 && (
          <motion.div key="doctors" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep(0)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex-1">
                <p className="text-sm text-slate-500">Doctors at</p>
                <p className="font-bold text-slate-800">{selectedHospital?.name}</p>
              </div>
              <select value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-600 outline-none">
                <option value="">All Specialties</option>
                <option value="Cardiologist">Cardiologist</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Pediatrician">Pediatrician</option>
                <option value="General Physician">General Physician</option>
                <option value="Orthopedic">Orthopedic</option>
                <option value="Neurologist">Neurologist</option>
                <option value="Gynecologist">Gynecologist</option>
                <option value="Ayurvedic">Ayurvedic</option>
              </select>
            </div>

            <div className="space-y-3">
              {doctors.map((doctor, i) => (
                <motion.div key={doctor.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  onClick={() => { setSelectedDoctor(doctor); setStep(2) }}
                  className="glass p-5 rounded-2xl flex flex-col md:flex-row items-center gap-5 group hover:border-teal-400 transition-all cursor-pointer">
                  <div className="relative">
                    <div className="bg-teal-50 w-20 h-20 rounded-2xl flex items-center justify-center">
                      <UserCircle className="text-teal-300 w-16 h-16" />
                    </div>
                    {doctor.online !== false && (
                      <div className="absolute -top-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-bold text-slate-800">{doctor.name}</h3>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1.5">
                      <span className="flex items-center gap-1 text-teal-600 font-semibold text-sm">
                        <Stethoscope className="w-3.5 h-3.5" /> {doctor.specialty}
                      </span>
                      {doctor.experience && <span className="text-slate-400 text-xs">· {doctor.experience}</span>}
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-0.5 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(doctor.rating || 4) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                      ))}
                      <span className="ml-1.5 text-sm font-bold text-slate-600">{doctor.rating || '4.0'}</span>
                    </div>
                  </div>
                  <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6 w-full md:w-auto">
                    <div className="text-2xl font-bold text-slate-800">₹{doctor.fees || 500}</div>
                    <div className="text-slate-400 text-xs mt-1">per consultation</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {doctors.length === 0 && !loading && (
              <div className="text-center text-slate-400 py-12">
                <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No doctors found for this hospital.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 2: Pick Time Slot */}
        {step === 2 && (
          <motion.div key="slots" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep(1)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex-1">
                <p className="text-sm text-slate-500">Booking with</p>
                <p className="font-bold text-slate-800">{selectedDoctor?.name} · ₹{selectedDoctor?.fees || 500}</p>
              </div>
            </div>

            {/* Consultation Type */}
            <div className="flex gap-3 mb-6">
              {[
                { value: 'in-person' as const, icon: Building2, label: 'In-Person' },
                { value: 'video' as const, icon: Video, label: 'Video Call' },
                { value: 'chat' as const, icon: MessageCircle, label: 'Chat' }
              ].map(({ value, icon: Icon, label }) => (
                <button key={value} onClick={() => setBookingType(value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
                    bookingType === value ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            {/* Date Picker */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {dateOptions.map((d) => (
                <button key={d.value} onClick={() => setSelectedDate(d.value)}
                  className={`flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    selectedDate === d.value ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300'
                  }`}>
                  <div className="text-xs opacity-70">{d.isToday ? 'Today' : ''}</div>
                  <div>{d.label}</div>
                </button>
              ))}
            </div>

            {/* Time Slots Grid */}
            {slots && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-slate-600">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {slots.availableCount} slots available
                  </p>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {(slots.slots || []).map((slot: any) => (
                    <button key={slot.id} onClick={() => !slot.isBooked && setSelectedSlot(slot)}
                      disabled={slot.isBooked}
                      className={`py-2.5 px-2 rounded-xl text-sm font-medium transition-all ${
                        slot.isBooked ? 'bg-slate-100 text-slate-300 cursor-not-allowed line-through' :
                        selectedSlot?.id === slot.id ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20 scale-105' :
                        'bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:text-teal-600'
                      }`}>
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm Button */}
            {selectedSlot && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="mt-8 glass p-5 rounded-2xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Your Appointment</p>
                    <p className="font-bold text-slate-800">
                      {selectedDoctor?.name} · {selectedDate} at {selectedSlot.time}
                    </p>
                    <p className="text-sm text-teal-600 font-medium capitalize">{bookingType} consultation</p>
                  </div>
                  <button onClick={handleBook} disabled={loading}
                    className="w-full md:w-auto bg-gradient-premium text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-teal-500/20 hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Confirm Booking <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* STEP 3: Confirmation */}
        {step === 3 && bookingResult && (
          <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Appointment Confirmed! 🎉</h3>
            <p className="text-slate-500 mb-8">Your booking has been successfully placed.</p>

            <div className="glass p-6 rounded-2xl max-w-md mx-auto text-left space-y-3">
              <div className="flex justify-between"><span className="text-slate-500">Booking ID</span><span className="font-mono text-sm font-bold">{bookingResult.id}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Doctor</span><span className="font-bold">{bookingResult.doctorName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Hospital</span><span className="font-bold">{bookingResult.hospitalName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Date & Time</span><span className="font-bold">{bookingResult.date} at {bookingResult.timeSlot}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-bold capitalize">{bookingResult.type}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-bold text-teal-600">₹{bookingResult.amount}</span></div>
            </div>

            <div className="flex gap-3 justify-center mt-8">
              <button onClick={onBack} className="px-6 py-3 rounded-xl border border-slate-200 font-medium text-slate-600 hover:bg-slate-50">
                Back to Dashboard
              </button>
              {(bookingResult.type === 'video' || bookingResult.type === 'chat') && onConsultation && (
                <button onClick={() => onConsultation(bookingResult)}
                  className="bg-gradient-premium text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-teal-500/20 hover:scale-105 transition-transform flex items-center gap-2">
                  <Video className="w-4 h-4" /> Start Consultation
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
