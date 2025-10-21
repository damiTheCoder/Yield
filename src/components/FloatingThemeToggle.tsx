import React from "react";
import { useTheme } from "@/hooks/useTheme";

const FloatingThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="fixed right-6 bottom-6 z-50 flex items-center gap-4 rounded-full bg-black/60 px-3 py-2 backdrop-blur-md shadow-lg border border-white/6">
      <div className="flex items-center gap-2 pl-2">
        <img src="/OPY.png" alt="Trone" className="h-7 w-7 rounded-md object-cover" />
        <span className="text-sm font-bold text-white">Trone</span>
      </div>
      <div className="h-6 w-px bg-white/10" />
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white hover:bg-white/20 transition"
      >
        <span>{theme === "dark" ? "Dark" : "Light"}</span>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 3v1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 20v1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4.2 4.2l.7.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19.1 19.1l.7.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
};

export default FloatingThemeToggle;
