import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSlogan?: boolean;
  className?: string;
  variant?: 'light' | 'dark';
}

export default function Logo({
  size = 'md',
  showText = true,
  showSlogan = true,
  className = '',
  variant = 'dark'
}: LogoProps) {
  // Determine dimensions
  const dimensions = {
    xs: { iconSize: 24, textSize: 'text-sm', sloganSize: 'text-[7px]' },
    sm: { iconSize: 36, textSize: 'text-base', sloganSize: 'text-[8px]' },
    md: { iconSize: 48, textSize: 'text-xl', sloganSize: 'text-[9px]' },
    lg: { iconSize: 64, textSize: 'text-2xl', sloganSize: 'text-[10px]' },
    xl: { iconSize: 96, textSize: 'text-4xl', sloganSize: 'text-[12px]' }
  };

  const current = dimensions[size];

  return (
    <div className={`flex flex-col items-center justify-center font-display ${className}`}>
      <div className="flex items-center gap-3">
        {/* Core Icon: Complete premium SVG rendering the exact logo structure */}
        <svg
          width={current.iconSize}
          height={current.iconSize}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0 drop-shadow-[0_4px_12px_rgba(30,64,175,0.15)]"
        >
          {/* DEFINITIONS OF GRADIENTS */}
          <defs>
            {/* Swirling Outer Circle Gradient (Blue to Greenish-Teal) */}
            <linearGradient id="circle-grad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E3A8A" /> {/* Blue */}
              <stop offset="45%" stopColor="#00BFA5" /> {/* Teal */}
              <stop offset="100%" stopColor="#00E676" /> {/* Vibrant Green */}
            </linearGradient>

            {/* Shoots & Leaf Gradient (Emerald to Mint Carbon) */}
            <linearGradient id="leaf-grad" x1="45" y1="50" x2="85" y2="15" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00BFA5" />
              <stop offset="100%" stopColor="#00E676" />
            </linearGradient>

            {/* Left Footprint Gradient (Dark Blue to Sky Blue) */}
            <linearGradient id="left-foot-grad" x1="30" y1="70" x2="45" y2="45" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>

            {/* Right Footprint Gradient (Teal to Cyan-Light) */}
            <linearGradient id="right-foot-grad" x1="42" y1="55" x2="55" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0F766E" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>

            {/* Small Leaves Gradient */}
            <linearGradient id="small-leaf-grad" x1="45" y1="35" x2="58" y2="25" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00BFA5" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
          </defs>

          {/* 1. Dynamic Outer Ring with a clean gap sweep styling */}
          <path
            d="M 28 82 C 12 70 8 44 20 25 C 32 6 58 2 77 15 C 96 28 98 54 86 73 C 81 81 74 86 66 89"
            stroke="url(#circle-grad)"
            strokeWidth="5.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* 2. Left Footprint (Smaller, lower down, pointing up-right) */}
          {/* Sole Arch Shape */}
          <path
            d="M 40.5 70 C 37 70.5 35 68 35.5 61 C 36 54 44 49.5 45.5 50 C 47.5 51 46.5 54.5 45.5 58 C 44 63 42.5 69.5 40.5 70 Z"
            fill="url(#left-foot-grad)"
          />
          {/* Left Foot Toes */}
          <circle cx="46.5" cy="46" r="2.2" fill="#3B82F6" />
          <circle cx="41.5" cy="47.5" r="2" fill="#3B82F6" />
          <circle cx="37.5" cy="50.5" r="1.8" fill="#1D4ED8" />
          <circle cx="35" cy="54" r="1.5" fill="#1D4ED8" />
          <circle cx="33.5" cy="58" r="1.3" fill="#1E3A8A" />

          {/* 3. Right Footprint (Larger, higher up, stepping into the leaf) */}
          {/* Sole Arch Shape */}
          <path
            d="M 48 57 C 44.5 58 42.5 55 44 47.5 C 45.5 40 54 34.5 55.5 35 C 57.5 35.5 55.5 39.5 54 44 C 52 50 50 56.5 48 57 Z"
            fill="url(#right-foot-grad)"
          />
          {/* Right Foot Toes */}
          <circle cx="56.5" cy="31" r="2.6" fill="#06B6D4" />
          <circle cx="51.5" cy="32.5" r="2.2" fill="#06B6D4" />
          <circle cx="47.5" cy="35.5" r="2" fill="#0F766E" />
          <circle cx="44.5" cy="39.2" r="1.7" fill="#0F766E" />
          <circle cx="42.5" cy="43.5" r="1.5" fill="#0F766E" />

          {/* 4. Elegant green sweeping stem curving up from the bottom */}
          <path
            d="M 43 83 C 43 83 45 61 58.5 52 C 67 46 76 33 76 33"
            stroke="url(#leaf-grad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* 5. Small growth shoots */}
          {/* Small growing leaf 1 */}
          <path
            d="M 52 38 T 51 28 T 57 32 Z"
            fill="url(#small-leaf-grad)"
          />
          {/* Small growing leaf 2 */}
          <path
            d="M 49 44 T 43 38 T 49 39 Z"
            fill="url(#small-leaf-grad)"
          />

          {/* 6. Fully Detailed Giant Leaf (Top-Right) */}
          <path
            d="M 56.5 50 C 65 37 77.5 22 84.5 22 C 84.5 22 88.5 31.5 76.5 47 C 68 58 57 59.5 56.5 50 Z"
            fill="url(#leaf-grad)"
          />
          {/* Leaf center premium detail vein */}
          <path
            d="M 56.5 50 Q 72 38 84 22"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>

        {/* Logo Text Label */}
        {showText && (
          <div className="text-left flex flex-col justify-center select-none">
            <span className="text-white font-black tracking-tight leading-none">
              <span className={variant === 'dark' ? 'text-blue-500' : 'text-blue-600'}>Carbon</span>
              <span className="text-[#00E676]">Steps</span>
            </span>
            {showSlogan && (
              <span className="text-[9px] text-slate-400 font-mono tracking-[0.18em] uppercase font-semibold mt-0.5 whitespace-nowrap">
                Track <span className="text-[#00BFA5]">|</span> Reduce <span className="text-[#00BFA5]">|</span> Thrive
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
