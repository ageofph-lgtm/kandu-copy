import React from "react";
import { cn } from "@/lib/utils";

// Hexagon Container - wrapper com borda hexagonal
export function Hexagon({ 
  children, 
  className, 
  size = "md",
  variant = "default",
  active = false,
  glow = false,
  onClick,
  ...props 
}) {
  const sizes = {
    xs: "w-10 h-12",
    sm: "w-14 h-16",
    md: "w-20 h-24",
    lg: "w-28 h-32",
    xl: "w-36 h-40",
  };

  const variants = {
    default: "bg-[var(--surface)] border-[var(--border)]",
    primary: "bg-[var(--primary)] text-white",
    dark: "bg-[var(--surface-secondary)]",
    outline: "bg-transparent border-2 border-[var(--primary)]",
  };

  return (
    <div 
      className={cn(
        "relative flex items-center justify-center cursor-pointer transition-all duration-200",
        sizes[size],
        onClick && "hover:scale-105 active:scale-95",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {/* Glow effect */}
      {(glow || active) && (
        <div 
          className="absolute inset-[-4px] bg-[var(--primary)]/30 blur-md hexagon -z-10"
        />
      )}
      
      {/* Border layer */}
      <div 
        className={cn(
          "absolute inset-0 hexagon",
          active ? "bg-[var(--primary)]" : "bg-[var(--border)]"
        )} 
      />
      
      {/* Content layer */}
      <div 
        className={cn(
          "absolute inset-[2px] hexagon flex items-center justify-center",
          variants[active ? "primary" : variant]
        )}
      >
        {children}
      </div>
    </div>
  );
}

// Hexagon Avatar
export function HexagonAvatar({ 
  src, 
  alt, 
  fallback,
  size = "md",
  online = false,
  className,
  ...props 
}) {
  const sizes = {
    sm: "w-12 h-14",
    md: "w-16 h-18",
    lg: "w-24 h-28",
    xl: "w-32 h-36",
  };

  return (
    <div className={cn("relative", sizes[size], className)} {...props}>
      {/* Border */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-orange-600 hexagon" />
      
      {/* Image container */}
      <div className="absolute inset-[2px] hexagon overflow-hidden bg-[var(--surface)]">
        {src ? (
          <img 
            src={src} 
            alt={alt} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)] font-bold">
            {fallback}
          </div>
        )}
      </div>
      
      {/* Online indicator */}
      {online && (
        <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--background)] z-10" />
      )}
    </div>
  );
}

// Hexagon Button - botão estilizado como hexágono
export function HexagonButton({
  children,
  icon,
  label,
  active = false,
  size = "md",
  onClick,
  className,
  ...props
}) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center gap-2 cursor-pointer group",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <Hexagon 
        size={size} 
        active={active}
        glow={active}
        className="group-hover:scale-105 transition-transform"
      >
        <div className="flex flex-col items-center justify-center text-center p-2">
          {icon && (
            <span className={cn(
              "text-2xl mb-1",
              active ? "text-white" : "text-[var(--text-secondary)]"
            )}>
              {icon}
            </span>
          )}
          {children}
        </div>
      </Hexagon>
      {label && (
        <span className={cn(
          "text-xs font-medium",
          active ? "text-[var(--primary)]" : "text-[var(--text-secondary)]"
        )}>
          {label}
        </span>
      )}
    </div>
  );
}

// Hexagon Grid - layout em grid de colmeia
export function HexagonGrid({ children, className, ...props }) {
  return (
    <div 
      className={cn(
        "flex flex-wrap justify-center gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Hexagon Progress Step
export function HexagonStep({ 
  step, 
  active = false, 
  completed = false,
  label,
  className 
}) {
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <Hexagon 
        size="sm" 
        active={active || completed}
        className={cn(
          completed && !active && "opacity-60"
        )}
      >
        <span className={cn(
          "text-sm font-bold",
          (active || completed) ? "text-white" : "text-[var(--text-muted)]"
        )}>
          {step}
        </span>
      </Hexagon>
      {label && (
        <span className={cn(
          "text-[10px] font-medium uppercase tracking-wider",
          active ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
        )}>
          {label}
        </span>
      )}
    </div>
  );
}

export default Hexagon;