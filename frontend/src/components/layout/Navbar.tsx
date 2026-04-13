import { motion } from "framer-motion";
import { Heart, Activity, CalendarPlus, Pill, LogOut, LayoutDashboard } from "lucide-react";

interface NavbarProps {
  view: string;
  setView: (view: any) => void;
  user: any;
  onLogout: () => void;
}

export function Navbar({ view, setView, user, onLogout }: NavbarProps) {
  if (view === "login" || view === "signup" || view === "onboarding") {
    return null;
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "ai_consultation", label: "AI Chat", icon: Activity },
    { id: "booking", label: "Booking", icon: CalendarPlus },
    { id: "pharmacy", label: "Pharmacy", icon: Pill },
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 h-20 z-50 px-6 lg:px-12 flex items-center justify-between bg-white/70 backdrop-blur-xl border-b border-teal-100/50 shadow-sm"
    >
      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView("dashboard")}>
        <div className="bg-gradient-premium p-2 rounded-xl shadow-lg shadow-teal-600/20 group-hover:scale-105 transition-transform">
          <Heart className="text-white h-5 w-5" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-800">
          Medi<span className="text-teal-600">Guide</span>
        </span>
      </div>

      <div className="hidden md:flex items-center gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              view === item.id 
                ? "bg-teal-50 text-teal-700 shadow-inner" 
                : "text-slate-600 hover:bg-slate-50 hover:text-teal-600"
            }`}
          >
            <item.icon className={`h-4 w-4 ${view === item.id ? "text-teal-600" : "text-slate-400"}`} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-slate-800">{user.name}</span>
            <span className="text-xs text-slate-500 font-medium">{user.role || "User"}</span>
          </div>
        )}
        <button
          onClick={onLogout}
          className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors tooltip"
          title="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </motion.nav>
  );
}
