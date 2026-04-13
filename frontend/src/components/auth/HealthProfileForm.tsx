"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Activity, Heart, AlertCircle, User, Baby, Scale, Ruler, Utensils, Zap } from "lucide-react"

export function HealthProfileForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    age: "",
    gender: "male",
    height: "",
    weight: "",
    bloodGroup: "A+",
    existingConditions: "",
    allergies: "",
    lifestyleHabits: "",
    activityLevel: "moderate"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass p-10 rounded-3xl w-full max-w-2xl"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gradient">Your Health Profile</h2>
        <p className="text-slate-500 mt-2">Help us personalize your wellness experience</p>
      </div>

      <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="relative">
            <label className="text-xs font-semibold uppercase text-teal-600 block mb-1 ml-1">Age</label>
            <div className="relative">
               <Baby className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
               <input name="age" type="number" placeholder="Years" onChange={handleChange} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" />
            </div>
          </div>

          <div className="relative">
            <label className="text-xs font-semibold uppercase text-teal-600 block mb-1 ml-1">Gender</label>
            <select name="gender" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all bg-white/50 appearance-none">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="relative">
            <label className="text-xs font-semibold uppercase text-teal-600 block mb-1 ml-1">Height (cm)</label>
            <div className="relative">
               <Ruler className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
               <input name="height" type="number" placeholder="cm" onChange={handleChange} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" />
            </div>
          </div>

          <div className="relative">
            <label className="text-xs font-semibold uppercase text-teal-600 block mb-1 ml-1">Weight (kg)</label>
            <div className="relative">
               <Scale className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
               <input name="weight" type="number" placeholder="kg" onChange={handleChange} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" />
            </div>
          </div>
        </div>

        {/* Health Details */}
        <div className="space-y-4">
          <div className="relative">
            <label className="text-xs font-semibold uppercase text-teal-600 block mb-1 ml-1">Blood Group</label>
            <select name="bloodGroup" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500">
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          <div className="relative col-span-full">
            <label className="text-xs font-semibold uppercase text-teal-600 block mb-1 ml-1">Allergies (VERY IMPORTANT)</label>
            <div className="relative">
               <AlertCircle className="absolute left-3 top-3.5 h-5 w-5 text-red-400" />
               <input name="allergies" placeholder="Peanuts, Shellfish, Dust..." onChange={handleChange} className="w-full pl-10 pr-4 py-3 rounded-xl border border-red-100 dark:border-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all bg-red-50/30 dark:bg-red-900/20 text-slate-900 dark:text-slate-100 placeholder-red-300 dark:placeholder-red-500" />
            </div>
            <p className="text-[10px] text-red-500 mt-1">* We use this to filter home remedies specifically for you.</p>
          </div>

          <div className="relative">
            <label className="text-xs font-semibold uppercase text-teal-600 block mb-1 ml-1">Activity Level</label>
            <select name="activityLevel" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500">
              <option value="sedentary">Sedentary</option>
              <option value="light">Lightly Active</option>
              <option value="moderate">Moderately Active</option>
              <option value="intensive">Intensively Active</option>
            </select>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
           <div className="relative">
             <label className="text-xs font-semibold uppercase text-teal-600 block mb-1 ml-1">Existing Conditions</label>
             <textarea name="existingConditions" placeholder="Diabetes, Hypertension, None..." onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 h-24" />
           </div>
        </div>

        <button type="submit" className="md:col-span-2 w-full bg-gradient-premium text-white py-4 rounded-xl font-bold shadow-xl shadow-teal-600/30 hover:scale-[1.01] transition-transform flex items-center justify-center gap-2">
           <Zap className="h-5 w-5" />
           Complete Registration
        </button>
      </form>
    </motion.div>
  )
}
