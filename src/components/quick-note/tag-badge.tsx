"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface TagBadgeProps {
  tag: string;
  onRemove?: (tag: string) => void;
  onClick?: (tag: string) => void;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export function TagBadge({ tag, onRemove, onClick, variant = "secondary", className }: TagBadgeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Animation when the tag is added
    const timeout = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timeout);
  }, []);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent onClick if it exists on Badge
    
    // Animation when removing the tag
    setIsVisible(false);
    setTimeout(() => onRemove?.(tag), 150);
  };

  return (
    <Badge 
      variant={variant} 
      className={`flex items-center gap-1 whitespace-nowrap transition-all duration-200 
        ${onClick ? 'cursor-pointer transform hover:scale-105 active:scale-95' : ''} 
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}
        ${isHovered ? 'shadow-sm' : ''}
        ${className}`} 
      onClick={() => onClick?.(tag)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {tag}
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-destructive-foreground 
            hover:bg-destructive rounded-full transition-colors duration-150 
            transform hover:scale-110 active:scale-90"
          onClick={handleRemove}
          aria-label={`Remove tag ${tag}`}
        >
          <XIcon className="h-3 w-3" />
        </Button>
      )}
    </Badge>
  );
}
