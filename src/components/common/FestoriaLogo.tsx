import React, { useState } from 'react';
import { FESTORIA_LOGO } from '../../utils/logo';

interface FestoriaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  alt?: string;
}

export const FestoriaLogo: React.FC<FestoriaLogoProps> = ({
  className = 'w-9 h-9',
  size = 'md',
  alt = 'Festoria Logo',
}) => {
  const [hasError, setHasError] = useState(false);

  // If the image asset fails to load, gracefully display the stylized gradient SVG monogram
  if (hasError) {
    const sizeClasses = {
      sm: 'w-7 h-7 text-xs',
      md: 'w-9 h-9 text-sm',
      lg: 'w-10 h-10 text-base',
      xl: 'w-12 h-12 text-lg',
    }[size];

    return (
      <div
        className={`${className || sizeClasses} rounded-xl bg-linear-to-tr from-[#6366f1] via-[#8b5cf6] to-[#ec4899] text-white flex items-center justify-center font-extrabold shadow-sm select-none border border-white/20`}
        title={alt}
      >
        <span className="tracking-tighter">F</span>
      </div>
    );
  }

  return (
    <img
      src={FESTORIA_LOGO}
      alt={alt}
      onError={() => setHasError(true)}
      className={`${className} rounded-xl object-contain shadow-xs border border-slate-200/80 bg-white`}
    />
  );
};

