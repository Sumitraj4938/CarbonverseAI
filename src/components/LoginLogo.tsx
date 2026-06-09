import React from 'react';

interface LoginLogoProps {
  className?: string;
  size?: number | string;
}

export default function LoginLogo({ className = '', size = 16 }: LoginLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Premium gradient to match the client's provided logo */}
        <linearGradient id="login-key-gradient" x1="12" y1="50" x2="88" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E676" />       {/* Mint Green */}
          <stop offset="50%" stopColor="#00BFA5" />      {/* Teal */}
          <stop offset="100%" stopColor="#3B82F6" />     {/* Blue */}
        </linearGradient>
      </defs>

      {/* Horizontal key shank with teeth pointing downwards */}
      <path
        d="M 12 50 
           L 24 50 
           L 24 62 A 1 1 0 0 0 28 62 L 28 50 
           L 36 50 
           L 36 62 A 1 1 0 0 0 40 62 L 40 50 
           L 49 50"
        stroke="url(#login-key-gradient)"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Key Head (Circular outer frame) */}
      <circle
        cx="68"
        cy="50"
        r="20"
        stroke="url(#login-key-gradient)"
        strokeWidth="6.5"
        fill="none"
      />

      {/* Stylized Avatar head */}
      <circle
        cx="68"
        cy="42"
        r="4.8"
        fill="url(#login-key-gradient)"
      />

      {/* Stylized Avatar shoulder/torso chest arc */}
      <path
        d="M 58 60 A 11 11 0 0 1 78 60"
        stroke="url(#login-key-gradient)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
