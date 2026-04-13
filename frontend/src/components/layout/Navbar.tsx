import { motion } from "framer-motion";
import { Heart, Activity, CalendarPlus, Pill, LogOut, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

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
      className="fixed top-0 left-0 right-0 h-20 z-50 px-6 lg:px-12 flex items-center justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-teal-100/50 dark:border-teal-900/50 shadow-sm"
    >
      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView("dashboard")}>
        <div className="bg-gradient-premium p-2 rounded-xl shadow-lg shadow-teal-600/20 group-hover:scale-105 transition-transform">
          <Heart className="text-white h-5 w-5" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Medi<span className="text-teal-600 dark:text-teal-400">Guide</span>
        </span>
      </div>

      <div className="hidden md:flex items-center gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              view === item.id 
                ? "bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 shadow-inner" 
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400"
            }`}
          >
            <item.icon className={`h-4 w-4 ${view === item.id ? "text-teal-600 dark:text-teal-400" : "text-slate-400 dark:text-slate-500"}`} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        {user && (
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{user.name}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{user.role || "User"}</span>
          </div>
        )}
        <button
          onClick={onLogout}
          className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors tooltip"
          title="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </motion.nav>
  );
}
