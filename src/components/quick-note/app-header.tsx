import { LogoIcon } from "./logo-icon";
import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

export default function AppHeader() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Animation effect when component mounts
    setIsVisible(true);
  }, []);

  return (
    <header className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6 border-b border-border bg-card shadow-sm sticky top-0 z-30">
      <div className="flex items-center">
        <div className={`transform transition-all duration-700 ${isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`}>
          <LogoIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary hover:text-primary/80 transition-colors" />
        </div>
        <h1 
          className={`ml-2 sm:ml-3 text-xl sm:text-2xl font-semibold text-foreground transition-all duration-500 ease-in-out ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}
        >
          QuickNote
        </h1>
        <div className={`ml-1 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
      </div>
      <div className={`text-xs sm:text-sm text-muted-foreground transition-all duration-500 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        AI-Powered Note Taking
      </div>
    </header>
  );
}
