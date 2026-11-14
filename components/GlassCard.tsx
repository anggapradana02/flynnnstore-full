
import React from 'react';

const GlassCard = ({ children, className = '', onClick, hoverEffect = false }: any) => {
  const handleRipple = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
    ripple.style.left = `${e.clientX - rect.left - Math.max(rect.width, rect.height)/2}px`;
    ripple.style.top = `${e.clientY - rect.top - Math.max(rect.width, rect.height)/2}px`;
    e.currentTarget.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    if (onClick) onClick(e);
  };

  return (
    <div 
      onClick={handleRipple}
      className={`glass rounded-2xl p-4 transition-all duration-300 relative overflow-hidden ${hoverEffect ? 'hover:bg-white/10 active:scale-95 cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
export default GlassCard;
