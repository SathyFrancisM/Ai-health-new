"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Mail, Lock, User, Heart, Activity, AlertCircle, MapPin } from "lucide-react"

export function LoginForm({ onToggle, onLocationDetect, onLogin }: { onToggle: () => void, onLocationDetect: (loc: string) => void, onLogin: (user: any) => void }) {
  const [isMounted, setIsMounted] = useState(false);
  const [location, setLocation] = useState<string>("Detecting location...");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsMounted(true);
    if ("geolocation" in navigator) {
      const options = {
        enableHighAccuracy: true, // Use GPS if available
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocoding using a public API with locality language
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await response.json();
          
          // More granular location name: "Locality/Neighborhood, City, Country"
          const components = [
            data.locality || data.principalSubdivision,
            data.city,
            data.countryName
          ].filter(Boolean);
          
          const locString = components.join(", ");
          setLocation(locString);
          onLocationDetect(locString);
        } catch (err) {
          const coords = `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`;
          setLocation(coords);
          onLocationDetect(coords);
        }
      }, (err) => {
        console.warn("Location error:", err.message);
        setLocation("Location access denied or timeout");
      }, options);
    } else {
      setLocation("Location not supported");
    }
  }, [onLocationDetect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Invalid Credentials");
      }

      // Success
      localStorage.setItem("token", data.token);
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-8 rounded-2xl w-full max-w-md relative overflow-hidden"
    >
      {/* Location Badge */}
      {isMounted && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-teal-50 text-teal-600 px-3 py-1 rounded-full text-[10px] font-bold border border-teal-100 animate-pulse">
          <MapPin className="w-3 h-3" /> {location}
        </div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gradient">Welcome Back</h2>
        <p className="text-slate-500 mt-2">Sign in to your health assistant</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium flex gap-2 items-center animate-pulse">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        <div className="relative">
          <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all bg-white/50"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all bg-white/50"
          />
        </div>
        <button 
          type="submit"
          disabled={loading}
          className={`w-full bg-gradient-premium text-white py-3 rounded-xl font-semibold shadow-lg shadow-teal-500/20 hover:scale-[1.02] transition-transform ${loading ? 'opacity-70' : ''}`}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-slate-500">
          Don't have an account?{" "}
          <button onClick={onToggle} className="text-teal-600 font-bold hover:underline">
            Sign Up
          </button>
        </p>
      </div>
    </motion.div>
  )
}

export function SignUpForm({ onToggle, onNext }: { onToggle: () => void, onNext: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-8 rounded-2xl w-full max-w-md"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gradient">Create Account</h2>
        <p className="text-slate-500 mt-2">Start your wellness journey</p>
      </div>

      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onNext(formData); }}>
        <div className="relative">
          <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
          <input 
            name="name"
            type="text" 
            placeholder="Full Name" 
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all bg-white/50"
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
          <input 
            name="email"
            type="email" 
            placeholder="Email Address" 
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all bg-white/50"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
          <input 
            name="password"
            type="password" 
            placeholder="Password" 
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all bg-white/50"
          />
        </div>
        <button type="submit" className="w-full bg-gradient-premium text-white py-3 rounded-xl font-semibold shadow-lg shadow-teal-500/20 hover:scale-[1.02] transition-transform">
          Continue to Health Profile
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-slate-500">
          Already have an account?{" "}
          <button onClick={onToggle} className="text-teal-600 font-bold hover:underline">
            Sign In
          </button>
        </p>
      </div>
    </motion.div>
  )
}
