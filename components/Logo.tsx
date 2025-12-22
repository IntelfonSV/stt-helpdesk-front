
import React from 'react';

export const Logo: React.FC<{ variant?: 'light' | 'dark'; className?: string }> = ({ variant = 'dark', className = '' }) => {
  // The official logo URL
  const logoUrl = "https://grupostt.com/wp-content/uploads/2025/06/LogoSTT.png";
  
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* 
         Since the provided PNG likely has a specific background or text color, 
         we render it directly. If 'variant' is light (dark background context like sidebar),
         we might need a small white container if the logo is transparent black text.
         Assuming standard logo usage, we'll wrap it in a small white pill for sidebar visibility if needed,
         or just render the image. 
      */}
      <div className={`relative ${variant === 'light' ? 'bg-white/90 rounded px-2 py-1' : ''}`}>
        <img 
            src={logoUrl} 
            alt="Grupo STT Logo" 
            className="h-12 w-auto object-contain"
        />
      </div>
    </div>
  );
};
